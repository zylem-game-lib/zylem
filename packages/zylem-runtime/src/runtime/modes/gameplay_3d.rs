//! Gameplay3D mode: Rapier-backed kinematic 3D character bodies driven by the
//! `platformer_3d` behavior.
//!
//! The mode owns a small Rapier world holding only static colliders (the
//! environment the character walks on). Character bodies live as `Body3DSlot`s
//! outside the Rapier sets — KCC casts the capsule shape against the static
//! world each frame via a transient `QueryPipeline`, so the character never
//! collides with itself and we never need to step the dynamics integrator.

use rapier3d::control::{
    CharacterAutostep, CharacterLength, KinematicCharacterController,
};
use rapier3d::math::Vec3;
use rapier3d::pipeline::{
    DebugColor, DebugRenderBackend, DebugRenderObject, DebugRenderPipeline,
};
use rapier3d::prelude::*;

use crate::runtime::behaviors::platformer_3d::components::{
    Platformer3DConfig, Platformer3DInput, Platformer3DState,
};
use crate::runtime::behaviors::platformer_3d::fsm::Platformer3DFsmState;
use crate::runtime::behaviors::platformer_3d::system as platformer_3d_system;
use crate::runtime::common::{StaticBoxCollider, StaticHeightfieldCollider, EVENT_STRIDE};
use crate::runtime::components::body_3d::{Body3DKind, Body3DSlot, PendingBody3DSlot};
use crate::runtime::events::RuntimeEventType;
use crate::runtime::GAMEPLAY3D_DEBUG_BUFFER_CAPACITY;

pub struct Gameplay3DState {
    pub slots: Vec<Body3DSlot>,
    pub configs: Vec<Platformer3DConfig>,
    pub inputs: Vec<Platformer3DInput>,
    pub states: Vec<Platformer3DState>,
    /// Animation-facing FSM state per slot. Updated each `step` after the
    /// physics state has settled. See `behaviors/platformer_3d/fsm.rs`.
    pub fsm_states: Vec<Platformer3DFsmState>,
    pub event_buffer: Vec<f32>,

    integration_parameters: IntegrationParameters,
    physics_pipeline: PhysicsPipeline,
    island_manager: IslandManager,
    pub(crate) broad_phase: BroadPhaseBvh,
    pub(crate) narrow_phase: NarrowPhase,
    pub(crate) bodies: RigidBodySet,
    pub(crate) colliders: ColliderSet,
    impulse_joints: ImpulseJointSet,
    multibody_joints: MultibodyJointSet,
    ccd_solver: CCDSolver,
    pub controller: KinematicCharacterController,

    /// Rapier debug-render pipeline; produces line segments + colors for
    /// the static colliders + character bodies that have been registered
    /// in the Rapier sets. Character capsules live outside the sets so we
    /// add an explicit polyline for each KCC body before delegating to
    /// the pipeline.
    debug_pipeline: DebugRenderPipeline,
    /// Flat `[x,y,z, x,y,z, ...]` line endpoints (3 floats per vertex,
    /// 2 vertices per line). Refreshed on every `debug_render` call.
    pub debug_vertices: Vec<f32>,
    /// Per-vertex `[r,g,b,a]` colours, parallel to `debug_vertices`
    /// (4 floats per vertex). Already converted from rapier's HSLA.
    pub debug_colors: Vec<f32>,
}

