//! C ABI for the batched wasm boundary (single simulation per module instance).

use std::cell::RefCell;

use crate::runtime::{
    Bounds2D, DynamicCircleBody2DConfig, KinematicAabbBody2DConfig,
    Simulation, StaticBoxCollider, EVENT_STRIDE, INPUT_STRIDE, RENDER_STRIDE, SUMMARY_LEN,
};

thread_local! {
    static SIMULATION: RefCell<Option<Simulation>> = const { RefCell::new(None) };
}

fn with_sim<R>(f: impl FnOnce(&mut Simulation) -> R) -> Option<R> {
    SIMULATION.with(|slot| {
        let mut sim = slot.borrow_mut();
        sim.as_mut().map(f)
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_init(capacity: usize, initial_active: usize) -> usize {
    if capacity == 0 {
        return 0;
    }

    let Some(sim) = Simulation::new(capacity, initial_active) else {
        return 0;
    };

    let initial = initial_active.min(capacity);
    SIMULATION.with(|slot| {
        *slot.borrow_mut() = Some(sim);
    });

    initial
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_bootstrap_instancing(
    half_extent_x: f32,
    half_extent_y: f32,
    half_extent_z: f32,
) -> usize {
    with_sim(|sim| {
        sim.bootstrap_instancing_from_input([
            half_extent_x.max(0.01),
            half_extent_y.max(0.01),
            half_extent_z.max(0.01),
        ])
    })
    .unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_clear_static_box_colliders() {
    let _ = with_sim(|sim| sim.clear_static_box_colliders());
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_add_static_box_collider(
    center_x: f32,
    center_y: f32,
    center_z: f32,
    half_extent_x: f32,
    half_extent_y: f32,
    half_extent_z: f32,
    friction: f32,
    restitution: f32,
) {
    let _ = with_sim(|sim| {
        sim.add_static_box_collider(StaticBoxCollider {
            center: [center_x, center_y, center_z],
            half_extents: [
                half_extent_x.max(0.01),
                half_extent_y.max(0.01),
                half_extent_z.max(0.01),
            ],
            friction: friction.max(0.0),
            restitution: restitution.max(0.0),
        });
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_gameplay2d_clear_config() {
    let _ = with_sim(|sim| sim.clear_gameplay2d_config());
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_gameplay2d_set_world_bounds(
    left: f32,
    right: f32,
    bottom: f32,
    top: f32,
) {
    let _ = with_sim(|sim| {
        sim.set_gameplay2d_world_bounds(Bounds2D {
            left,
            right,
            bottom,
            top,
        });
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_configure_dynamic_circle_body2d(
    slot: usize,
    radius: f32,
    initial_velocity_x: f32,
    initial_velocity_y: f32,
    min_speed: f32,
    max_speed: f32,
    speed_multiplier: f32,
    max_angle_deg: f32,
    reflection_mode: u32,
    uses_boundary_2d: u32,
    uses_ricochet_2d: u32,
) -> u8 {
    with_sim(|sim| {
        u8::from(sim.configure_dynamic_circle_body2d(slot, DynamicCircleBody2DConfig {
            radius: radius.max(0.01),
            initial_velocity: [initial_velocity_x, initial_velocity_y],
            min_speed,
            max_speed,
            speed_multiplier,
            max_angle_deg,
            reflection_mode: reflection_mode.min(1) as u8,
            uses_boundary_2d: uses_boundary_2d != 0,
            uses_ricochet_2d: uses_ricochet_2d != 0,
        }))
    }).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_configure_kinematic_aabb_body2d(
    slot: usize,
    player_index: usize,
    speed: f32,
    half_width: f32,
    half_height: f32,
) -> u8 {
    with_sim(|sim| {
        u8::from(sim.configure_kinematic_aabb_body2d(
            slot,
            KinematicAabbBody2DConfig {
                input_channel: player_index,
                speed,
            },
            [half_width.max(0.01), half_height.max(0.01)],
        ))
    }).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_gameplay2d_add_trigger_aabb(
    trigger_id: u32,
    center_x: f32,
    center_y: f32,
    center_z: f32,
    half_width: f32,
    half_height: f32,
) {
    let _ = with_sim(|sim| {
        sim.add_gameplay2d_trigger_aabb(
            trigger_id,
            [center_x, center_y, center_z],
            [half_width, half_height],
        );
    });
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_bootstrap_gameplay2d() -> usize {
    with_sim(Simulation::bootstrap_gameplay2d_from_input).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_gameplay2d_set_input_axis(
    player_index: usize,
    vertical: f32,
) {
    let _ = with_sim(|sim| sim.set_gameplay2d_input_axis(player_index, vertical));
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_gameplay2d_set_slot_position(
    slot: usize,
    x: f32,
    y: f32,
    z: f32,
) {
    let _ = with_sim(|sim| sim.set_gameplay2d_slot_position(slot, x, y, z));
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_gameplay2d_set_slot_velocity(
    slot: usize,
    x: f32,
    y: f32,
) {
    let _ = with_sim(|sim| sim.set_gameplay2d_slot_velocity(slot, x, y));
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_event_stride() -> usize {
    EVENT_STRIDE
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_event_ptr() -> *const f32 {
    with_sim(|sim| {
        sim.gameplay2d_event_buffer()
            .map(|buffer| buffer.as_ptr())
            .unwrap_or(std::ptr::null())
    })
    .unwrap_or(std::ptr::null())
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_event_len() -> usize {
    with_sim(|sim| {
        sim.gameplay2d_event_buffer()
            .map(|buffer| buffer.len())
            .unwrap_or(0)
    })
    .unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_event_count() -> usize {
    with_sim(|sim| sim.gameplay2d_event_count()).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_step(dt: f32) -> usize {
    with_sim(|sim| {
        sim.step(dt.max(0.0));
        sim.active_count
    })
    .unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_active_count() -> usize {
    with_sim(|sim| sim.active_count).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_tick_count() -> u32 {
    with_sim(|sim| sim.tick_count).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_activate_next() -> usize {
    with_sim(|sim| sim.activate_next_entity().unwrap_or(usize::MAX)).unwrap_or(usize::MAX)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_input_stride() -> usize {
    INPUT_STRIDE
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_render_stride() -> usize {
    RENDER_STRIDE
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_summary_len() -> usize {
    SUMMARY_LEN
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_input_ptr() -> *mut f32 {
    with_sim(|sim| sim.input_buffer.as_mut_ptr()).unwrap_or(std::ptr::null_mut())
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_input_len() -> usize {
    with_sim(|sim| sim.input_buffer.len()).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_render_ptr() -> *const f32 {
    with_sim(|sim| sim.render_buffer.as_ptr()).unwrap_or(std::ptr::null())
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_render_len() -> usize {
    with_sim(|sim| sim.render_buffer.len()).unwrap_or(0)
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_summary_ptr() -> *const f32 {
    with_sim(|sim| sim.summary_buffer.as_ptr()).unwrap_or(std::ptr::null())
}

#[unsafe(no_mangle)]
pub extern "C" fn zylem_runtime_summary_buffer_len() -> usize {
    with_sim(|sim| sim.summary_buffer.len()).unwrap_or(0)
}
