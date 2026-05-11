//! C ABI for the unified `StageSimulation`. The host (TS
//! `WasmStageRuntime`) drives entity lifecycle, body/collider attach, and
//! per-behavior attach/query through this surface; pose / event / render
//! data is read directly from wasm linear memory via the buffer pointers.
//!
//! All exports take a `u32` slot handle for entities; the simulation lives
//! in a single thread-local singleton (one wasm `Module` per `ZylemStage`).

use std::cell::RefCell;

use crate::runtime::stage::behaviors::{
    cooldown, first_person, jumper_2d, jumper_3d, platformer_3d as platformer,
    ricochet, screen_wrap, shooter_2d, thruster, top_down_movement, world_boundary,
};
use crate::runtime::stage::body::{BodyConfig, ColliderConfig, ColliderShape, RuntimeBodyKind};
use crate::runtime::stage::events::{STAGE_EVENT_STRIDE, EventBuffer};
use crate::runtime::stage::render::STAGE_RENDER_STRIDE;
use crate::runtime::stage::simulation::{StageSimulation, POSE_SCRATCH_LEN, QUERY_SCRATCH_LEN};
use crate::runtime::stage::slot_table::INVALID_SLOT;

thread_local! {
    static STAGE: RefCell<Option<StageSimulation>> = const { RefCell::new(None) };
}

fn with_stage<R>(f: impl FnOnce(&mut StageSimulation) -> R) -> Option<R> {
    STAGE.with(|slot| {
        let mut state = slot.borrow_mut();
        state.as_mut().map(f)
    })
}

fn ok_u32(v: bool) -> u32 {
    if v { 1 } else { 0 }
}

