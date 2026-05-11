//! 3D jumper that piggybacks on the kinematic capsule + KCC pipeline used
//! by the platformer behavior, but without the full FSM-driven walk/run
//! integration. Useful for entities that just need to jump without all of
//! the platformer state machine.

use rapier3d::prelude::RigidBodyHandle;
use shipyard::{Component, EntityId, Get, IntoIter, View, ViewMut, World};

use crate::runtime::stage::events::{EventBuffer, StageEvent, StageEventType};

#[derive(Component, Clone, Copy, Debug)]
pub struct Jumper3DConfig {
    pub jump_force: f32,
    pub max_jumps: u32,
    pub gravity: f32,
}

impl Default for Jumper3DConfig {
    fn default() -> Self {
        Self {
            jump_force: 10.0,
            max_jumps: 1,
            gravity: 9.82,
        }
    }
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct Jumper3DInput {
    pub jump: bool,
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct Jumper3DState {
    pub grounded: bool,
    pub jump_count: u32,
    pub vy: f32,
}

pub fn attach(world: &mut World, entity: EntityId, config: Jumper3DConfig) {
    world.add_component(
        entity,
        (
            config,
            Jumper3DInput::default(),
            Jumper3DState::default(),
        ),
    );
}

pub fn set_input(world: &mut World, entity: EntityId, jump: bool) {
    if let Ok(mut inputs) = world.borrow::<ViewMut<Jumper3DInput>>() {
        if let Ok(mut input) = (&mut inputs).get(entity) {
            input.jump = jump;
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
    let mut snapshot: Vec<(EntityId, Jumper3DConfig, Jumper3DInput, Jumper3DState)> = Vec::new();
    if let (Ok(configs), Ok(inputs), Ok(states)) = (
        world.borrow::<View<Jumper3DConfig>>(),
        world.borrow::<View<Jumper3DInput>>(),
        world.borrow::<View<Jumper3DState>>(),
    ) {
        for (entity, config) in configs.iter().with_id() {
            if let (Ok(input), Ok(state)) = (inputs.get(entity), states.get(entity)) {
                snapshot.push((entity, *config, *input, *state));
            }
        }
    }

    let mut state_updates: Vec<(EntityId, Jumper3DState, bool, Option<u32>)> = Vec::new();
    for (entity, config, input, mut state) in snapshot {
        let Some(body_handle) = body_for_entity(entity) else {
            continue;
        };
        let Some(body) = bodies.get_mut(body_handle) else {
            continue;
        };
        let velocity = body.linvel();
        let translation = body.translation();
        state.vy = velocity.y;

        let was_grounded = state.grounded;
        // Approximate grounded check: y velocity stable and roughly at ground
        // (the host can override via `set_grounded` when collision events
        // become available).
        state.grounded = velocity.y.abs() < 0.05 && translation.y < 100.0;
        if state.grounded && !was_grounded {
            state.jump_count = 0;
        }

        let mut jumped = false;
        if input.jump && state.jump_count < config.max_jumps {
            body.set_linvel(
                rapier3d::math::Vec3::new(velocity.x, config.jump_force, velocity.z),
                true,
            );
            state.jump_count += 1;
            state.grounded = false;
            jumped = true;
        }

        if !state.grounded {
            let v = body.linvel();
            body.set_linvel(
                rapier3d::math::Vec3::new(v.x, v.y - config.gravity * dt, v.z),
                true,
            );
        }

        let slot = slot_for_entity(entity);
        state_updates.push((entity, state, jumped, slot));
    }

    if let Ok(mut states) = world.borrow::<ViewMut<Jumper3DState>>() {
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

pub fn query(world: &World, entity: EntityId, scratch: &mut [f32]) -> bool {
    if scratch.len() < 3 {
        return false;
    }
    if let Ok(states) = world.borrow::<View<Jumper3DState>>() {
        if let Ok(state) = states.get(entity) {
            scratch[0] = if state.grounded { 1.0 } else { 0.0 };
            scratch[1] = state.jump_count as f32;
            scratch[2] = state.vy;
            return true;
        }
    }
    false
}
