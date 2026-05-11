//! `StageSimulation`: the unified Shipyard `World` + Rapier `RigidBodySet`
//! that owns every entity in a Zylem `ZylemStage`. This is the only mode
//! exposed by `crate::stage_ffi`; the legacy mode-based `Simulation` in
//! `crate::runtime` will be removed once the migration is complete.

use rapier3d::control::KinematicCharacterController;
use rapier3d::prelude::*;
use shipyard::{EntityId, World};

use crate::runtime::stage::behaviors::{
    cooldown, first_person, jumper_2d, jumper_3d, platformer_3d as platformer,
    screen_wrap, shooter_2d, thruster, top_down_movement, world_boundary,
};
use crate::runtime::stage::body::{build_collider, BodyConfig, ColliderConfig};
use crate::runtime::stage::events::{EventBuffer, StageEvent, StageEventType};
use crate::runtime::stage::render::{RenderSlot, STAGE_RENDER_STRIDE};
use crate::runtime::stage::slot_table::{SlotTable, INVALID_SLOT};

/// Shared scratch buffer (in `f32`s) for mesh-based collider data
/// (convex hull / trimesh / heightfield) and ad-hoc query results.
pub const STAGE_SCRATCH_CAPACITY: usize = 1 << 20; // 1M floats = 4 MiB

/// Pose scratch is a fixed-size buffer the host reads when fetching a
/// single entity's pose: `[pos.xyz, quat.xyzw]`.
pub const POSE_SCRATCH_LEN: usize = 7;

/// Behavior-query scratch: maximum payload size any `query_*` writes.
pub const QUERY_SCRATCH_LEN: usize = 16;

pub struct StageSimulation {
    pub world: World,
    pub slots: SlotTable,
    pub gravity: rapier3d::math::Vec3,
    pub integration_parameters: IntegrationParameters,
    pub physics_pipeline: PhysicsPipeline,
    pub island_manager: IslandManager,
    pub broad_phase: BroadPhaseBvh,
    pub narrow_phase: NarrowPhase,
    pub bodies: RigidBodySet,
    pub colliders: ColliderSet,
    pub impulse_joints: ImpulseJointSet,
    pub multibody_joints: MultibodyJointSet,
    pub ccd_solver: CCDSolver,
    pub character_controller: KinematicCharacterController,
    pub render_buffer: Vec<f32>,
    pub events: EventBuffer,
    pub scratch_buffer: Vec<f32>,
    pub pose_scratch: [f32; POSE_SCRATCH_LEN],
    pub query_scratch: [f32; QUERY_SCRATCH_LEN],
    pub vec3_scratch: [f32; 3],
    pub tick_count: u32,
}

impl StageSimulation {
    pub fn new(initial_capacity: usize) -> Self {
        let cap = initial_capacity.max(8);
        let mut integration_parameters = IntegrationParameters::default();
        integration_parameters.dt = 1.0 / 60.0;

        Self {
            world: World::new(),
            slots: SlotTable::with_capacity(cap),
            gravity: rapier3d::math::Vec3::new(0.0, -9.81, 0.0),
            integration_parameters,
            physics_pipeline: PhysicsPipeline::new(),
            island_manager: IslandManager::new(),
            broad_phase: BroadPhaseBvh::new(),
            narrow_phase: NarrowPhase::new(),
            bodies: RigidBodySet::new(),
            colliders: ColliderSet::new(),
            impulse_joints: ImpulseJointSet::new(),
            multibody_joints: MultibodyJointSet::new(),
            ccd_solver: CCDSolver::new(),
            character_controller: KinematicCharacterController::default(),
            render_buffer: vec![0.0; cap * STAGE_RENDER_STRIDE],
            events: EventBuffer::with_capacity(cap.max(64)),
            scratch_buffer: vec![0.0; STAGE_SCRATCH_CAPACITY],
            pose_scratch: [0.0; POSE_SCRATCH_LEN],
            query_scratch: [0.0; QUERY_SCRATCH_LEN],
            vec3_scratch: [0.0; 3],
            tick_count: 0,
        }
    }

    pub fn set_gravity(&mut self, x: f32, y: f32, z: f32) {
        self.gravity = rapier3d::math::Vec3::new(x, y, z);
    }

    // ─── Entity lifecycle ───────────────────────────────────────────────────