// ─── Lifecycle ──────────────────────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_create(initial_capacity: u32) -> u32 {
    STAGE.with(|slot| {
        *slot.borrow_mut() = Some(StageSimulation::new(initial_capacity as usize));
    });
    1
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_destroy() {
    STAGE.with(|slot| {
        *slot.borrow_mut() = None;
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_set_gravity(x: f32, y: f32, z: f32) {
    let _ = with_stage(|s| s.set_gravity(x, y, z));
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_step(dt: f32) -> u32 {
    with_stage(|s| {
        s.step(dt);
        s.active_count()
    })
    .unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_active_count() -> u32 {
    with_stage(|s| s.active_count()).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_capacity() -> u32 {
    with_stage(|s| s.capacity()).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_tick_count() -> u32 {
    with_stage(|s| s.tick_count).unwrap_or(0)
}

// ─── Entity lifecycle ───────────────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_create_entity() -> u32 {
    with_stage(|s| s.create_entity()).unwrap_or(INVALID_SLOT)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_destroy_entity(slot: u32) -> u32 {
    ok_u32(with_stage(|s| s.destroy_entity(slot)).unwrap_or(false))
}

// ─── Body attach ────────────────────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_attach_body(
    slot: u32,
    kind: u32,
    pos_x: f32,
    pos_y: f32,
    pos_z: f32,
    rot_x: f32,
    rot_y: f32,
    rot_z: f32,
    rot_w: f32,
    linear_damping: f32,
    angular_damping: f32,
    gravity_scale: f32,
    can_sleep: u32,
    ccd_enabled: u32,
    lock_rot_x: u32,
    lock_rot_y: u32,
    lock_rot_z: u32,
    lock_trans_x: u32,
    lock_trans_y: u32,
    lock_trans_z: u32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let config = BodyConfig {
                kind: RuntimeBodyKind::from_u32(kind),
                position: [pos_x, pos_y, pos_z],
                rotation: [rot_x, rot_y, rot_z, rot_w],
                linear_damping,
                angular_damping,
                gravity_scale,
                can_sleep: can_sleep != 0,
                ccd_enabled: ccd_enabled != 0,
                lock_rotation: [lock_rot_x != 0, lock_rot_y != 0, lock_rot_z != 0],
                lock_translation: [lock_trans_x != 0, lock_trans_y != 0, lock_trans_z != 0],
            };
            s.attach_body(slot, config)
        })
        .unwrap_or(false),
    )
}

// ─── Collider attach ────────────────────────────────────────────────────────

fn collider_base(
    offset_x: f32,
    offset_y: f32,
    offset_z: f32,
    friction: f32,
    restitution: f32,
    sensor: u32,
    collision_groups: u32,
) -> ColliderConfig {
    ColliderConfig {
        shape: ColliderShape::Box {
            half_extents: [0.5; 3],
        },
        offset: [offset_x, offset_y, offset_z],
        friction,
        restitution,
        sensor: sensor != 0,
        collision_groups,
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_add_collider_box(
    slot: u32,
    half_x: f32,
    half_y: f32,
    half_z: f32,
    offset_x: f32,
    offset_y: f32,
    offset_z: f32,
    friction: f32,
    restitution: f32,
    sensor: u32,
    collision_groups: u32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let mut cfg = collider_base(offset_x, offset_y, offset_z, friction, restitution, sensor, collision_groups);
            cfg.shape = ColliderShape::Box {
                half_extents: [half_x, half_y, half_z],
            };
            s.add_collider(slot, cfg)
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_add_collider_sphere(
    slot: u32,
    radius: f32,
    offset_x: f32,
    offset_y: f32,
    offset_z: f32,
    friction: f32,
    restitution: f32,
    sensor: u32,
    collision_groups: u32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let mut cfg = collider_base(offset_x, offset_y, offset_z, friction, restitution, sensor, collision_groups);
            cfg.shape = ColliderShape::Sphere { radius };
            s.add_collider(slot, cfg)
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_add_collider_capsule(
    slot: u32,
    half_height: f32,
    radius: f32,
    offset_x: f32,
    offset_y: f32,
    offset_z: f32,
    friction: f32,
    restitution: f32,
    sensor: u32,
    collision_groups: u32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let mut cfg = collider_base(offset_x, offset_y, offset_z, friction, restitution, sensor, collision_groups);
            cfg.shape = ColliderShape::Capsule {
                half_height,
                radius,
            };
            s.add_collider(slot, cfg)
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_add_collider_cylinder(
    slot: u32,
    half_height: f32,
    radius: f32,
    offset_x: f32,
    offset_y: f32,
    offset_z: f32,
    friction: f32,
    restitution: f32,
    sensor: u32,
    collision_groups: u32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let mut cfg = collider_base(offset_x, offset_y, offset_z, friction, restitution, sensor, collision_groups);
            cfg.shape = ColliderShape::Cylinder {
                half_height,
                radius,
            };
            s.add_collider(slot, cfg)
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_add_collider_convex_hull(
    slot: u32,
    vertex_offset: u32,
    vertex_count: u32,
    offset_x: f32,
    offset_y: f32,
    offset_z: f32,
    friction: f32,
    restitution: f32,
    sensor: u32,
    collision_groups: u32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let mut cfg = collider_base(offset_x, offset_y, offset_z, friction, restitution, sensor, collision_groups);
            cfg.shape = ColliderShape::ConvexHull {
                vertex_offset,
                vertex_count,
            };
            s.add_collider(slot, cfg)
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_add_collider_trimesh(
    slot: u32,
    vertex_offset: u32,
    vertex_count: u32,
    index_offset: u32,
    index_count: u32,
    offset_x: f32,
    offset_y: f32,
    offset_z: f32,
    friction: f32,
    restitution: f32,
    sensor: u32,
    collision_groups: u32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let mut cfg = collider_base(offset_x, offset_y, offset_z, friction, restitution, sensor, collision_groups);
            cfg.shape = ColliderShape::Trimesh {
                vertex_offset,
                vertex_count,
                index_offset,
                index_count,
            };
            s.add_collider(slot, cfg)
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_add_collider_heightfield(
    slot: u32,
    rows: u32,
    cols: u32,
    scale_x: f32,
    scale_y: f32,
    scale_z: f32,
    height_offset: u32,
    pos_x: f32,
    pos_y: f32,
    pos_z: f32,
    friction: f32,
    restitution: f32,
    collision_groups: u32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let mut cfg = collider_base(pos_x, pos_y, pos_z, friction, restitution, 0, collision_groups);
            cfg.shape = ColliderShape::Heightfield {
                rows,
                cols,
                scale: [scale_x, scale_y, scale_z],
                height_offset,
            };
            s.add_collider(slot, cfg)
        })
        .unwrap_or(false),
    )
}

// ─── Pose / velocity ────────────────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_get_pose(slot: u32) -> u32 {
    ok_u32(with_stage(|s| s.get_pose(slot)).unwrap_or(false))
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_pose_ptr() -> *const f32 {
    with_stage(|s| s.pose_scratch_ptr()).unwrap_or(std::ptr::null())
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_pose_len() -> u32 {
    POSE_SCRATCH_LEN as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_set_position(slot: u32, x: f32, y: f32, z: f32) -> u32 {
    ok_u32(with_stage(|s| s.set_position(slot, x, y, z)).unwrap_or(false))
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_set_rotation(slot: u32, x: f32, y: f32, z: f32, w: f32) -> u32 {
    ok_u32(with_stage(|s| s.set_rotation(slot, x, y, z, w)).unwrap_or(false))
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_set_linvel(slot: u32, x: f32, y: f32, z: f32) -> u32 {
    ok_u32(with_stage(|s| s.set_linvel(slot, x, y, z)).unwrap_or(false))
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_get_linvel(slot: u32) -> u32 {
    ok_u32(with_stage(|s| s.get_linvel(slot)).unwrap_or(false))
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_set_angvel(slot: u32, x: f32, y: f32, z: f32) -> u32 {
    ok_u32(with_stage(|s| s.set_angvel(slot, x, y, z)).unwrap_or(false))
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_apply_impulse(slot: u32, x: f32, y: f32, z: f32) -> u32 {
    ok_u32(with_stage(|s| s.apply_impulse(slot, x, y, z)).unwrap_or(false))
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_vec3_ptr() -> *const f32 {
    with_stage(|s| s.vec3_scratch_ptr()).unwrap_or(std::ptr::null())
}

// ─── Render / event / scratch ───────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_render_ptr() -> *const f32 {
    with_stage(|s| s.render_ptr()).unwrap_or(std::ptr::null())
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_render_len() -> u32 {
    with_stage(|s| s.render_len() as u32).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_render_stride() -> u32 {
    STAGE_RENDER_STRIDE as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_event_ptr() -> *const f32 {
    with_stage(|s| s.events.buffer_ptr()).unwrap_or(std::ptr::null())
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_event_len() -> u32 {
    with_stage(|s| s.events.buffer_len() as u32).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_event_count() -> u32 {
    with_stage(|s| s.events.count() as u32).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_event_stride() -> u32 {
    STAGE_EVENT_STRIDE as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_query_ptr() -> *const f32 {
    with_stage(|s| s.query_scratch_ptr()).unwrap_or(std::ptr::null())
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_query_len() -> u32 {
    QUERY_SCRATCH_LEN as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_scratch_ptr() -> *mut f32 {
    with_stage(|s| s.scratch_ptr_mut()).unwrap_or(std::ptr::null_mut())
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_scratch_capacity() -> u32 {
    with_stage(|s| s.scratch_capacity() as u32).unwrap_or(0)
}

// ─── Behavior: cooldown ─────────────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_attach_cooldown(slot: u32) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            cooldown::ensure_attached(&mut s.world, entity);
            true
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_cooldown_register(
    slot: u32,
    cooldown_id: u32,
    duration: f32,
    immediate: u32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            cooldown::register(&mut s.world, entity, cooldown_id, duration, immediate != 0)
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_cooldown_fire(slot: u32, cooldown_id: u32) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mut events = std::mem::take(&mut s.events);
            let result = cooldown::fire(&mut s.world, entity, cooldown_id, &mut events, slot);
            s.events = events;
            result
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_cooldown_reset(slot: u32, cooldown_id: u32) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            cooldown::reset(&mut s.world, entity, cooldown_id)
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_cooldown_remaining(slot: u32, cooldown_id: u32) -> f32 {
    with_stage(|s| {
        let Some(entity) = s.slot_to_entity(slot) else {
            return f32::NAN;
        };
        cooldown::remaining(&s.world, entity, cooldown_id)
    })
    .unwrap_or(f32::NAN)
}

// ─── Behavior: world boundary ───────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_attach_world_boundary(
    slot: u32,
    dim: u32,
    top: f32,
    bottom: f32,
    left: f32,
    right: f32,
    front: f32,
    back: f32,
    padding: f32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let dim = if dim == 3 {
                world_boundary::BoundaryDim::Three
            } else {
                world_boundary::BoundaryDim::Two
            };
            world_boundary::attach(
                &mut s.world,
                entity,
                world_boundary::WorldBoundaryConfig {
                    dim,
                    top,
                    bottom,
                    left,
                    right,
                    front,
                    back,
                    padding,
                },
            );
            true
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_query_world_boundary(slot: u32) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mut buf = [0.0f32; QUERY_SCRATCH_LEN];
            let ok = world_boundary::query(&s.world, entity, &mut buf);
            if ok {
                s.query_scratch.copy_from_slice(&buf);
            }
            ok
        })
        .unwrap_or(false),
    )
}

// ─── Behavior: screen wrap ──────────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_attach_screen_wrap(
    slot: u32,
    width: f32,
    height: f32,
    center_x: f32,
    center_y: f32,
    edge_threshold: f32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            screen_wrap::attach(
                &mut s.world,
                entity,
                screen_wrap::ScreenWrapConfig {
                    width,
                    height,
                    center_x,
                    center_y,
                    edge_threshold,
                },
            );
            true
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_query_screen_wrap(slot: u32) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mut buf = [0.0f32; QUERY_SCRATCH_LEN];
            let ok = screen_wrap::query(&s.world, entity, &mut buf);
            if ok {
                s.query_scratch.copy_from_slice(&buf);
            }
            ok
        })
        .unwrap_or(false),
    )
}

// ─── Behavior: ricochet ─────────────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_attach_ricochet(
    slot: u32,
    dim: u32,
    min_speed: f32,
    max_speed: f32,
    speed_multiplier: f32,
    max_angle_deg: f32,
    reflection_mode: u32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mode = if reflection_mode == 1 {
                ricochet::RicochetReflection::Angled
            } else {
                ricochet::RicochetReflection::Mirror
            };
            let dim = if dim == 3 {
                ricochet::RicochetDim::Three
            } else {
                ricochet::RicochetDim::Two
            };
            ricochet::attach(
                &mut s.world,
                entity,
                ricochet::RicochetConfig {
                    dim,
                    min_speed,
                    max_speed,
                    speed_multiplier,
                    max_angle_deg,
                    reflection_mode: mode,
                },
            );
            true
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_query_ricochet(slot: u32) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mut buf = [0.0f32; QUERY_SCRATCH_LEN];
            let ok = ricochet::query(&s.world, entity, &mut buf);
            if ok {
                s.query_scratch.copy_from_slice(&buf);
            }
            ok
        })
        .unwrap_or(false),
    )
}

// ─── Behavior: thruster ─────────────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_attach_thruster(
    slot: u32,
    max_speed: f32,
    acceleration: f32,
    turn_rate_rad_s: f32,
    linear_damping: f32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            thruster::attach(
                &mut s.world,
                entity,
                thruster::ThrusterConfig {
                    max_speed,
                    acceleration,
                    turn_rate_rad_s,
                    linear_damping,
                },
            );
            true
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_set_thruster_input(slot: u32, thrust: f32, turn: f32) {
    let _ = with_stage(|s| {
        if let Some(entity) = s.slot_to_entity(slot) {
            thruster::set_input(&mut s.world, entity, thrust, turn);
        }
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_query_thruster(slot: u32) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mut buf = [0.0f32; QUERY_SCRATCH_LEN];
            let ok = thruster::query(&s.world, entity, &mut buf);
            if ok {
                s.query_scratch.copy_from_slice(&buf);
            }
            ok
        })
        .unwrap_or(false),
    )
}

// ─── Behavior: top-down movement ────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_attach_top_down(
    slot: u32,
    plane: u32,
    speed: f32,
    face_movement: u32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let plane = if plane == 1 {
                top_down_movement::TopDownPlane::Xz
            } else {
                top_down_movement::TopDownPlane::Xy
            };
            top_down_movement::attach(
                &mut s.world,
                entity,
                top_down_movement::TopDownConfig {
                    plane,
                    speed,
                    face_movement: face_movement != 0,
                },
            );
            true
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_set_top_down_input(slot: u32, a: f32, b: f32) {
    let _ = with_stage(|s| {
        if let Some(entity) = s.slot_to_entity(slot) {
            top_down_movement::set_input(&mut s.world, entity, a, b);
        }
    });
}

// ─── Behavior: jumper ───────────────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_attach_jumper_2d(
    slot: u32,
    jump_force: f32,
    max_jumps: u32,
    jump_buffer_time: f32,
    coyote_time: f32,
    gravity: f32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            jumper_2d::attach(
                &mut s.world,
                entity,
                jumper_2d::Jumper2DConfig {
                    jump_force,
                    max_jumps,
                    jump_buffer_time,
                    coyote_time,
                    gravity,
                },
            );
            true
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_set_jumper_2d_input(slot: u32, jump_pressed: u32) {
    let _ = with_stage(|s| {
        if let Some(entity) = s.slot_to_entity(slot) {
            jumper_2d::set_input(&mut s.world, entity, jump_pressed != 0);
        }
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_query_jumper_2d(slot: u32) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mut buf = [0.0f32; QUERY_SCRATCH_LEN];
            let ok = jumper_2d::query(&s.world, entity, &mut buf);
            if ok {
                s.query_scratch.copy_from_slice(&buf);
            }
            ok
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_attach_jumper_3d(
    slot: u32,
    jump_force: f32,
    max_jumps: u32,
    gravity: f32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            jumper_3d::attach(
                &mut s.world,
                entity,
                jumper_3d::Jumper3DConfig {
                    jump_force,
                    max_jumps,
                    gravity,
                },
            );
            true
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_set_jumper_3d_input(slot: u32, jump: u32) {
    let _ = with_stage(|s| {
        if let Some(entity) = s.slot_to_entity(slot) {
            jumper_3d::set_input(&mut s.world, entity, jump != 0);
        }
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_query_jumper_3d(slot: u32) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mut buf = [0.0f32; QUERY_SCRATCH_LEN];
            let ok = jumper_3d::query(&s.world, entity, &mut buf);
            if ok {
                s.query_scratch.copy_from_slice(&buf);
            }
            ok
        })
        .unwrap_or(false),
    )
}

// ─── Behavior: shooter 2D ───────────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_attach_shooter_2d(
    slot: u32,
    fire_rate_hz: f32,
    muzzle_offset_x: f32,
    muzzle_offset_y: f32,
    muzzle_speed: f32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            shooter_2d::attach(
                &mut s.world,
                entity,
                shooter_2d::Shooter2DConfig {
                    fire_rate_hz,
                    muzzle_offset: [muzzle_offset_x, muzzle_offset_y],
                    muzzle_speed,
                },
            );
            true
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_shooter_2d_fire(
    slot: u32,
    pos_x: f32,
    pos_y: f32,
    pos_z: f32,
    yaw: f32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mut events = std::mem::take(&mut s.events);
            let res = shooter_2d::try_fire(
                &mut s.world,
                entity,
                slot,
                [pos_x, pos_y, pos_z],
                yaw,
                &mut events,
            );
            s.events = events;
            res
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_query_shooter_2d(slot: u32) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mut buf = [0.0f32; QUERY_SCRATCH_LEN];
            let ok = shooter_2d::query(&s.world, entity, &mut buf);
            if ok {
                s.query_scratch.copy_from_slice(&buf);
            }
            ok
        })
        .unwrap_or(false),
    )
}

// ─── Behavior: platformer 3d ────────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_attach_platformer_3d(
    slot: u32,
    half_height: f32,
    radius: f32,
    walk_speed: f32,
    run_speed: f32,
    jump_force: f32,
    max_jumps: u32,
    gravity: f32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mut config = platformer::Platformer3DConfig::default();
            config.walk_speed = walk_speed;
            config.run_speed = run_speed;
            config.jump_force = jump_force;
            config.max_jumps = max_jumps;
            config.gravity = gravity;
            platformer::attach(
                &mut s.world,
                entity,
                config,
                platformer::PlatformerSlotShape {
                    half_height,
                    radius,
                },
            );
            true
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_set_platformer_3d_input_axes(
    slot: u32,
    move_x: f32,
    move_z: f32,
) {
    let _ = with_stage(|s| {
        if let Some(entity) = s.slot_to_entity(slot) {
            platformer::set_input_axes(&mut s.world, entity, move_x, move_z);
        }
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_set_platformer_3d_input_buttons(
    slot: u32,
    jump: u32,
    run: u32,
) {
    let _ = with_stage(|s| {
        if let Some(entity) = s.slot_to_entity(slot) {
            platformer::set_input_buttons(&mut s.world, entity, jump != 0, run != 0);
        }
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_query_platformer_3d(slot: u32) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mut buf = [0.0f32; QUERY_SCRATCH_LEN];
            let ok = platformer::query(&s.world, entity, &mut buf);
            if ok {
                s.query_scratch.copy_from_slice(&buf);
            }
            ok
        })
        .unwrap_or(false),
    )
}

// ─── Behavior: first-person ─────────────────────────────────────────────────

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_attach_first_person(
    slot: u32,
    walk_speed: f32,
    run_speed: f32,
    eye_height: f32,
    look_sensitivity: f32,
) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            first_person::attach(
                &mut s.world,
                entity,
                first_person::FirstPersonConfig {
                    walk_speed,
                    run_speed,
                    eye_height,
                    look_sensitivity,
                },
            );
            true
        })
        .unwrap_or(false),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_set_first_person_input(
    slot: u32,
    move_x: f32,
    move_z: f32,
    look_yaw_delta: f32,
    look_pitch_delta: f32,
    run: u32,
) {
    let _ = with_stage(|s| {
        if let Some(entity) = s.slot_to_entity(slot) {
            first_person::set_input(
                &mut s.world,
                entity,
                move_x,
                move_z,
                look_yaw_delta,
                look_pitch_delta,
                run != 0,
            );
        }
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_query_first_person(slot: u32) -> u32 {
    ok_u32(
        with_stage(|s| {
            let Some(entity) = s.slot_to_entity(slot) else {
                return false;
            };
            let mut buf = [0.0f32; QUERY_SCRATCH_LEN];
            let ok = first_person::query(&s.world, entity, &mut buf);
            if ok {
                s.query_scratch.copy_from_slice(&buf);
            }
            ok
        })
        .unwrap_or(false),
    )
}

// Re-export the invalid-slot sentinel for hosts that want to avoid hardcoding
// `u32::MAX`.
#[unsafe(no_mangle)]
pub extern "C" fn zylem_stage_invalid_slot() -> u32 {
    INVALID_SLOT
}

// Make sure unused-import warnings don't break --deny-warnings builds while
// other helper FFI is still being added.
#[doc(hidden)]
fn _force_use_event_buffer(_: &EventBuffer) {}