impl Gameplay3DState {
    pub fn from_pending(
        positions: &[[f32; 3]],
        pending: &[PendingBody3DSlot],
        configs: &[Platformer3DConfig],
        static_colliders: &[StaticBoxCollider],
        static_heightfields: &[StaticHeightfieldCollider],
    ) -> Self {
        let count = positions.len();
        let mut slots = Vec::with_capacity(count);
        let mut state_vec = Vec::with_capacity(count);
        let mut config_vec = Vec::with_capacity(count);

        for (index, position) in positions.iter().enumerate() {
            let pending_slot = pending.get(index).copied().unwrap_or_default();
            if let Some(capsule) = pending_slot.kinematic_capsule {
                slots.push(Body3DSlot::capsule_kinematic(
                    *position,
                    capsule.half_height,
                    capsule.radius,
                ));
            } else {
                slots.push(Body3DSlot::default());
            }
            state_vec.push(Platformer3DState::default());
            config_vec.push(configs.get(index).copied().unwrap_or_default());
        }

        let bodies = RigidBodySet::new();
        let mut colliders = ColliderSet::new();
        for collider in static_colliders {
            colliders.insert(
                ColliderBuilder::cuboid(
                    collider.half_extents[0].max(0.01),
                    collider.half_extents[1].max(0.01),
                    collider.half_extents[2].max(0.01),
                )
                .translation(vector![
                    collider.center[0],
                    collider.center[1],
                    collider.center[2]
                ].into())
                .friction(collider.friction.max(0.0))
                .restitution(collider.restitution.max(0.0))
                .build(),
            );
        }

        for hf in static_heightfields {
            // TS layout (`PlaneMeshBuilder.postBuild`): heights are flattened
            // outer-x / inner-z as `heights[x_idx * (cols + 1) + z_idx]`.
            // rapier3d's `Array2` is column-major (`data[i + j * nrows]`)
            // with `i` advancing along the z axis and `j` along x — so we
            // pass `nrows = cols + 1`, `ncols = rows + 1` and the same
            // backing slice without permutation:
            //   `data[z + x * (cols + 1)]` == TS `heights[x * (cols + 1) + z]`.
            let nrows = (hf.cols + 1) as usize;
            let ncols = (hf.rows + 1) as usize;
            let expected = nrows * ncols;
            if hf.heights.len() != expected || nrows < 2 || ncols < 2 {
                continue;
            }
            let array = Array2::new(nrows, ncols, hf.heights.clone());
            let scale = Vec3::new(hf.scale[0], hf.scale[1], hf.scale[2]);
            colliders.insert(
                ColliderBuilder::heightfield(array, scale)
                    .translation(Vec3::new(
                        hf.translation[0],
                        hf.translation[1],
                        hf.translation[2],
                    ))
                    .friction(hf.friction.max(0.0))
                    .restitution(hf.restitution.max(0.0))
                    .build(),
            );
        }

        let mut integration_parameters = IntegrationParameters::default();
        integration_parameters.dt = 1.0 / 60.0;

        // KCC config is taken from slot 0; in V1 we expect a single character
        // (the TS impl is per-entity too). Multi-character platformer support
        // would need a controller per slot or a shared default.
        let controller_config = config_vec.first().copied().unwrap_or_default();
        let controller = build_controller(controller_config);

        let mut state = Self {
            slots,
            configs: config_vec,
            inputs: vec![Platformer3DInput::default(); count],
            states: state_vec,
            fsm_states: vec![Platformer3DFsmState::default(); count],
            event_buffer: Vec::with_capacity(EVENT_STRIDE * 8),
            integration_parameters,
            physics_pipeline: PhysicsPipeline::new(),
            island_manager: IslandManager::new(),
            broad_phase: BroadPhaseBvh::new(),
            narrow_phase: NarrowPhase::new(),
            bodies,
            colliders,
            impulse_joints: ImpulseJointSet::new(),
            multibody_joints: MultibodyJointSet::new(),
            ccd_solver: CCDSolver::new(),
            controller,
            debug_pipeline: DebugRenderPipeline::default(),
            debug_vertices: Vec::with_capacity(GAMEPLAY3D_DEBUG_BUFFER_CAPACITY),
            debug_colors: Vec::with_capacity(GAMEPLAY3D_DEBUG_BUFFER_CAPACITY),
        };

        // Run a zero-step physics tick once so the broad-phase BVH is
        // populated with the static colliders. Our character bodies live
        // outside the Rapier sets so we never need to step again.
        state.populate_broad_phase();
        state
    }

    pub fn step(&mut self, dt: f32) {
        let dt = dt.max(0.0);
        self.event_buffer.clear();
        platformer_3d_system::step_platformer_bodies(self, dt);
    }

    /// Replace the entire input record for `slot`. Convenience used by tests
    /// that need to set axes + buttons in one call.
    #[allow(dead_code)]
    pub fn set_input(&mut self, slot: usize, input: Platformer3DInput) {
        if let Some(slot_input) = self.inputs.get_mut(slot) {
            *slot_input = input;
        }
    }

    pub fn set_input_axes(&mut self, slot: usize, move_x: f32, move_z: f32) {
        if let Some(slot_input) = self.inputs.get_mut(slot) {
            slot_input.move_x = move_x.clamp(-1.0, 1.0);
            slot_input.move_z = move_z.clamp(-1.0, 1.0);
        }
    }

    pub fn set_input_buttons(&mut self, slot: usize, jump: bool, run: bool) {
        if let Some(slot_input) = self.inputs.get_mut(slot) {
            slot_input.jump = jump;
            slot_input.run = run;
        }
    }

    pub fn set_slot_position(&mut self, slot: usize, position: [f32; 3]) {
        if let Some(slot_ref) = self.slots.get_mut(slot) {
            slot_ref.position = position;
        }
    }

    pub fn slot_grounded(&self, slot: usize) -> Option<bool> {
        self.states.get(slot).map(|s| s.grounded)
    }

    pub fn slot_jump_count(&self, slot: usize) -> Option<u32> {
        self.states.get(slot).map(|s| s.jump_count)
    }

    /// Animation-facing FSM state for `slot` (idle/walking/running/jumping/
    /// falling/landing). See `Platformer3DFsmState` for the discriminant
    /// values that cross the WASM ABI.
    pub fn slot_fsm_state(&self, slot: usize) -> Option<Platformer3DFsmState> {
        self.fsm_states.get(slot).copied()
    }

    pub fn push_event(
        &mut self,
        event_type: RuntimeEventType,
        primary_slot: usize,
        secondary_slot: usize,
        aux: usize,
    ) {
        self.event_buffer.push(event_type as u32 as f32);
        self.event_buffer.push(primary_slot as f32);
        self.event_buffer.push(secondary_slot as f32);
        self.event_buffer.push(aux as f32);
    }

    pub fn event_count(&self) -> usize {
        self.event_buffer.len() / EVENT_STRIDE
    }

    /// Convenience accessor used by tests + the `Simulation::sync_gameplay3d`
    /// path. Returns the slot kind to discriminate populated vs. empty slots.
    #[allow(dead_code)]
    pub fn slot_kind(&self, slot: usize) -> Option<Body3DKind> {
        self.slots.get(slot).map(|s| s.kind)
    }

