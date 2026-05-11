//! 2D shooter behavior: emits projectile-spawn events at a configured
//! cooldown when the host requests a shot. Actual projectile entity
//! creation happens host-side because the visual layer is TS-owned.

use shipyard::{Component, EntityId, Get, IntoIter, View, ViewMut, World};

use crate::runtime::stage::events::{EventBuffer, StageEvent, StageEventType};

#[derive(Component, Clone, Copy, Debug)]
pub struct Shooter2DConfig {
    pub fire_rate_hz: f32,
    pub muzzle_offset: [f32; 2],
    pub muzzle_speed: f32,
}

impl Default for Shooter2DConfig {
    fn default() -> Self {
        Self {
            fire_rate_hz: 4.0,
            muzzle_offset: [0.5, 0.0],
            muzzle_speed: 18.0,
        }
    }
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct Shooter2DState {
    pub cooldown: f32,
    pub fired_count: u32,
}

pub fn attach(world: &mut World, entity: EntityId, config: Shooter2DConfig) {
    world.add_component(entity, (config, Shooter2DState::default()));
}

/// Request to fire. If the cooldown has elapsed, emits a Ricochet-style
/// event tagged with the muzzle pose / velocity for the host to act on.
pub fn try_fire(
    world: &mut World,
    entity: EntityId,
    slot: u32,
    body_pose: [f32; 3],
    body_yaw: f32,
    events: &mut EventBuffer,
) -> bool {
    let mut config: Shooter2DConfig = match world
        .borrow::<View<Shooter2DConfig>>()
        .ok()
        .and_then(|c| c.get(entity).copied().ok())
    {
        Some(c) => c,
        None => return false,
    };
    config.fire_rate_hz = config.fire_rate_hz.max(0.001);

    let mut fired = false;
    if let Ok(mut states) = world.borrow::<ViewMut<Shooter2DState>>() {
        if let Ok(mut state) = (&mut states).get(entity) {
            if state.cooldown <= 0.0 {
                state.cooldown = 1.0 / config.fire_rate_hz;
                state.fired_count = state.fired_count.saturating_add(1);
                fired = true;
            }
        }
    }

    if fired {
        let cos_yaw = body_yaw.cos();
        let sin_yaw = body_yaw.sin();
        let mx = body_pose[0]
            + config.muzzle_offset[0] * cos_yaw
            - config.muzzle_offset[1] * sin_yaw;
        let my = body_pose[1]
            + config.muzzle_offset[0] * sin_yaw
            + config.muzzle_offset[1] * cos_yaw;
        let vx = config.muzzle_speed * cos_yaw;
        let vy = config.muzzle_speed * sin_yaw;
        events.push(
            StageEvent::new(StageEventType::CooldownFired)
                .with_primary(slot)
                .with_payload([mx, my, vx.atan2(vy)]),
        );
        let _ = (mx, my, vx, vy);
    }
    fired
}

pub fn step(world: &mut World, dt: f32) {
    let dt = dt.max(0.0);
    if let Ok(mut states) = world.borrow::<ViewMut<Shooter2DState>>() {
        for state in (&mut states).iter() {
            if state.cooldown > 0.0 {
                state.cooldown = (state.cooldown - dt).max(0.0);
            }
        }
    }
}

/// Layout: `[cooldown, fired_count]`.
pub fn query(world: &World, entity: EntityId, scratch: &mut [f32]) -> bool {
    if scratch.len() < 2 {
        return false;
    }
    if let Ok(states) = world.borrow::<View<Shooter2DState>>() {
        if let Ok(state) = states.get(entity) {
            scratch[0] = state.cooldown;
            scratch[1] = state.fired_count as f32;
            return true;
        }
    }
    false
}