    pub fn create_entity(&mut self) -> u32 {
        let slot = self.slots.allocate();
        if slot == INVALID_SLOT {
            return INVALID_SLOT;
        }
        let entity_id = self.world.add_entity(());
        if let Some(slot_ref) = self.slots.get_mut(slot) {
            slot_ref.entity_id = Some(entity_id);
        }
        self.ensure_render_capacity();
        slot
    }

    pub fn destroy_entity(&mut self, slot: u32) -> bool {
        let snapshot = match self.slots.release(slot) {
            Some(s) => s,
            None => return false,
        };
        if let Some(body) = snapshot.body {
            self.bodies.remove(
                body,
                &mut self.island_manager,
                &mut self.colliders,
                &mut self.impulse_joints,
                &mut self.multibody_joints,
                true,
            );
        }
        for collider in snapshot.colliders {
            self.colliders.remove(
                collider,
                &mut self.island_manager,
                &mut self.bodies,
                false,
            );
        }
        if let Some(eid) = snapshot.entity_id {
            let _ = self.world.delete_entity(eid);
        }
        // Zero out the render slot so visual layers don't see stale data.
        let base = slot as usize * STAGE_RENDER_STRIDE;
        if base + STAGE_RENDER_STRIDE <= self.render_buffer.len() {
            for i in 0..STAGE_RENDER_STRIDE {
                self.render_buffer[base + i] = 0.0;
            }
        }
        true
    }

    pub fn active_count(&self) -> u32 {
        self.slots.active_count()
    }

    pub fn capacity(&self) -> u32 {
        self.slots.capacity() as u32
    }

    // ─── Body / collider attach ─────────────────────────────────────────────

    pub fn attach_body(&mut self, slot: u32, config: BodyConfig) -> bool {
        let Some(slot_ref) = self.slots.get_mut(slot) else {
            return false;
        };
        if slot_ref.body.is_some() {
            return false;
        }
        let body = config.build();
        let handle = self.bodies.insert(body);
        slot_ref.body = Some(handle);
        true
    }

    pub fn add_collider(&mut self, slot: u32, config: ColliderConfig) -> bool {
        let body_handle = match self.slots.get(slot) {
            Some(s) => s.body,
            None => return false,
        };
        let collider = match build_collider(config, &self.scratch_buffer) {
            Some(c) => c,
            None => return false,
        };
        let is_sensor = config.sensor;
        let collider_handle = if let Some(body) = body_handle {
            self.colliders
                .insert_with_parent(collider, body, &mut self.bodies)
        } else {
            self.colliders.insert(collider)
        };
        if let Some(slot_ref) = self.slots.get_mut(slot) {
            slot_ref.colliders.push(collider_handle);
            slot_ref.has_sensor_collider |= is_sensor;
        }
        true
    }

    // ─── Pose / velocity ────────────────────────────────────────────────────

    pub fn entity_to_body(&self, entity: EntityId) -> Option<RigidBodyHandle> {
        for (_slot_id, slot) in self.slots.iter_active() {
            if slot.entity_id == Some(entity) {
                return slot.body;
            }
        }
        None
    }

    pub fn entity_to_slot(&self, entity: EntityId) -> Option<u32> {
        for (slot_id, slot) in self.slots.iter_active() {
            if slot.entity_id == Some(entity) {
                return Some(slot_id);
            }
        }
        None
    }

    pub fn slot_entity(&self, slot: u32) -> Option<EntityId> {
        self.slots.get(slot).and_then(|s| s.entity_id)
    }

    pub fn get_pose(&mut self, slot: u32) -> bool {
        let Some(handle) = self.slots.get(slot).and_then(|s| s.body) else {
            return false;
        };
        let Some(body) = self.bodies.get(handle) else {
            return false;
        };
        let position = body.translation();
        let rotation = body.rotation();
        self.pose_scratch[0] = position.x;
        self.pose_scratch[1] = position.y;
        self.pose_scratch[2] = position.z;
        self.pose_scratch[3] = rotation.x;
        self.pose_scratch[4] = rotation.y;
        self.pose_scratch[5] = rotation.z;
        self.pose_scratch[6] = rotation.w;
        true
    }

    pub fn set_position(&mut self, slot: u32, x: f32, y: f32, z: f32) -> bool {
        let Some(handle) = self.slots.get(slot).and_then(|s| s.body) else {
            return false;
        };
        let Some(body) = self.bodies.get_mut(handle) else {
            return false;
        };
        body.set_translation(rapier3d::math::Vec3::new(x, y, z), true);
        true
    }