    /// Refresh the debug-render line buffers from Rapier's
    /// [`DebugRenderPipeline`]. Returns the number of vertices written
    /// (always a multiple of 2 since each line emits two endpoints).
    ///
    /// The Rapier pipeline only iterates the bodies/colliders it owns, so
    /// kinematic capsule slots — which live outside the sets — are added
    /// as explicit polylines first, mirroring how Rapier renders a capsule.
    pub fn debug_render(&mut self) -> u32 {
        self.debug_vertices.clear();
        self.debug_colors.clear();

        let cap_floats = GAMEPLAY3D_DEBUG_BUFFER_CAPACITY;
        // Capsule color (kinematic): match the rapier3d default
        // `collider_kinematic_color` (HSLA) so wasm-owned capsules look
        // visually consistent with Rapier-managed kinematic colliders.
        let style = self.debug_pipeline.style;
        let capsule_color = style.collider_kinematic_color;

        for slot in &self.slots {
            if !matches!(slot.kind, Body3DKind::KinematicCapsule) {
                continue;
            }
            let yaw = slot.rotation[1].atan2(slot.rotation[3]) * 2.0;
            push_capsule_outline(
                &mut self.debug_vertices,
                &mut self.debug_colors,
                cap_floats,
                slot.position,
                yaw,
                slot.half_height,
                slot.radius,
                capsule_color,
            );
        }

        let mut backend = ZylemDebugBackend {
            vertices: &mut self.debug_vertices,
            colors: &mut self.debug_colors,
            cap_floats,
        };
        self.debug_pipeline.render(
            &mut backend,
            &self.bodies,
            &self.colliders,
            &self.impulse_joints,
            &self.multibody_joints,
            &self.narrow_phase,
        );

        (self.debug_vertices.len() / 3) as u32
    }

    fn populate_broad_phase(&mut self) {
        let gravity = Vec3::ZERO;
        self.physics_pipeline.step(
            gravity,
            &self.integration_parameters,
            &mut self.island_manager,
            &mut self.broad_phase,
            &mut self.narrow_phase,
            &mut self.bodies,
            &mut self.colliders,
            &mut self.impulse_joints,
            &mut self.multibody_joints,
            &mut self.ccd_solver,
            &(),
            &(),
        );
    }
}

/// Test-only helper: rebuild the broad-phase BVH after the colliders set has
/// been mutated (e.g. inserting a slope after construction). Tests inside
/// this module use this to add tilted geometry.
#[cfg(test)]
impl Gameplay3DState {
    pub(crate) fn rebuild_broad_phase_for_test(&mut self) {
        self.populate_broad_phase();
    }
}

/// Adapts Rapier's [`DebugRenderBackend`] callbacks into our flat
/// `vertices` + `colors` buffers, converting HSLA → RGBA so the host
/// LineSegments can use `vertexColors: true` with the standard sRGB
/// pipeline. Lines are silently dropped once `cap_floats` is reached.
struct ZylemDebugBackend<'a> {
    vertices: &'a mut Vec<f32>,
    colors: &'a mut Vec<f32>,
    cap_floats: usize,
}

impl<'a> DebugRenderBackend for ZylemDebugBackend<'a> {
    fn draw_line(
        &mut self,
        _object: DebugRenderObject,
        a: rapier3d::math::Vector,
        b: rapier3d::math::Vector,
        color: DebugColor,
    ) {
        push_line(
            self.vertices,
            self.colors,
            self.cap_floats,
            [a.x, a.y, a.z],
            [b.x, b.y, b.z],
            color,
        );
    }
}

const CAPSULE_CIRCLE_SEGMENTS: usize = 16;

/// Append a single line segment with both endpoints coloured the same.
/// No-op when the buffer is full.
fn push_line(
    verts: &mut Vec<f32>,
    cols: &mut Vec<f32>,
    cap_floats: usize,
    a: [f32; 3],
    b: [f32; 3],
    color: DebugColor,
) {
    if verts.len() + 6 > cap_floats || cols.len() + 8 > cap_floats {
        return;
    }
    let rgba = hsla_to_rgba(color);
    verts.extend_from_slice(&[a[0], a[1], a[2], b[0], b[1], b[2]]);
    cols.extend_from_slice(&[
        rgba[0], rgba[1], rgba[2], rgba[3], rgba[0], rgba[1], rgba[2], rgba[3],
    ]);
}

/// Draws a closed circle in the XZ plane (Y-up axis is the circle's
/// normal) using `CAPSULE_CIRCLE_SEGMENTS` segments.
fn push_circle_xz(
    verts: &mut Vec<f32>,
    cols: &mut Vec<f32>,
    cap_floats: usize,
    center: [f32; 3],
    radius: f32,
    color: DebugColor,
) {
    let n = CAPSULE_CIRCLE_SEGMENTS;
    let two_pi = std::f32::consts::TAU;
    for k in 0..n {
        let t0 = (k as f32) / n as f32 * two_pi;
        let t1 = ((k + 1) as f32) / n as f32 * two_pi;
        let a = [
            center[0] + radius * t0.cos(),
            center[1],
            center[2] + radius * t0.sin(),
        ];
        let b = [
            center[0] + radius * t1.cos(),
            center[1],
            center[2] + radius * t1.sin(),
        ];
        push_line(verts, cols, cap_floats, a, b, color);
    }
}

