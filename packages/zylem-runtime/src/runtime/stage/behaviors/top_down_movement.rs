//! Top-down movement: applies XY (or XZ) intent vectors directly to the
//! body's linear velocity each frame, with optional max-speed clamp.

use rapier3d::math::{Rotation, Vec3};
use rapier3d::prelude::RigidBodyHandle;
use shipyard::{Component, EntityId, Get, IntoIter, View, ViewMut, World};

#[repr(u32)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum TopDownPlane {
    Xy = 0,
    Xz = 1,
}

#[derive(Component, Clone, Copy, Debug)]
pub struct TopDownConfig {
    pub plane: TopDownPlane,
    pub speed: f32,
    pub face_movement: bool,
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct TopDownInput {
    pub move_a: f32,
    pub move_b: f32,
}

pub fn attach(world: &mut World, entity: EntityId, config: TopDownConfig) {
    world.add_component(entity, (config, TopDownInput::default()));
}

pub fn set_input(world: &mut World, entity: EntityId, a: f32, b: f32) {
    if let Ok(mut inputs) = world.borrow::<ViewMut<TopDownInput>>() {
        if let Ok(mut input) = (&mut inputs).get(entity) {
            input.move_a = a.clamp(-1.0, 1.0);
            input.move_b = b.clamp(-1.0, 1.0);
        }
    }
}

pub fn step(
    world: &mut World,
    bodies: &mut rapier3d::prelude::RigidBodySet,
    body_for_entity: &dyn Fn(EntityId) -> Option<RigidBodyHandle>,
) {
    let mut snapshot: Vec<(EntityId, TopDownConfig, TopDownInput)> = Vec::new();
    if let (Ok(configs), Ok(inputs)) = (
        world.borrow::<View<TopDownConfig>>(),
        world.borrow::<View<TopDownInput>>(),
    ) {
        for (entity, config) in configs.iter().with_id() {
            if let Ok(input) = inputs.get(entity) {
                snapshot.push((entity, *config, *input));
            }
        }
    }

    for (entity, config, input) in snapshot {
        let Some(body_handle) = body_for_entity(entity) else {
            continue;
        };
        let Some(body) = bodies.get_mut(body_handle) else {
            continue;
        };
        let mag = (input.move_a * input.move_a + input.move_b * input.move_b).sqrt();
        let (a, b) = if mag > 1.0 {
            (input.move_a / mag, input.move_b / mag)
        } else {
            (input.move_a, input.move_b)
        };
        let v = body.linvel();
        let new_v = match config.plane {
            TopDownPlane::Xy => Vec3::new(a * config.speed, b * config.speed, v.z),
            TopDownPlane::Xz => Vec3::new(a * config.speed, v.y, b * config.speed),
        };
        body.set_linvel(new_v, true);

        if config.face_movement && (a.abs() > 0.001 || b.abs() > 0.001) {
            let yaw = b.atan2(a);
            let axis = match config.plane {
                TopDownPlane::Xy => Vec3::Z,
                TopDownPlane::Xz => Vec3::Y,
            };
            body.set_rotation(Rotation::from_axis_angle(axis, yaw), true);
        }
    }
}
