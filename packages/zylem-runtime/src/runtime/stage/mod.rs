//! Unified Stage simulation: a single Shipyard `World` + a single Rapier
//! `RigidBodySet`/`ColliderSet` that hosts every entity from a Zylem
//! `ZylemStage`. Replaces the legacy mode-based simulation
//! (`BufferDriven` / `Instancing` / `Gameplay2D` / `Gameplay3D`).
//!
//! The host (TypeScript `WasmStageRuntime`) drives this through the FFI in
//! `crate::stage_ffi`. Entities are addressed by stable `u32` slot handles
//! (see [`slot_table`]); behaviors plug in as Shipyard components + a
//! per-tick system (see [`behaviors`]).

pub mod behaviors;
pub mod body;
pub mod events;
pub mod render;
pub mod simulation;
pub mod slot_table;

pub use body::*;
pub use events::*;
pub use render::*;
pub use simulation::*;
pub use slot_table::*;