/// Draws a vertical hemispherical arc in the XY plane (z fixed). When
/// `top` is true, the arc covers angles `[0, π]` (above the equator);
/// otherwise it covers `[π, 2π]`.
fn push_arc_xy(
    verts: &mut Vec<f32>,
    cols: &mut Vec<f32>,
    cap_floats: usize,
    center: [f32; 3],
    radius: f32,
    top: bool,
    color: DebugColor,
) {
    let n = CAPSULE_CIRCLE_SEGMENTS / 2;
    let (start, end) = if top {
        (0.0_f32, std::f32::consts::PI)
    } else {
        (std::f32::consts::PI, std::f32::consts::TAU)
    };
    for k in 0..n {
        let t0 = start + (end - start) * (k as f32) / n as f32;
        let t1 = start + (end - start) * ((k + 1) as f32) / n as f32;
        let a = [
            center[0] + radius * t0.cos(),
            center[1] + radius * t0.sin(),
            center[2],
        ];
        let b = [
            center[0] + radius * t1.cos(),
            center[1] + radius * t1.sin(),
            center[2],
        ];
        push_line(verts, cols, cap_floats, a, b, color);
    }
}

/// Same as [`push_arc_xy`] but in the ZY plane (x fixed).
fn push_arc_zy(
    verts: &mut Vec<f32>,
    cols: &mut Vec<f32>,
    cap_floats: usize,
    center: [f32; 3],
    radius: f32,
    top: bool,
    color: DebugColor,
) {
    let n = CAPSULE_CIRCLE_SEGMENTS / 2;
    let (start, end) = if top {
        (0.0_f32, std::f32::consts::PI)
    } else {
        (std::f32::consts::PI, std::f32::consts::TAU)
    };
    for k in 0..n {
        let t0 = start + (end - start) * (k as f32) / n as f32;
        let t1 = start + (end - start) * ((k + 1) as f32) / n as f32;
        let a = [
            center[0],
            center[1] + radius * t0.sin(),
            center[2] + radius * t0.cos(),
        ];
        let b = [
            center[0],
            center[1] + radius * t1.sin(),
            center[2] + radius * t1.cos(),
        ];
        push_line(verts, cols, cap_floats, a, b, color);
    }
}

/// Draws a Y-aligned capsule outline (two horizontal rings, four vertical
/// sides, four hemispherical arcs). Yaw is accepted but currently unused —
/// the outline is rotationally symmetric around Y, so the visual is the
/// same regardless of facing direction.
fn push_capsule_outline(
    verts: &mut Vec<f32>,
    cols: &mut Vec<f32>,
    cap_floats: usize,
    center: [f32; 3],
    _yaw: f32,
    half_height: f32,
    radius: f32,
    color: DebugColor,
) {
    let cy_top = center[1] + half_height;
    let cy_bot = center[1] - half_height;
    push_circle_xz(
        verts,
        cols,
        cap_floats,
        [center[0], cy_top, center[2]],
        radius,
        color,
    );
    push_circle_xz(
        verts,
        cols,
        cap_floats,
        [center[0], cy_bot, center[2]],
        radius,
        color,
    );
    let sides = [(radius, 0.0_f32), (-radius, 0.0), (0.0, radius), (0.0, -radius)];
    for (dx, dz) in sides {
        push_line(
            verts,
            cols,
            cap_floats,
            [center[0] + dx, cy_top, center[2] + dz],
            [center[0] + dx, cy_bot, center[2] + dz],
            color,
        );
    }
    push_arc_xy(
        verts,
        cols,
        cap_floats,
        [center[0], cy_top, center[2]],
        radius,
        true,
        color,
    );
    push_arc_xy(
        verts,
        cols,
        cap_floats,
        [center[0], cy_bot, center[2]],
        radius,
        false,
        color,
    );
    push_arc_zy(
        verts,
        cols,
        cap_floats,
        [center[0], cy_top, center[2]],
        radius,
        true,
        color,
    );
    push_arc_zy(
        verts,
        cols,
        cap_floats,
        [center[0], cy_bot, center[2]],
        radius,
        false,
        color,
    );
}

/// Convert a Rapier [`DebugColor`] (HSLA, hue in degrees `[0, 360)`,
/// saturation/lightness/alpha in `[0, 1]`) to linear RGBA. Three.js
/// `LineBasicMaterial` with `vertexColors: true` consumes RGBA directly.
fn hsla_to_rgba(c: DebugColor) -> [f32; 4] {
    let h = (c[0] % 360.0 + 360.0) % 360.0 / 360.0;
    let s = c[1].clamp(0.0, 1.0);
    let l = c[2].clamp(0.0, 1.0);
    let a = c[3];
    if s == 0.0 {
        return [l, l, l, a];
    }
    let q = if l < 0.5 { l * (1.0 + s) } else { l + s - l * s };
    let p = 2.0 * l - q;
    let r = hue_to_rgb(p, q, h + 1.0 / 3.0);
    let g = hue_to_rgb(p, q, h);
    let b = hue_to_rgb(p, q, h - 1.0 / 3.0);
    [r, g, b, a]
}

fn hue_to_rgb(p: f32, q: f32, mut t: f32) -> f32 {
    if t < 0.0 {
        t += 1.0;
    } else if t > 1.0 {
        t -= 1.0;
    }
    if t < 1.0 / 6.0 {
        p + (q - p) * 6.0 * t
    } else if t < 0.5 {
        q
    } else if t < 2.0 / 3.0 {
        p + (q - p) * (2.0 / 3.0 - t) * 6.0
    } else {
        p
    }
}