    pub fn set_rotation(&mut self, slot: u32, x: f32, y: f32, z: f32, w: f32) -> bool {
        let Some(handle) = self.slots.get(slot).and_then(|s| s.body) else {
            return false;
        };
        let Some(body) = self.bodies.get_mut(handle) else {
            return false;
        };
        body.set_rotation(rapier3d::math::Rotation::from_xyzw(x, y, z, w).normalize(), true);
        true
    }

    pub fn set_linvel(&mut self, slot: u32, x: f32, y: f32, z: f32) -> bool {
        let Some(handle) = self.slots.get(slot).and_then(|s| s.body) else {
            return false;
        };
        let Some(body) = self.bodies.get_mut(handle) else {
            return false;
        };
        body.set_linvel(rapier3d::math::Vec3::new(x, y, z), true);
        true
    }

    pub fn get_linvel(&mut self, slot: u32) -> bool {
        let Some(handle) = self.slots.get(slot).and_then(|s| s.body) else {
            return false;
        };
        let Some(body) = self.bodies.get(handle) else {
            return false;
        };
        let v = body.linvel();
        self.vec3_scratch = [v.x, v.y, v.z];
        true
    }

    pub fn set_angvel(&mut self, slot: u32, x: f32, y: f32, z: f32) -> bool {
        let Some(handle) = self.slots.get(slot).and_then(|s| s.body) else {
            return false;
        };
        let Some(body) = self.bodies.get_mut(handle) else {
            return false;
        };
        body.set_angvel(rapier3d::math::Vec3::new(x, y, z), true);
        true
    }

    pub fn apply_impulse(&mut self, slot: u32, x: f32, y: f32, z: f32) -> bool {
        let Some(handle) = self.slots.get(slot).and_then(|s| s.body) else {
            return false;
        };
        let Some(body) = self.bodies.get_mut(handle) else {
            return false;
        };
        body.apply_impulse(rapier3d::math::Vec3::new(x, y, z), true);
        true
    }

    // ─── Step ───────────────────────────────────────────────────────────────

