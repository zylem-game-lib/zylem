//! Thruster behavior: applies forward thrust along the entity's facing
//! direction (XY plane). Mirrors the legacy TS `thruster` system without
//! its bitecs/Rapier-TS coupling.

use rapier3d::math::{Rotation, Vec3};
use rapier3d::prelude::RigidBodyHandle;
use shipyard::{Component, EntityId, Get, IntoIter, View, ViewMut, World};

#[derive(Component, Clone, Copy, Debug)]
pub struct ThrusterConfig {
    pub max_speed: f32,
    pub acceleration: f32,
    pub turn_rate_rad_s: f32,
    pub linear_damping: f32,
}

impl Default for ThrusterConfig {
    fn default() -> Self {
        Self {
            max_speed: 10.0,
            acceleration: 12.0,
            turn_rate_rad_s: 4.0,
            linear_damping: 0.2,
        }
    }
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct ThrusterInput {
    pub thrust: f32,
    pub turn: f32,
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct ThrusterState {
    pub heading_rad: f32,
    pub speed: f32,
}

pub fn attach(world: &mut World, entity: EntityId, config: ThrusterConfig) {
    world.add_component(
        entity,
        (
            config,
            ThrusterInput::default(),
            ThrusterState::default(),
        ),
    );
}

pub fn set_input(world: &mut World, entity: EntityId, thrust: f32, turn: f32) {
    if let Ok(mut inputs) = world.borrow::<ViewMut<ThrusterInput>>() {
        if let Ok(mut input) = (&mut inputs).get(entity) {
            input.thrust = thrust.clamp(-1.0, 1.0);
            input.turn = turn.clamp(-1.0, 1.0);
        }
    }
}

pub fn step(
    world: &mut World,
    bodies: &mut rapier3d::prelude::RigidBodySet,
    body_for_entity: &dyn Fn(EntityId) -> Option<RigidBodyHandle>,
    dt: f32,
) {
    let dt = dt.max(0.0);
    let mut snapshot: Vec<(EntityId, ThrusterConfig, ThrusterInput)> = Vec::new();
    if let (Ok(configs), Ok(inputs)) = (
        world.borrow::<View<ThrusterConfig>>(),
        world.borrow::<View<ThrusterInput>>(),
    ) {
        for (entity, config) in configs.iter().with_id() {
            if let Ok(input) = inputs.get(entity) {
                snapshot.push((entity, *config, *input));
            }
        }
    }

    let mut state_updates: Vec<(EntityId, ThrusterState)> = Vec::new();
    for (entity, config, input) in snapshot {
        let Some(body_handle) = body_for_entity(entity) else {
            continue;
        };
        let Some(body) = bodies.get_mut(body_handle) else {
            continue;
        };

        let mut state: ThrusterState = world
            .borrow::<View<ThrusterState>>()
            .ok()
            .and_then(|s| s.get(entity).copied().ok())
            .unwrap_or_default();

        state.heading_rad += input.turn * config.turn_rate_rad_s * dt;
        let dvx = input.thrust * config.acceleration * dt * state.heading_rad.cos();
        let dvy = input.thrust * config.acceleration * dt * state.heading_rad.sin();

        let v = body.linvel();
        let mut vx = v.x + dvx;
        let mut vy = v.y + dvy;

        // Damp linearly when no thrust input.
        if input.thrust.abs() < 0.001 {
            vx *= (1.0 - config.linear_damping * dt).max(0.0);
            vy *= (1.0 - config.linear_damping * dt).max(0.0);
        }

        let speed = (vx * vx + vy * vy).sqrt();
        if speed > config.max_speed {
            let s = config.max_speed / speed;
            vx *= s;
            vy *= s;
        }

        state.speed = (vx * vx + vy * vy).sqrt();

        body.set_linvel(Vec3::new(vx, vy, v.z), true);
        body.set_rotation(Rotation::from_axis_angle(Vec3::Z, state.heading_rad), true);

        state_updates.push((entity, state));
    }

    if let Ok(mut states) = world.borrow::<ViewMut<ThrusterState>>() {
        for (entity, new_state) in state_updates {
            if let Ok(mut state) = (&mut states).get(entity) {
                *state = new_state;
            }
        }
    }
}

pub fn query(world: &World, entity: EntityId, scratch: &mut [f32]) -> bool {
    if scratch.len() < 2 {
        return false;
    }
    if let Ok(states) = world.borrow::<View<ThrusterState>>() {
        if let Ok(state) = states.get(entity) {
            scratch[0] = state.heading_rad;
            scratch[1] = state.speed;
            return true;
        }
    }
    false
}