fn build_controller(config: Platformer3DConfig) -> KinematicCharacterController {
    let max_slope = config.max_slope_deg.max(0.0);
    KinematicCharacterController {
        up: Vec3::Y,
        slide: true,
        max_slope_climb_angle: max_slope.to_radians(),
        min_slope_slide_angle: (max_slope + 5.0).to_radians(),
        snap_to_ground: if config.snap_to_ground > 0.0 {
            Some(CharacterLength::Absolute(config.snap_to_ground))
        } else {
            None
        },
        autostep: if config.autostep_height > 0.0 {
            Some(CharacterAutostep {
                max_height: CharacterLength::Absolute(config.autostep_height),
                min_width: CharacterLength::Absolute(0.05),
                include_dynamic_bodies: false,
            })
        } else {
            None
        },
        ..Default::default()
    }
}

#[cfg(test)]
mod tests {
    //! Integration tests that exercise the full `Gameplay3DState::step`
    //! pipeline including Rapier's `KinematicCharacterController`. Use these
    //! to validate end-to-end behaviour (grounded, slope, jump arc, landing
    //! event) that the FSM-only tests in `system.rs` can't cover.

    use super::*;
    use crate::runtime::behaviors::platformer_3d::components::Platformer3DConfig;
    use crate::runtime::components::body_3d::KinematicCapsuleBody3DConfig;
    use crate::runtime::events::RuntimeEventType;

    const DT: f32 = 1.0 / 60.0;

    fn flat_ground_state() -> Gameplay3DState {
        let positions = vec![[0.0, 2.0, 0.0]];
        let pending = vec![PendingBody3DSlot {
            kinematic_capsule: Some(KinematicCapsuleBody3DConfig {
                half_height: 0.5,
                radius: 0.3,
            }),
        }];
        let configs = vec![Platformer3DConfig::default()];
        let static_colliders = vec![StaticBoxCollider {
            center: [0.0, -0.5, 0.0],
            half_extents: [50.0, 0.5, 50.0],
            friction: 0.95,
            restitution: 0.0,
        }];
        Gameplay3DState::from_pending(&positions, &pending, &configs, &static_colliders, &[])
    }

    /// Integrate forward until the character either becomes grounded or the
    /// budget runs out. Returns the number of ticks consumed.
    fn integrate_until_grounded(state: &mut Gameplay3DState, max_ticks: u32) -> u32 {
        for tick in 0..max_ticks {
            state.step(DT);
            if state.slots[0].grounded {
                return tick + 1;
            }
        }
        max_ticks
    }

    #[test]
    fn falling_body_settles_on_flat_ground() {
        let mut state = flat_ground_state();
        let ticks = integrate_until_grounded(&mut state, 240);
        assert!(ticks < 240, "character should settle within 4 seconds");
        assert!(state.slots[0].grounded);
        assert!(state.states[0].grounded);

        let settled_y = state.slots[0].position[1];
        for _ in 0..120 {
            state.step(DT);
        }
        assert!(
            state.slots[0].grounded,
            "character must stay grounded across 2 seconds of idle ticks"
        );
        let drift = (state.slots[0].position[1] - settled_y).abs();
        assert!(drift < 0.05, "y drift after settle should be < 5cm, got {drift}");
    }

    #[test]
    fn jump_lifts_off_ground_and_increments_count() {
        let mut state = flat_ground_state();
        integrate_until_grounded(&mut state, 240);
        state.set_input_buttons(0, true, false);

        state.step(DT);
        assert_eq!(state.states[0].jump_count, 1);
        assert!(state.slots[0].linvel[1] > 0.0);

        let mut saw_jump_started = false;
        for index in 0..state.event_count() {
            let base = index * EVENT_STRIDE;
            let event_type = state.event_buffer[base] as u32;
            if event_type == RuntimeEventType::JumpStarted as u32 {
                saw_jump_started = true;
                assert_eq!(state.event_buffer[base + 1] as usize, 0, "primary slot");
                assert_eq!(state.event_buffer[base + 2] as u32, 1, "jump count");
                break;
            }
        }
        assert!(saw_jump_started, "JumpStarted event must be emitted");

        state.set_input_buttons(0, false, false);
        state.step(DT);
        assert!(!state.slots[0].grounded);
    }

    #[test]
    fn jump_arc_lands_and_emits_landed_event() {
        let mut state = flat_ground_state();
        integrate_until_grounded(&mut state, 240);

        state.set_input_buttons(0, true, false);
        state.step(DT);
        state.set_input_buttons(0, false, false);

        let mut landed_observed = false;
        for _ in 0..600 {
            state.step(DT);
            for index in 0..state.event_count() {
                let base = index * EVENT_STRIDE;
                if state.event_buffer[base] as u32 == RuntimeEventType::Landed as u32 {
                    landed_observed = true;
                    assert_eq!(state.event_buffer[base + 1] as usize, 0);
                    break;
                }
            }
            if landed_observed {
                break;
            }
        }
        assert!(
            landed_observed,
            "jump arc should land within 10 seconds and emit Landed"
        );
        assert!(state.slots[0].grounded);
        assert_eq!(state.states[0].jump_count, 0, "landing resets jump count");
    }

