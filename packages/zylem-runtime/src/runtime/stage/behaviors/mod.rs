//! Per-behavior Shipyard component + system modules for the unified
//! `StageSimulation`. Each behavior:
//!
//! - declares its component(s) (parameters + last-frame state),
//! - exposes `attach(world, entity, options)` that adds the component(s),
//! - exposes a `step(...)` system that runs once per frame from
//!   [`StageSimulation::step`],
//! - optionally exposes `query(world, entity)` returning a fixed-size
//!   payload the host copies into a scratch buffer for TS-side handle
//!   methods (e.g. `getLastHits()`).

pub mod cooldown;
pub mod first_person;
pub mod jumper_2d;
pub mod jumper_3d;
pub mod platformer_3d;
pub mod ricochet;
pub mod screen_wrap;
pub mod shooter_2d;
pub mod thruster;
pub mod top_down_movement;
pub mod world_boundary;
