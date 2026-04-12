use crate::runtime::components::body_2d::Body2DKind;
use crate::runtime::events::RuntimeEventType;
use crate::runtime::modes::gameplay_2d::Gameplay2DState;

pub fn resolve_boundary_bounce(state: &mut Gameplay2DState, body_index: usize) {
    if state.slots[body_index].kind != Body2DKind::DynamicCircle || !state.slots[body_index].uses_boundary_2d {
        return;
    }

    let radius = state.slots[body_index].radius.max(0.01);
    if state.slots[body_index].position[1] + radius >= state.bounds.top {
        state.slots[body_index].position[1] = state.bounds.top - radius;
        state.slots[body_index].velocity[1] = -state.slots[body_index].velocity[1].abs();
        state.push_event(RuntimeEventType::BoundaryBounce, body_index, 0, 0);
    } else if state.slots[body_index].position[1] - radius <= state.bounds.bottom {
        state.slots[body_index].position[1] = state.bounds.bottom + radius;
        state.slots[body_index].velocity[1] = state.slots[body_index].velocity[1].abs();
        state.push_event(RuntimeEventType::BoundaryBounce, body_index, 0, 0);
    }
}