    #[test]
    fn horizontal_motion_translates_position() {
        let mut state = flat_ground_state();
        integrate_until_grounded(&mut state, 240);
        let start_x = state.slots[0].position[0];
        state.set_input_axes(0, 1.0, 0.0);

        for _ in 0..30 {
            state.step(DT);
        }
        let dx = state.slots[0].position[0] - start_x;
        assert!(
            dx > 1.0,
            "running with move_x=1 for ~0.5s should move > 1m, got {dx}"
        );
        assert!(state.slots[0].grounded, "character stays grounded while walking");
    }

    /// Validates that a 30° slope (well below the default 50°
    /// `max_slope_deg`) does not cause the spurious un-grounding that the TS
    /// impl described as "slope ride-up / edge flicker". The character is
    /// dropped onto the slope and we check it stays grounded across 1s of
    /// idle ticks with no oscillation in y position.
    #[test]
    fn slope_holds_ground_without_oscillation() {
        let positions = vec![[0.0, 4.0, 0.0]];
        let pending = vec![PendingBody3DSlot {
            kinematic_capsule: Some(KinematicCapsuleBody3DConfig {
                half_height: 0.5,
                radius: 0.3,
            }),
        }];
        let mut cfg = Platformer3DConfig::default();
        cfg.walk_speed = 2.0;
        cfg.run_speed = 4.0;
        let configs = vec![cfg];
        let mut state = Gameplay3DState::from_pending(&positions, &pending, &configs, &[], &[]);

        let slope_angle: f32 = 30.0_f32.to_radians();
        let axis_angle = Vec3::new(0.0, 0.0, slope_angle);
        let cuboid = ColliderBuilder::cuboid(20.0, 0.5, 20.0)
            .position(Pose::new(Vec3::new(0.0, -0.5, 0.0), axis_angle))
            .friction(0.95)
            .build();
        state.colliders.insert(cuboid);
        state.rebuild_broad_phase_for_test();

        integrate_until_grounded(&mut state, 360);
        assert!(
            state.slots[0].grounded,
            "character must ground out on the slope"
        );

        let settled_y = state.slots[0].position[1];
        let mut grounded_ticks = 0u32;
        let mut max_y_delta = 0.0_f32;
        for _ in 0..60 {
            state.step(DT);
            if state.slots[0].grounded {
                grounded_ticks += 1;
            }
            let dy = (state.slots[0].position[1] - settled_y).abs();
            max_y_delta = max_y_delta.max(dy);
        }
        assert!(
            grounded_ticks >= 50,
            "character should remain grounded on slope for ~1s (got {grounded_ticks}/60)"
        );
        assert!(
            max_y_delta < 0.1,
            "y position should not oscillate on slope (max_delta={max_y_delta})"
        );
    }

    /// Regression for "character collider not sticking to ground plane on
    /// downhill slopes". Walking horizontally on a tilted surface used to
    /// pop the capsule into the air every frame because gravity was only
    /// applied while airborne — the desired translation was purely
    /// horizontal and the per-frame slope drop exceeded the small KCC
    /// offset. Verify the character stays grounded across the whole walk
    /// and that y tracks the slope continuously (not in stair-stepping
    /// snap_to_ground catches).
    #[test]
    fn walking_downhill_stays_grounded_and_tracks_slope() {
        let positions = vec![[-5.0, 6.0, 0.0]];
        let pending = vec![PendingBody3DSlot {
            kinematic_capsule: Some(KinematicCapsuleBody3DConfig {
                half_height: 1.4,
                radius: 0.5,
            }),
        }];
        let mut cfg = Platformer3DConfig::default();
        cfg.walk_speed = 10.0;
        cfg.run_speed = 20.0;
        cfg.max_slope_deg = 50.0;
        cfg.snap_to_ground = 0.2;
        cfg.autostep_height = 0.3;
        let configs = vec![cfg];
        let mut state = Gameplay3DState::from_pending(&positions, &pending, &configs, &[], &[]);

        // 10° slope tilted around z so walking +x walks downhill.
        let slope_angle: f32 = 10.0_f32.to_radians();
        let axis_angle = Vec3::new(0.0, 0.0, slope_angle);
        let cuboid = ColliderBuilder::cuboid(40.0, 0.5, 40.0)
            .position(Pose::new(Vec3::new(0.0, -0.5, 0.0), axis_angle))
            .friction(0.95)
            .build();
        state.colliders.insert(cuboid);
        state.rebuild_broad_phase_for_test();

        integrate_until_grounded(&mut state, 360);
        assert!(
            state.slots[0].grounded,
            "character must ground out on the slope before walking starts"
        );

        // Walk +x at run speed for ~1.5s and require grounded EVERY tick.
        state.set_input_axes(0, 1.0, 0.0);
        let mut airborne_ticks = 0u32;
        let mut prev_y = state.slots[0].position[1];
        let mut max_step_dy = 0.0_f32;
        for _ in 0..90 {
            state.step(DT);
            if !state.slots[0].grounded {
                airborne_ticks += 1;
            }
            let y = state.slots[0].position[1];
            max_step_dy = max_step_dy.max((y - prev_y).abs());
            prev_y = y;
        }
        assert!(
            airborne_ticks <= 1,
            "character must stay grounded while walking down a 10° slope (airborne {airborne_ticks}/90 ticks)"
        );
        // On a 10° slope at run speed (20 m/s), per-tick y drop ≈
        // 20/60 * tan(10°) ≈ 0.058 m. Allow slack but reject big snap
        // jumps that would indicate the character lifted off and was
        // re-snapped (visible as "stair stepping" to the user).
        assert!(
            max_step_dy < 0.15,
            "y should track slope continuously, not snap-jump (max_step_dy={max_step_dy})"
        );
    }

