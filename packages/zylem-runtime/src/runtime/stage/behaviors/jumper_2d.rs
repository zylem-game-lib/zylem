//! Simple 2D jumper: applies an upward impulse on jump press, optionally
//! buffering presses for a short window so jumps land cleanly even when
//! the press happens mid-air.

use rapier3d::prelude::RigidBodyHandle;
use shipyard::{Component, EntityId, Get, IntoIter, View, ViewMut, World};

use crate::runtime::stage::events::{EventBuffer, StageEvent, StageEventType};

#[derive(Component, Clone, Copy, Debug)]
pub struct Jumper2DConfig {
    pub jump_force: f32,
    pub max_jumps: u32,
    pub jump_buffer_time: f32,
    pub coyote_time: f32,
    pub gravity: f32,
}

impl Default for Jumper2DConfig {
    fn default() -> Self {
        Self {
            jump_force: 8.0,
            max_jumps: 1,
            jump_buffer_time: 0.1,
            coyote_time: 0.1,
            gravity: 9.82,
        }
    }
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct Jumper2DInput {
    pub jump_pressed: bool,
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct Jumper2DState {
    pub grounded: bool,
    pub jump_count: u32,
    pub jump_buffer: f32,
    pub coyote: f32,
    pub last_y: f32,
}

pub fn attach(world: &mut World, entity: EntityId, config: Jumper2DConfig) {
    world.add_component(
        entity,
        (
            config,
            Jumper2DInput::default(),
            Jumper2DState::default(),
        ),
    );
}

pub fn set_input(world: &mut World, entity: EntityId, jump_pressed: bool) {
    if let Ok(mut inputs) = world.borrow::<ViewMut<Jumper2DInput>>() {
        if let Ok(mut input) = (&mut inputs).get(entity) {
            input.jump_pressed = jump_pressed;
        }
    }
}

pub fn step(
    world: &mut World,
    bodies: &mut rapier3d::prelude::RigidBodySet,
    body_for_entity: &dyn Fn(EntityId) -> Option<RigidBodyHandle>,
    slot_for_entity: &dyn Fn(EntityId) -> Option<u32>,
    events: &mut EventBuffer,
    dt: f32,
) {
    let dt = dt.max(0.0);
    let mut snapshot: Vec<(EntityId, Jumper2DConfig, Jumper2DInput, Jumper2DState)> = Vec::new();
    if let (Ok(configs), Ok(inputs), Ok(states)) = (
        world.borrow::<View<Jumper2DConfig>>(),
        world.borrow::<View<Jumper2DInput>>(),
        world.borrow::<View<Jumper2DState>>(),
    ) {
        for (entity, config) in configs.iter().with_id() {
            if let (Ok(input), Ok(state)) = (inputs.get(entity), states.get(entity)) {
                snapshot.push((entity, *config, *input, *state));
            }
        }
    }

    let mut state_updates: Vec<(EntityId, Jumper2DState, bool, Option<u32>)> = Vec::new();
    for (entity, config, input, mut state) in snapshot {
        let Some(body_handle) = body_for_entity(entity) else {
            continue;
        };
        let Some(body) = bodies.get_mut(body_handle) else {
            continue;
        };
        let translation = body.translation();
        let velocity = body.linvel();

        let was_grounded = state.grounded;
        // Heuristic: grounded when y velocity is near zero and y is at/below
        // the previously recorded ground level. The host is expected to feed
        // ground_y via jumper2d's collision contacts (TODO once collision
        // events exist).
        state.grounded = velocity.y.abs() < 0.05 && translation.y <= state.last_y + 0.05;
        if state.grounded && !was_grounded {
            state.jump_count = 0;
            state.coyote = config.coyote_time;
        } else if !state.grounded {
            state.coyote = (state.coyote - dt).max(0.0);
        }
        state.last_y = translation.y;

        if input.jump_pressed {
            state.jump_buffer = config.jump_buffer_time;
        } else {
            state.jump_buffer = (state.jump_buffer - dt).max(0.0);
        }

        let mut jumped = false;
        let can_jump = (state.grounded || state.coyote > 0.0)
            && state.jump_count < config.max_jumps
            && state.jump_buffer > 0.0;
        if can_jump {
            body.set_linvel(rapier3d::math::Vec3::new(velocity.x, config.jump_force, velocity.z), true);
            state.jump_count += 1;
            state.jump_buffer = 0.0;
            state.coyote = 0.0;
            state.grounded = false;
            jumped = true;
        }

        // Apply gravity manually so jumper-only entities don't need a global gravity.
        if !state.grounded {
            let v = body.linvel();
            body.set_linvel(rapier3d::math::Vec3::new(v.x, v.y - config.gravity * dt, v.z), true);
        }

        let slot = slot_for_entity(entity);
        state_updates.push((entity, state, jumped, slot));
    }

    if let Ok(mut states) = world.borrow::<ViewMut<Jumper2DState>>() {
        for (entity, new_state, jumped, slot) in state_updates {
            if let Ok(mut state) = (&mut states).get(entity) {
                *state = new_state;
            }
            if jumped {
                if let Some(slot_id) = slot {
                    events.push(
                        StageEvent::new(StageEventType::JumpStarted)
                            .with_primary(slot_id)
                            .with_payload([new_state.jump_count as f32, 0.0, 0.0]),
                    );
                }
            }
        }
    }
}

/// Layout: `[grounded, jump_count, coyote, jump_buffer]`.
pub fn query(world: &World, entity: EntityId, scratch: &mut [f32]) -> bool {
    if scratch.len() < 4 {
        return false;
    }
    if let Ok(states) = world.borrow::<View<Jumper2DState>>() {
        if let Ok(state) = states.get(entity) {
            scratch[0] = if state.grounded { 1.0 } else { 0.0 };
            scratch[1] = state.jump_count as f32;
            scratch[2] = state.coyote;
            scratch[3] = state.jump_buffer;
            return true;
        }
    }
    false
}
