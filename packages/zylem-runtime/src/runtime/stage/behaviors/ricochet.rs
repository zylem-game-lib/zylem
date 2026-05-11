//! Unified ricochet behavior (2D and 3D). Reflects an entity's linear
//! velocity off the world bounds (acting like a "wall") and clamps the
//! resulting speed / approach angle. Replaces both `ricochet-2d` and
//! `ricochet-3d` legacy behaviors plus the special-case logic in the
//! `runtime-pong` Rust path.

use rapier3d::prelude::RigidBodyHandle;
use shipyard::{Component, EntityId, Get, View, ViewMut, World};

use crate::runtime::stage::events::{EventBuffer, StageEvent, StageEventType};

#[repr(u32)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RicochetReflection {
    Mirror = 0,
    Angled = 1,
}

#[repr(u32)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RicochetDim {
    Two = 2,
    Three = 3,
}

#[derive(Component, Clone, Copy, Debug)]
pub struct RicochetConfig {
    pub dim: RicochetDim,
    pub min_speed: f32,
    pub max_speed: f32,
    pub speed_multiplier: f32,
    pub max_angle_deg: f32,
    pub reflection_mode: RicochetReflection,
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct RicochetState {
    pub last_kind: u32,
    pub bounces: u32,
}

pub fn attach(world: &mut World, entity: EntityId, config: RicochetConfig) {
    world.add_component(entity, (config, RicochetState::default()));
}

/// Triggered by the boundary system / collision system when a bounce should
/// happen. Reflects velocity, clamps speed / angle, and emits a Ricochet
/// event.
pub fn on_bounce(
    world: &mut World,
    bodies: &mut rapier3d::prelude::RigidBodySet,
    entity: EntityId,
    body_handle: RigidBodyHandle,
    normal: [f32; 3],
    slot: u32,
    kind: u32,
    events: &mut EventBuffer,
) {
    let Ok(configs) = world.borrow::<View<RicochetConfig>>() else {
        return;
    };
    let Ok(config) = configs.get(entity) else {
        return;
    };
    let config = *config;
    drop(configs);

    let Some(body) = bodies.get_mut(body_handle) else {
        return;
    };
    let v = body.linvel();
    let mut v = [v.x, v.y, v.z];
    let n = normalize3(normal);

    match config.reflection_mode {
        RicochetReflection::Mirror => {
            v = reflect3(v, n);
        }
        RicochetReflection::Angled => {
            v = reflect3(v, n);
            // Clamp the angle of approach away from the surface normal so
            // the resulting trajectory stays within `max_angle_deg` from
            // the perpendicular bounce.
            v = clamp_angle(v, n, config.max_angle_deg.to_radians());
        }
    }

    // Apply speed multiplier and clamp.
    let speed = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt() * config.speed_multiplier;
    let speed = speed.clamp(config.min_speed.max(0.0), config.max_speed.max(0.001));
    let dir = normalize3(v);
    v = [dir[0] * speed, dir[1] * speed, dir[2] * speed];

    if matches!(config.dim, RicochetDim::Two) {
        v[2] = 0.0;
    }

    body.set_linvel(rapier3d::math::Vec3::new(v[0], v[1], v[2]), true);

    if let Ok(mut states) = world.borrow::<ViewMut<RicochetState>>() {
        if let Ok(mut state) = (&mut states).get(entity) {
            state.last_kind = kind;
            state.bounces = state.bounces.saturating_add(1);
        }
    }

    events.push(
        StageEvent::new(StageEventType::Ricochet)
            .with_primary(slot)
            .with_payload([kind as f32, 0.0, 0.0]),
    );
}

fn normalize3(v: [f32; 3]) -> [f32; 3] {
    let mag = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();
    if mag < 1e-6 {
        [0.0; 3]
    } else {
        [v[0] / mag, v[1] / mag, v[2] / mag]
    }
}

fn reflect3(v: [f32; 3], n: [f32; 3]) -> [f32; 3] {
    let dot = v[0] * n[0] + v[1] * n[1] + v[2] * n[2];
    [
        v[0] - 2.0 * dot * n[0],
        v[1] - 2.0 * dot * n[1],
        v[2] - 2.0 * dot * n[2],
    ]
}

fn clamp_angle(v: [f32; 3], n: [f32; 3], max_angle: f32) -> [f32; 3] {
    let speed = (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]).sqrt();
    if speed < 1e-6 {
        return v;
    }
    let dir = normalize3(v);
    let cos_t = dir[0] * n[0] + dir[1] * n[1] + dir[2] * n[2];
    let angle = cos_t.clamp(-1.0, 1.0).acos();
    if angle <= max_angle {
        return v;
    }
    let t = max_angle / angle;
    let lerp = [
        dir[0] * (1.0 - t) + n[0] * t,
        dir[1] * (1.0 - t) + n[1] * t,
        dir[2] * (1.0 - t) + n[2] * t,
    ];
    let lerp = normalize3(lerp);
    [lerp[0] * speed, lerp[1] * speed, lerp[2] * speed]
}

/// Layout: `[bounces, last_kind]`.
pub fn query(world: &World, entity: EntityId, scratch: &mut [f32]) -> bool {
    if scratch.len() < 2 {
        return false;
    }
    if let Ok(states) = world.borrow::<View<RicochetState>>() {
        if let Ok(state) = states.get(entity) {
            scratch[0] = state.bounces as f32;
            scratch[1] = state.last_kind as f32;
            return true;
        }
    }
    false
}