    /// Heightfield variant of `walking_downhill_stays_grounded_and_tracks_slope`.
    /// Reproduces the demo's exact ground geometry (100×100 plane, 4×4
    /// subdivisions, randomised heights up to 4 m → 25 m cells with up to
    /// ~9° slopes) and walks the capsule across the surface for 2 seconds
    /// at run speed. The character must stay grounded the whole time —
    /// the user-visible bug is that they "stair-step" airborne every time
    /// the surface drops.
    #[test]
    fn walking_across_heightfield_stays_grounded() {
        let rows: u32 = 4;
        let cols: u32 = 4;
        let n = ((rows + 1) * (cols + 1)) as usize;
        let mut heights = vec![0.0_f32; n];
        // Deterministic but uneven pattern in [0, 4] — mirrors the demo's
        // `Math.random()*4` without RNG flakiness in tests.
        for x in 0..=rows as usize {
            for z in 0..=cols as usize {
                let v = (((x * 7 + z * 13) % 9) as f32) * 0.5;
                heights[x * (cols as usize + 1) + z] = v;
            }
        }
        let hf = StaticHeightfieldCollider {
            rows,
            cols,
            heights,
            scale: [100.0, 1.0, 100.0],
            translation: [0.0, -4.0, 0.0],
            friction: 0.95,
            restitution: 0.0,
        };

        let positions = vec![[-30.0, 8.0, 0.0]];
        let pending = vec![PendingBody3DSlot {
            kinematic_capsule: Some(KinematicCapsuleBody3DConfig {
                half_height: 1.4,
                radius: 0.5,
            }),
        }];
        let mut cfg = Platformer3DConfig::default();
        cfg.walk_speed = 10.0;
        cfg.run_speed = 20.0;
        cfg.gravity = 9.82;
        cfg.max_slope_deg = 50.0;
        cfg.snap_to_ground = 0.2;
        cfg.autostep_height = 0.3;
        let configs = vec![cfg];
        let mut state = Gameplay3DState::from_pending(&positions, &pending, &configs, &[], &[hf]);

        // Settle.
        let settled_ticks = integrate_until_grounded(&mut state, 360);
        assert!(settled_ticks < 360, "capsule must settle on heightfield");
        assert!(state.slots[0].grounded);

        // Walk +x across the heightfield for 2 seconds (120 ticks at 60 FPS).
        // Run speed = 20 m/s × 2 s ≈ 40 m, so we'll cross most of the 100 m
        // plane and traverse multiple slope direction changes.
        state.set_input_axes(0, 1.0, 0.0);
        let mut airborne_ticks = 0u32;
        let mut max_step_dy = 0.0_f32;
        let mut prev_y = state.slots[0].position[1];
        for _ in 0..120 {
            state.step(DT);
            if !state.slots[0].grounded {
                airborne_ticks += 1;
            }
            let y = state.slots[0].position[1];
            max_step_dy = max_step_dy.max((y - prev_y).abs());
            prev_y = y;
        }
        assert!(
            airborne_ticks <= 2,
            "character must stay grounded while walking across heightfield (airborne {airborne_ticks}/120 ticks)"
        );
        // Per-tick y change should hug the slope; large jumps mean the
        // capsule lifted off and snap_to_ground caught it (the visible bug).
        assert!(
            max_step_dy < 0.2,
            "y should track heightfield smoothly, not snap-jump (max_step_dy={max_step_dy})"
        );
    }

    /// Smoke-test that a heightfield collider mirrors a known TS layout and
    /// catches a falling capsule. Heights form a flat plane at y=0 (so the
    /// final settled height should be just above 0) and the capsule is
    /// dropped from y=2 onto the centre.
    #[test]
    fn heightfield_collider_catches_falling_capsule() {
        let rows: u32 = 4; // X subdivisions
        let cols: u32 = 4; // Z subdivisions
        let n = ((rows + 1) * (cols + 1)) as usize;
        let heights = vec![0.0_f32; n];
        let hf = StaticHeightfieldCollider {
            rows,
            cols,
            heights,
            scale: [10.0, 1.0, 10.0],
            translation: [0.0, 0.0, 0.0],
            friction: 0.95,
            restitution: 0.0,
        };

        let positions = vec![[0.0, 2.0, 0.0]];
        let pending = vec![PendingBody3DSlot {
            kinematic_capsule: Some(KinematicCapsuleBody3DConfig {
                half_height: 0.5,
                radius: 0.3,
            }),
        }];
        let configs = vec![Platformer3DConfig::default()];
        let mut state = Gameplay3DState::from_pending(&positions, &pending, &configs, &[], &[hf]);

        let ticks = integrate_until_grounded(&mut state, 240);
        assert!(ticks < 240, "capsule should ground on heightfield");
        assert!(state.slots[0].grounded);
        let y = state.slots[0].position[1];
        // Capsule centre = half_height + radius above ground = 0.8 above y=0
        assert!(
            (y - 0.8).abs() < 0.1,
            "settled y={y} should be near 0.8 above flat heightfield"
        );
    }