    pub fn step(&mut self, dt: f32) {
        let dt = dt.max(0.0);
        if dt > 0.0 {
            self.integration_parameters.dt = dt.max(1.0 / 240.0);
        }
        self.events.clear();

        self.run_pre_physics_systems(dt);
        self.physics_pipeline.step(
            self.gravity,
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
        self.run_post_physics_systems(dt);
        self.collect_collision_events();
        self.build_render_buffer();
        self.events.flush();

        self.tick_count = self.tick_count.saturating_add(1);
    }

    fn build_slot_lookup(&self) -> SlotLookup {
        let mut entity_to_slot: Vec<(EntityId, u32, Option<RigidBodyHandle>)> =
            Vec::with_capacity(self.slots.capacity());
        for (slot_id, slot) in self.slots.iter_active() {
            if let Some(eid) = slot.entity_id {
                entity_to_slot.push((eid, slot_id, slot.body));
            }
        }
        SlotLookup { entries: entity_to_slot }
    }

    fn run_pre_physics_systems(&mut self, dt: f32) {
        let lookup = self.build_slot_lookup();

        // Cooldown timers tick down regardless of physics activity.
        cooldown::step(&mut self.world, dt);
        shooter_2d::step(&mut self.world, dt);

        // Movement / character behaviors that write velocity / position.
        thruster::step(
            &mut self.world,
            &mut self.bodies,
            &|e: EntityId| lookup.body_for(e),
            dt,
        );
        top_down_movement::step(
            &mut self.world,
            &mut self.bodies,
            &|e: EntityId| lookup.body_for(e),
        );
        first_person::step(
            &mut self.world,
            &mut self.bodies,
            &|e: EntityId| lookup.body_for(e),
            dt,
        );
        jumper_2d::step(
            &mut self.world,
            &mut self.bodies,
            &|e: EntityId| lookup.body_for(e),
            &|e: EntityId| lookup.slot_for(e),
            &mut self.events,
            dt,
        );
        jumper_3d::step(
            &mut self.world,
            &mut self.bodies,
            &|e: EntityId| lookup.body_for(e),
            &|e: EntityId| lookup.slot_for(e),
            &mut self.events,
            dt,
        );

        // Run the existing platformer-3d step for every platformer entity.
        // The legacy `step_platformer_bodies` operates on a `Gameplay3DState`
        // packed slot array; for the unified Stage we run a per-entity port
        // inline here. The kinematic capsule path uses
        // `KinematicCharacterController::move_shape` against the static
        // collider set.
        self.step_platformers(dt, &lookup);
    }

    fn run_post_physics_systems(&mut self, _dt: f32) {
        let lookup = self.build_slot_lookup();
        world_boundary::step(
            &mut self.world,
            &mut self.bodies,
            &|e: EntityId| lookup.slot_for(e),
            &|e: EntityId| lookup.body_for(e),
            &mut self.events,
        );
        screen_wrap::step(
            &mut self.world,
            &mut self.bodies,
            &|e: EntityId| lookup.slot_for(e),
            &|e: EntityId| lookup.body_for(e),
            &mut self.events,
        );
    }

    fn collect_collision_events(&mut self) {
        // Walk Rapier's narrow-phase contact manifolds for current intersection
        // pairs. The TS host drains these via `events_ptr` / `event_count`.
        for pair in self.narrow_phase.contact_pairs() {
            if !pair.has_any_active_contact() {
                continue;
            }
            let a = pair.collider1;
            let b = pair.collider2;
            let primary = self.collider_to_slot(a);
            let secondary = self.collider_to_slot(b);
            if primary.is_none() && secondary.is_none() {
                continue;
            }
            let mut event = StageEvent::new(StageEventType::CollisionStarted);
            if let Some(p) = primary {
                event = event.with_primary(p);
            }
            if let Some(s) = secondary {
                event = event.with_secondary(s);
            }
            let normal = pair
                .manifolds
                .first()
                .map(|m| {
                    let n = m.data.normal;
                    [n.x, n.y, n.z]
                })
                .unwrap_or([0.0, 1.0, 0.0]);
            event = event.with_payload([normal[0], normal[1], normal[2]]);
            self.events.push(event);
        }
    }

    fn collider_to_slot(&self, handle: ColliderHandle) -> Option<u32> {
        for (slot_id, slot) in self.slots.iter_active() {
            if slot.colliders.iter().any(|c| *c == handle) {
                return Some(slot_id);
            }
        }
        None
    }

    fn step_platformers(&mut self, dt: f32, lookup: &SlotLookup) {
        // Collect entities up front so the per-entity physics work doesn't
        // need to keep the Shipyard borrows alive.
        let mut entities: Vec<(EntityId, u32, RigidBodyHandle)> = Vec::new();
        for entry in &lookup.entries {
            let (entity, slot, body) = (entry.0, entry.1, entry.2);
            if let Some(handle) = body {
                if platformer::slot_shape(&self.world, entity).is_some() {
                    entities.push((entity, slot, handle));
                }
            }
        }
        for (entity, slot, _body) in entities {
            let Some(_shape) = platformer::slot_shape(&self.world, entity) else {
                continue;
            };
            let Some(input) = platformer::slot_input(&self.world, entity) else {
                continue;
            };
            let Some(config) = platformer::slot_config(&self.world, entity) else {
                continue;
            };
            let Some(mut state) = platformer::read_state(&self.world, entity) else {
                continue;
            };

            // Kinematic capsule lives outside the Rapier sets — we move it
            // by direct translation. (The legacy implementation uses the
            // same pattern.) Find the body handle for translation.
            let Some(body_handle) = self.slots.get(slot).and_then(|s| s.body) else {
                continue;
            };
            let Some(body) = self.bodies.get_mut(body_handle) else {
                continue;
            };
            let pose = body.translation();

            // Compute desired horizontal velocity from input.
            let speed = if input.run {
                config.run_speed
            } else {
                config.walk_speed
            };
            let mag = (input.move_x * input.move_x + input.move_z * input.move_z).sqrt();
            let (mx, mz) = if mag > 1.0 {
                (input.move_x / mag, input.move_z / mag)
            } else {
                (input.move_x, input.move_z)
            };
            let mut vy = body.linvel().y;
            let vx = mx * speed;
            let vz = mz * speed;

            // Jump detection: rising-edge triggered when grounded (or coyote).
            let mut jumped = false;
            if input.jump
                && !state.jump_pressed_last_frame
                && state.jump_count < config.max_jumps
            {
                vy = config.jump_force;
                state.jump_count += 1;
                state.grounded = false;
                state.jumping = true;
                state.jumped_this_frame = true;
                jumped = true;
            }
            state.jump_pressed_last_frame = input.jump;

            // Gravity.
            if !state.grounded {
                vy -= config.gravity * dt;
            }

            // Integrate position. Note: this is a simplified KCC
            // (no swept shape cast against arbitrary geometry); the legacy
            // gameplay3d path uses the full KCC + static collider set. The
            // unified Stage relies on Rapier's dynamic stepping for the
            // collision response of dynamic bodies and lets KCC handle only
            // the kinematic capsule entities the host opts into via
            // `attach_kinematic_capsule`.
            let new_x = pose.x + vx * dt;
            let new_y = pose.y + vy * dt;
            let new_z = pose.z + vz * dt;

            body.set_translation(rapier3d::math::Vec3::new(new_x, new_y, new_z), true);
            body.set_linvel(rapier3d::math::Vec3::new(vx, vy, vz), true);

            state.current_speed = speed * mag.min(1.0);

            // Update FSM.
            let mut fsm = crate::runtime::behaviors::platformer_3d::fsm::Platformer3DFsmState::default();
            crate::runtime::behaviors::platformer_3d::fsm::update_fsm(
                &mut fsm,
                &state,
                &input,
                jumped,
            );

            platformer::write_state(&mut self.world, entity, state, fsm);

            if jumped {
                self.events.push(
                    StageEvent::new(StageEventType::JumpStarted)
                        .with_primary(slot)
                        .with_payload([state.jump_count as f32, 0.0, 0.0]),
                );
            }
        }
    }

    fn build_render_buffer(&mut self) {
        self.ensure_render_capacity();
        // Zero entire buffer first so freed slots don't carry stale state.
        for v in self.render_buffer.iter_mut() {
            *v = 0.0;
        }
        for (slot_id, slot) in self.slots.iter_active() {
            let base = slot_id as usize * STAGE_RENDER_STRIDE;
            if base + STAGE_RENDER_STRIDE > self.render_buffer.len() {
                continue;
            }
            let mut render = RenderSlot {
                position: [0.0; 3],
                rotation: [0.0, 0.0, 0.0, 1.0],
                scale: 1.0,
                custom: [0.0; 4],
            };
            if let Some(body_handle) = slot.body {
                if let Some(body) = self.bodies.get(body_handle) {
                    let p = body.translation();
                    let r = body.rotation();
                    render.position = [p.x, p.y, p.z];
                    render.rotation = [r.x, r.y, r.z, r.w];
                }
            }
            render.write_into(&mut self.render_buffer[base..base + STAGE_RENDER_STRIDE]);
        }
    }

    fn ensure_render_capacity(&mut self) {
        let needed = self.slots.capacity() * STAGE_RENDER_STRIDE;
        if self.render_buffer.len() < needed {
            self.render_buffer.resize(needed, 0.0);
        }
    }

    // ─── Behavior attach helpers (exposed via FFI) ──────────────────────────

    pub fn slot_to_entity(&self, slot: u32) -> Option<EntityId> {
        self.slots.get(slot).and_then(|s| s.entity_id)
    }

    pub fn behavior_query(
        &mut self,
        slot: u32,
        runner: impl FnOnce(&World, EntityId, &mut [f32]) -> bool,
    ) -> bool {
        let Some(entity) = self.slot_to_entity(slot) else {
            return false;
        };
        runner(&self.world, entity, &mut self.query_scratch)
    }

    pub fn pose_scratch_ptr(&self) -> *const f32 {
        self.pose_scratch.as_ptr()
    }

    pub fn vec3_scratch_ptr(&self) -> *const f32 {
        self.vec3_scratch.as_ptr()
    }

    pub fn query_scratch_ptr(&self) -> *const f32 {
        self.query_scratch.as_ptr()
    }

    pub fn render_ptr(&self) -> *const f32 {
        self.render_buffer.as_ptr()
    }

    pub fn render_len(&self) -> usize {
        self.render_buffer.len()
    }

    pub fn scratch_ptr_mut(&mut self) -> *mut f32 {
        self.scratch_buffer.as_mut_ptr()
    }

    pub fn scratch_capacity(&self) -> usize {
        self.scratch_buffer.len()
    }
}

struct SlotLookup {
    entries: Vec<(EntityId, u32, Option<RigidBodyHandle>)>,
}

impl SlotLookup {
    fn body_for(&self, entity: EntityId) -> Option<RigidBodyHandle> {
        self.entries
            .iter()
            .find(|e| e.0 == entity)
            .and_then(|e| e.2)
    }

    fn slot_for(&self, entity: EntityId) -> Option<u32> {
        self.entries.iter().find(|e| e.0 == entity).map(|e| e.1)
    }
}
