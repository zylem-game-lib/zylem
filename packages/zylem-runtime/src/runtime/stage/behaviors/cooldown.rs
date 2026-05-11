//! Cooldown behavior: per-entity named timers that the TS handle queries
//! via `isReady` / `fire` / `reset`.
//!
//! Names are passed across the FFI as small `u32` ids — the host hashes the
//! string to a stable id at attach time and uses that id for every
//! subsequent call. This keeps the FFI a tight numeric surface.

use shipyard::{Component, EntityId, Get, IntoIter, View, ViewMut, World};

use crate::runtime::stage::events::{EventBuffer, StageEvent, StageEventType};

#[derive(Clone, Debug)]
pub struct CooldownEntry {
    pub id: u32,
    pub duration: f32,
    pub remaining: f32,
}

#[derive(Component, Default, Debug)]
pub struct CooldownState {
    pub entries: Vec<CooldownEntry>,
}

impl CooldownState {
    fn entry_mut(&mut self, id: u32) -> Option<&mut CooldownEntry> {
        self.entries.iter_mut().find(|e| e.id == id)
    }

    fn entry(&self, id: u32) -> Option<&CooldownEntry> {
        self.entries.iter().find(|e| e.id == id)
    }
}

pub fn ensure_attached(world: &mut World, entity: EntityId) {
    let already = world
        .borrow::<View<CooldownState>>()
        .map(|view| view.contains(entity))
        .unwrap_or(false);
    if !already {
        world.add_component(entity, (CooldownState::default(),));
    }
}

pub fn register(
    world: &mut World,
    entity: EntityId,
    cooldown_id: u32,
    duration: f32,
    immediate: bool,
) -> bool {
    ensure_attached(world, entity);
    if let Ok(mut states) = world.borrow::<ViewMut<CooldownState>>() {
        if let Ok(mut state) = (&mut states).get(entity) {
            if let Some(existing) = state.entry_mut(cooldown_id) {
                existing.duration = duration.max(0.0);
                if immediate {
                    existing.remaining = 0.0;
                }
                return true;
            }
            state.entries.push(CooldownEntry {
                id: cooldown_id,
                duration: duration.max(0.0),
                remaining: if immediate { 0.0 } else { duration.max(0.0) },
            });
            return true;
        }
    }
    false
}

pub fn fire(
    world: &mut World,
    entity: EntityId,
    cooldown_id: u32,
    events: &mut EventBuffer,
    slot: u32,
) -> bool {
    if let Ok(mut states) = world.borrow::<ViewMut<CooldownState>>() {
        if let Ok(mut state) = (&mut states).get(entity) {
            if let Some(entry) = state.entry_mut(cooldown_id) {
                if entry.remaining > 0.0 {
                    return false;
                }
                entry.remaining = entry.duration;
                events.push(
                    StageEvent::new(StageEventType::CooldownFired)
                        .with_primary(slot)
                        .with_payload([cooldown_id as f32, 0.0, 0.0]),
                );
                return true;
            }
        }
    }
    false
}

pub fn reset(world: &mut World, entity: EntityId, cooldown_id: u32) -> bool {
    if let Ok(mut states) = world.borrow::<ViewMut<CooldownState>>() {
        if let Ok(mut state) = (&mut states).get(entity) {
            if let Some(entry) = state.entry_mut(cooldown_id) {
                entry.remaining = 0.0;
                return true;
            }
        }
    }
    false
}

/// Read remaining seconds for a cooldown id. Returns `f32::NAN` if the id
/// isn't registered for this entity.
pub fn remaining(world: &World, entity: EntityId, cooldown_id: u32) -> f32 {
    if let Ok(states) = world.borrow::<View<CooldownState>>() {
        if let Ok(state) = states.get(entity) {
            if let Some(entry) = state.entry(cooldown_id) {
                return entry.remaining;
            }
        }
    }
    f32::NAN
}

pub fn step(world: &mut World, dt: f32) {
    let dt = dt.max(0.0);
    if let Ok(mut states) = world.borrow::<ViewMut<CooldownState>>() {
        for state in (&mut states).iter() {
            for entry in state.entries.iter_mut() {
                if entry.remaining > 0.0 {
                    entry.remaining = (entry.remaining - dt).max(0.0);
                }
            }
        }
    }
}
