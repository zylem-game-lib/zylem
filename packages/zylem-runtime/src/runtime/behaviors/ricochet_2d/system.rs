use crate::runtime::components::body_2d::Body2DKind;
use crate::runtime::events::RuntimeEventType;
use crate::runtime::modes::gameplay_2d::Gameplay2DState;

pub fn resolve_collider_bounce(state: &mut Gameplay2DState, body_index: usize) {
    if !state.slots[body_index].uses_ricochet_2d {
        return;
    }

    for collider_index in 0..state.slots.len() {
        if state.slots[collider_index].kind != Body2DKind::KinematicAabb {
            continue;
        }
        if !state.dynamic_circle_hits_aabb(body_index, collider_index) {
            continue;
        }

        let normal_x = if state.slots[body_index].position[0] >= state.slots[collider_index].position[0] {
            1.0
        } else {
            -1.0
        };
        let speed = state.clamp_dynamic_circle_speed(
            body_index,
            state.dynamic_circle_speed(body_index) * state.slots[body_index].speed_multiplier.max(1.0),
        );

        if state.slots[body_index].reflection_mode == 0 {
            state.slots[body_index].velocity[0] = normal_x * speed;
        } else {
            let relative = ((state.slots[body_index].position[1] - state.slots[collider_index].position[1])
                / state.slots[collider_index].half_extents[1].max(0.01))
                .clamp(-1.0, 1.0);
            let angle = relative * state.slots[body_index].max_angle_deg.to_radians();
            state.slots[body_index].velocity[0] = normal_x * speed * angle.cos();
            state.slots[body_index].velocity[1] = speed * angle.sin();
        }

        let half_x = state.slots[collider_index].half_extents[0];
        let radius = state.slots[body_index].radius.max(0.01);
        state.slots[body_index].position[0] =
            state.slots[collider_index].position[0] + normal_x * (half_x + radius + 0.01);
        state.push_event(RuntimeEventType::ColliderBounce, body_index, collider_index, 0);
        return;
    }
}
