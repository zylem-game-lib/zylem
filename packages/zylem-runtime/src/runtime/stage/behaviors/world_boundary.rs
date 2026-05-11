//! Unified `world-boundary-2d` and `world-boundary-3d` behaviors.
//!
//! Each tick the system reads the body's translation, snaps it back inside
//! the configured bounds, and stores per-axis "hits" for the TS handle to
//! query. Mirrors the behaviour of the legacy
//! `WorldBoundary2D` / `WorldBoundary3D` TS systems.

use rapier3d::prelude::RigidBodyHandle;
use shipyard::{Component, EntityId, Get, IntoIter, View, ViewMut, World};

use crate::runtime::stage::events::{EventBuffer, StageEvent, StageEventType};

/// Dimensionality of the boundary check. The 2D variant ignores the Z axis
/// when clamping, but still records a `top`/`bottom`/`left`/`right` hit
/// pattern so 2D and 3D handles can share the FFI layout.
#[repr(u32)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BoundaryDim {
    Two = 2,
    Three = 3,
}

#[derive(Component, Clone, Copy, Debug)]
pub struct WorldBoundaryConfig {
    pub dim: BoundaryDim,
    pub top: f32,
    pub bottom: f32,
    pub left: f32,
    pub right: f32,
    pub front: f32,
    pub back: f32,
    pub padding: f32,
}

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct WorldBoundaryState {
    /// Last-frame per-axis hit flags packed as a bitmask (compatible with
    /// the legacy TS `getLastHits()` shape):
    /// bit 0 = top, 1 = bottom, 2 = left, 3 = right, 4 = front, 5 = back.
    pub hits: u32,
    /// Last-frame clamped position (post-snap). NaN if never updated.
    pub last_clamped: [f32; 3],
}

pub fn attach(
    world: &mut World,
    entity: EntityId,
    config: WorldBoundaryConfig,
) {
    world.add_component(
        entity,
        (
            config,
            WorldBoundaryState {
                hits: 0,
                last_clamped: [f32::NAN; 3],
            },
        ),
    );
}

const BIT_TOP: u32 = 1 << 0;
const BIT_BOTTOM: u32 = 1 << 1;
const BIT_LEFT: u32 = 1 << 2;
const BIT_RIGHT: u32 = 1 << 3;
const BIT_FRONT: u32 = 1 << 4;
const BIT_BACK: u32 = 1 << 5;

pub fn step(
    world: &mut World,
    bodies: &mut rapier3d::prelude::RigidBodySet,
    slot_for_entity: &dyn Fn(EntityId) -> Option<u32>,
    body_for_entity: &dyn Fn(EntityId) -> Option<RigidBodyHandle>,
    events: &mut EventBuffer,
) {
    let mut snapshot: Vec<(EntityId, WorldBoundaryConfig)> = Vec::new();
    if let Ok(configs) = world.borrow::<View<WorldBoundaryConfig>>() {
        for (entity, config) in configs.iter().with_id() {
            snapshot.push((entity, *config));
        }
    }

    let mut updates: Vec<(EntityId, WorldBoundaryState, Option<u32>)> = Vec::new();
    for (entity, config) in snapshot {
        let Some(body_handle) = body_for_entity(entity) else {
            continue;
        };
        let Some(body) = bodies.get_mut(body_handle) else {
            continue;
        };
        let translation = body.translation();
        let mut x = translation.x;
        let mut y = translation.y;
        let mut z = translation.z;
        let mut hits: u32 = 0;
        let pad = config.padding;

        if x - pad < config.left {
            x = config.left + pad;
            hits |= BIT_LEFT;
        }
        if x + pad > config.right {
            x = config.right - pad;
            hits |= BIT_RIGHT;
        }
        if y - pad < config.bottom {
            y = config.bottom + pad;
            hits |= BIT_BOTTOM;
        }
        if y + pad > config.top {
            y = config.top - pad;
            hits |= BIT_TOP;
        }
        if matches!(config.dim, BoundaryDim::Three) {
            if z - pad < config.back {
                z = config.back + pad;
                hits |= BIT_BACK;
            }
            if z + pad > config.front {
                z = config.front - pad;
                hits |= BIT_FRONT;
            }
        }

        if hits != 0 {
            body.set_translation(rapier3d::math::Vec3::new(x, y, z), true);
        }

        let slot = slot_for_entity(entity);
        updates.push((
            entity,
            WorldBoundaryState {
                hits,
                last_clamped: [x, y, z],
            },
            slot,
        ));
    }

    if let Ok(mut states) = world.borrow::<ViewMut<WorldBoundaryState>>() {
        for (entity, new_state, slot) in &updates {
            if let Ok(mut state) = (&mut states).get(*entity) {
                let was_hit = state.hits;
                *state = *new_state;
                if new_state.hits != 0 && new_state.hits != was_hit {
                    if let Some(slot_id) = *slot {
                        events.push(
                            StageEvent::new(StageEventType::BoundaryHit)
                                .with_primary(slot_id)
                                .with_payload([new_state.hits as f32, 0.0, 0.0]),
                        );
                    }
                }
            }
        }
    }
}

/// Pack the boundary state for the TS handle to read. Layout:
/// `[hits_bits, clamped_x, clamped_y, clamped_z]`.
pub fn query(world: &World, entity: EntityId, scratch: &mut [f32]) -> bool {
    if scratch.len() < 4 {
        return false;
    }
    if let Ok(states) = world.borrow::<View<WorldBoundaryState>>() {
        if let Ok(state) = states.get(entity) {
            scratch[0] = state.hits as f32;
            scratch[1] = state.last_clamped[0];
            scratch[2] = state.last_clamped[1];
            scratch[3] = state.last_clamped[2];
            return true;
        }
    }
    false
}
