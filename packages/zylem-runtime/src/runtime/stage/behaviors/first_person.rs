//! First-person controller behavior. Yaw/pitch live in the runtime so
//! the camera view direction (computed TS-side) stays consistent with the
//! body's facing across frames.

use rapier3d::math::{Rotation, Vec3};
use rapier3d::prelude::RigidBodyHandle;
use shipyard::{Component, EntityId, Get, IntoIter, View, ViewMut, World};

#[derive(Component, Clone, Copy, Debug)]
pub struct FirstPersonConfig {
    pub walk_speed: f32,
    pub run_speed: f32,
    pub eye_height: f32,
    pub look_sensitivity: f32,
}

impl Default for FirstPersonConfig {
    fn default() -> Self {
        Self {
            walk_speed: 8.0,
            run_speed: 16.0,
            eye_height: 1.7,
            look_sensitivity: 2.0,
        }
    }
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct FirstPersonInput {
    pub move_x: f32,
    pub move_z: f32,
    pub look_yaw_delta: f32,
    pub look_pitch_delta: f32,
    pub run: bool,
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct FirstPersonState {
    pub yaw: f32,
    pub pitch: f32,
    pub speed: f32,
}

pub fn attach(world: &mut World, entity: EntityId, config: FirstPersonConfig) {
    world.add_component(
        entity,
        (
            config,
            FirstPersonInput::default(),
            FirstPersonState::default(),
        ),
    );
}

pub fn set_input(
    world: &mut World,
    entity: EntityId,
    move_x: f32,
    move_z: f32,
    look_yaw_delta: f32,
    look_pitch_delta: f32,
    run: bool,
) {
    if let Ok(mut inputs) = world.borrow::<ViewMut<FirstPersonInput>>() {
        if let Ok(mut input) = (&mut inputs).get(entity) {
            input.move_x = move_x.clamp(-1.0, 1.0);
            input.move_z = move_z.clamp(-1.0, 1.0);
            input.look_yaw_delta = look_yaw_delta;
            input.look_pitch_delta = look_pitch_delta;
            input.run = run;
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
    let mut snapshot: Vec<(EntityId, FirstPersonConfig, FirstPersonInput, FirstPersonState)> =
        Vec::new();
    if let (Ok(configs), Ok(inputs), Ok(states)) = (
        world.borrow::<View<FirstPersonConfig>>(),
        world.borrow::<View<FirstPersonInput>>(),
        world.borrow::<View<FirstPersonState>>(),
    ) {
        for (entity, config) in configs.iter().with_id() {
            if let (Ok(input), Ok(state)) = (inputs.get(entity), states.get(entity)) {
                snapshot.push((entity, *config, *input, *state));
            }
        }
    }

    let mut state_updates: Vec<(EntityId, FirstPersonState)> = Vec::new();
    for (entity, config, input, mut state) in snapshot {
        let Some(body_handle) = body_for_entity(entity) else {
            continue;
        };
        let Some(body) = bodies.get_mut(body_handle) else {
            continue;
        };

        state.yaw += input.look_yaw_delta * config.look_sensitivity * dt;
        state.pitch =
            (state.pitch + input.look_pitch_delta * config.look_sensitivity * dt)
                .clamp(-1.5, 1.5);

        let cos_yaw = state.yaw.cos();
        let sin_yaw = state.yaw.sin();
        let speed = if input.run {
            config.run_speed
        } else {
            config.walk_speed
        };
        let forward = [-sin_yaw, 0.0, -cos_yaw];
        let right = [cos_yaw, 0.0, -sin_yaw];
        let mag = (input.move_x * input.move_x + input.move_z * input.move_z).sqrt();
        let (mx, mz) = if mag > 1.0 {
            (input.move_x / mag, input.move_z / mag)
        } else {
            (input.move_x, input.move_z)
        };
        let vx = forward[0] * mz * speed + right[0] * mx * speed;
        let vz = forward[2] * mz * speed + right[2] * mx * speed;
        state.speed = (vx * vx + vz * vz).sqrt();

        let v = body.linvel();
        body.set_linvel(Vec3::new(vx, v.y, vz), true);

        body.set_rotation(Rotation::from_axis_angle(Vec3::Y, state.yaw), true);

        state_updates.push((entity, state));
    }

    if let Ok(mut states) = world.borrow::<ViewMut<FirstPersonState>>() {
        for (entity, new_state) in state_updates {
            if let Ok(mut state) = (&mut states).get(entity) {
                *state = new_state;
            }
        }
    }
}

/// Layout: `[yaw, pitch, speed, eye_height]`.
pub fn query(world: &World, entity: EntityId, scratch: &mut [f32]) -> bool {
    if scratch.len() < 4 {
        return false;
    }
    if let Ok(states) = world.borrow::<View<FirstPersonState>>() {
        if let Ok(state) = states.get(entity) {
            if let Ok(configs) = world.borrow::<View<FirstPersonConfig>>() {
                if let Ok(config) = configs.get(entity) {
                    scratch[0] = state.yaw;
                    scratch[1] = state.pitch;
                    scratch[2] = state.speed;
                    scratch[3] = config.eye_height;
                    return true;
                }
            }
        }
    }
    false
}
