//! Screen-wrap behavior: when an entity's body exits a 2D rectangle, snap
//! it to the opposite edge. Mirrors the legacy TS `screen-wrap` system.

use rapier3d::prelude::RigidBodyHandle;
use shipyard::{Component, EntityId, Get, IntoIter, View, ViewMut, World};

use crate::runtime::stage::events::{EventBuffer, StageEvent, StageEventType};

#[derive(Component, Clone, Copy, Debug)]
pub struct ScreenWrapConfig {
    pub width: f32,
    pub height: f32,
    pub center_x: f32,
    pub center_y: f32,
    pub edge_threshold: f32,
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct ScreenWrapState {
    /// FSM state, packed as a small enum:
    /// 0 = center, 1 = near-edge, 2 = wrapped (this frame).
    pub fsm: u32,
    pub last_wrapped_axis: u32,
}

pub fn attach(world: &mut World, entity: EntityId, config: ScreenWrapConfig) {
    world.add_component(entity, (config, ScreenWrapState::default()));
}

const FSM_CENTER: u32 = 0;
const FSM_NEAR_EDGE: u32 = 1;
const FSM_WRAPPED: u32 = 2;

const AXIS_X: u32 = 1 << 0;
const AXIS_Y: u32 = 1 << 1;

pub fn step(
    world: &mut World,
    bodies: &mut rapier3d::prelude::RigidBodySet,
    slot_for_entity: &dyn Fn(EntityId) -> Option<u32>,
    body_for_entity: &dyn Fn(EntityId) -> Option<RigidBodyHandle>,
    events: &mut EventBuffer,
) {
    let mut snapshot: Vec<(EntityId, ScreenWrapConfig)> = Vec::new();
    if let Ok(configs) = world.borrow::<View<ScreenWrapConfig>>() {
        for (entity, config) in configs.iter().with_id() {
            snapshot.push((entity, *config));
        }
    }

    let mut updates: Vec<(EntityId, ScreenWrapState, Option<u32>)> = Vec::new();
    for (entity, config) in snapshot {
        let Some(body_handle) = body_for_entity(entity) else {
            continue;
        };
        let Some(body) = bodies.get_mut(body_handle) else {
            continue;
        };
        let translation = body.translation();
        let half_w = config.width * 0.5;
        let half_h = config.height * 0.5;
        let min_x = config.center_x - half_w;
        let max_x = config.center_x + half_w;
        let min_y = config.center_y - half_h;
        let max_y = config.center_y + half_h;

        let mut x = translation.x;
        let mut y = translation.y;
        let mut wrapped_axes: u32 = 0;
        if x < min_x {
            x = max_x - (min_x - x);
            wrapped_axes |= AXIS_X;
        } else if x > max_x {
            x = min_x + (x - max_x);
            wrapped_axes |= AXIS_X;
        }
        if y < min_y {
            y = max_y - (min_y - y);
            wrapped_axes |= AXIS_Y;
        } else if y > max_y {
            y = min_y + (y - max_y);
            wrapped_axes |= AXIS_Y;
        }

        if wrapped_axes != 0 {
            body.set_translation(
                rapier3d::math::Vec3::new(x, y, translation.z),
                true,
            );
        }

        let mut fsm = FSM_CENTER;
        if wrapped_axes != 0 {
            fsm = FSM_WRAPPED;
        } else {
            let near_x = (x - min_x).min(max_x - x).abs();
            let near_y = (y - min_y).min(max_y - y).abs();
            if near_x < config.edge_threshold || near_y < config.edge_threshold {
                fsm = FSM_NEAR_EDGE;
            }
        }

        let slot = slot_for_entity(entity);
        updates.push((
            entity,
            ScreenWrapState {
                fsm,
                last_wrapped_axis: wrapped_axes,
            },
            slot,
        ));
    }

    if let Ok(mut states) = world.borrow::<ViewMut<ScreenWrapState>>() {
        for (entity, new_state, slot) in &updates {
            if let Ok(mut state) = (&mut states).get(*entity) {
                let was_wrapped = state.fsm == FSM_WRAPPED;
                *state = *new_state;
                if new_state.fsm == FSM_WRAPPED && !was_wrapped {
                    if let Some(slot_id) = *slot {
                        events.push(
                            StageEvent::new(StageEventType::Wrapped)
                                .with_primary(slot_id)
                                .with_payload([
                                    new_state.last_wrapped_axis as f32,
                                    0.0,
                                    0.0,
                                ]),
                        );
                    }
                }
            }
        }
    }
}

/// Layout: `[fsm, last_wrapped_axes]`.
pub fn query(world: &World, entity: EntityId, scratch: &mut [f32]) -> bool {
    if scratch.len() < 2 {
        return false;
    }
    if let Ok(states) = world.borrow::<View<ScreenWrapState>>() {
        if let Ok(state) = states.get(entity) {
            scratch[0] = state.fsm as f32;
            scratch[1] = state.last_wrapped_axis as f32;
            return true;
        }
    }
    false
}