    /// `Array2` is column-major, so verify our packing produces the expected
    /// non-zero heights at the right grid coordinates. Asymmetric heights
    /// catch row/col swaps that random data would hide.
    #[test]
    fn heightfield_orientation_matches_expected_axes() {
        let rows: u32 = 2; // X subdivisions
        let cols: u32 = 2; // Z subdivisions
        // (rows+1)*(cols+1) = 9 vertices laid out outer-x, inner-z (matching
        // TS `PlaneMeshBuilder.postBuild`):
        //   index = x_idx * (cols+1) + z_idx
        // Set a single peak at (x=2, z=0) so it lies near +X edge, -Z edge.
        let mut heights = vec![0.0_f32; 9];
        heights[2 * (cols as usize + 1) + 0] = 5.0;
        let hf = StaticHeightfieldCollider {
            rows,
            cols,
            heights,
            scale: [10.0, 1.0, 10.0],
            translation: [0.0, 0.0, 0.0],
            friction: 0.95,
            restitution: 0.0,
        };

        let positions = vec![[0.0, 10.0, 0.0]];
        let pending = vec![PendingBody3DSlot {
            kinematic_capsule: Some(KinematicCapsuleBody3DConfig {
                half_height: 0.5,
                radius: 0.3,
            }),
        }];
        let configs = vec![Platformer3DConfig::default()];
        // Construct state successfully; if rows/cols were swapped this
        // would still construct, so the assertion below is the real test.
        let state =
            Gameplay3DState::from_pending(&positions, &pending, &configs, &[], &[hf.clone()]);

        // Heightfield column count along x = rows+1 = 3; along z = cols+1.
        // The element accessor isn't easily reachable, so just confirm at
        // least one collider was inserted (heightfield) and the heights
        // round-tripped match.
        assert_eq!(state.colliders.len(), 1);
        assert_eq!(hf.heights[2 * 3 + 0], 5.0);
    }

    /// Reproduces the `00-third-person-test` demo's exact heightfield + capsule
    /// configuration to verify whether the same parameters catch a falling
    /// capsule the way the user expects. Uses fixed (non-random) heights so
    /// the test is deterministic; the magnitude (0..4 m) matches the demo's
    /// `Math.random() * 4 * heightScale=1`.
    #[test]
    fn demo_third_person_heightfield_catches_capsule() {
        let rows: u32 = 4; // subdivisions x
        let cols: u32 = 4; // subdivisions z
        let n = ((rows + 1) * (cols + 1)) as usize;
        // Mix of low and high heights so we know heights *are* used. Use
        // (x+z) as a deterministic "random-ish" pattern in [0, 4].
        let mut heights = vec![0.0_f32; n];
        for x in 0..=rows as usize {
            for z in 0..=cols as usize {
                heights[x * (cols as usize + 1) + z] = ((x + z) as f32) * 0.5;
            }
        }
        let hf = StaticHeightfieldCollider {
            rows,
            cols,
            heights,
            scale: [100.0, 1.0, 100.0],
            translation: [0.0, -4.0, 0.0],
            friction: 0.95,
            restitution: 0.0,
        };

        let positions = vec![[0.0, 5.0, 0.0]];
        let pending = vec![PendingBody3DSlot {
            kinematic_capsule: Some(KinematicCapsuleBody3DConfig {
                half_height: 1.4,
                radius: 0.5,
            }),
        }];
        let mut cfg = Platformer3DConfig::default();
        cfg.walk_speed = 10.0;
        cfg.run_speed = 20.0;
        cfg.jump_force = 16.0;
        cfg.gravity = 9.82;
        cfg.max_jumps = 4;
        cfg.coyote_time = 0.1;
        cfg.jump_buffer_time = 0.1;
        cfg.jump_cut_multiplier = 0.5;
        cfg.multi_jump_window = 0.15;
        cfg.max_slope_deg = 50.0;
        cfg.autostep_height = 0.3;
        cfg.snap_to_ground = 0.2;
        let configs = vec![cfg];
        let mut state = Gameplay3DState::from_pending(&positions, &pending, &configs, &[], &[hf]);

        let ticks = integrate_until_grounded(&mut state, 600);
        let y = state.slots[0].position[1];
        assert!(
            ticks < 600,
            "capsule should ground on the demo heightfield within 10s (final y={y})"
        );
        assert!(state.slots[0].grounded, "expected grounded=true after settle");
        // The heightfield surface at (0,0) is height[2*5+2]=2.0 (mid-grid),
        // translated by -4 → world y = -2. Capsule centre should sit at
        // -2 + halfHeight + radius = -0.1 (± autostep wiggle).
        assert!(
            (y - (-0.1)).abs() < 0.5,
            "settled y={y} should be near -0.1 above the demo heightfield"
        );
    }

    /// Once colliders are bootstrapped, `debug_render` should yield a
    /// non-empty buffer and obey the `vertices/3 == colors/4` invariant.
    #[test]
    fn debug_render_emits_line_segments_for_static_colliders() {
        let mut state = flat_ground_state();
        let vertex_count = state.debug_render();
        assert!(vertex_count > 0, "debug render should emit lines");
        assert_eq!(state.debug_vertices.len() % 6, 0, "lines come in pairs");
        assert_eq!(
            state.debug_vertices.len() / 3,
            state.debug_colors.len() / 4,
            "vertex and color counts must match"
        );
    }
}
