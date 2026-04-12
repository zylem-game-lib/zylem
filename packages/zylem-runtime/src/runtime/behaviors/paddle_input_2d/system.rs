use crate::runtime::components::body_2d::Body2DKind;
use crate::runtime::modes::gameplay_2d::Gameplay2DState;

pub fn step_kinematic_aabb_bodies(state: &mut Gameplay2DState, dt: f32) {
    for index in 0..state.slots.len() {
        if state.slots[index].kind != Body2DKind::KinematicAabb {
            continue;
        }

        let player_input = state.input_axes[state.slots[index].input_channel];
        let speed = state.slots[index].speed;
        state.slots[index].position[1] += player_input * speed * dt;
        let half_y = state.slots[index].half_extents[1].max(0.01);
        state.slots[index].position[1] = state.slots[index]
            .position[1]
            .clamp(state.bounds.bottom + half_y, state.bounds.top - half_y);
    }
}
