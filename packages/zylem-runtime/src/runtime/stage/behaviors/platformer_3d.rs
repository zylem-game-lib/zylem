//! Stage-side wrapper around the existing [`crate::runtime::behaviors::platformer_3d`]
//! KCC + jump FSM. Reuses the legacy Rust implementation directly so the
//! port to the unified `StageSimulation` is purely structural — the actual
//! movement / jump rules are unchanged.

use rapier3d::prelude::RigidBodyHandle;
use shipyard::{Component, EntityId, Get, View, ViewMut, World};

pub use crate::runtime::behaviors::platformer_3d::components::{
    Platformer3DConfig, Platformer3DInput, Platformer3DState,
};
pub use crate::runtime::behaviors::platformer_3d::fsm::Platformer3DFsmState;

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct PlatformerSlotShape {
    pub half_height: f32,
    pub radius: f32,
}

/// Component newtype around the legacy `Platformer3DConfig` so it can be
/// stored in a Shipyard storage without requiring the legacy module to
/// derive `Component` (those types are reused by the `Gameplay3DState`
/// path which doesn't need Shipyard).
#[derive(Component, Clone, Copy, Debug)]
pub struct PlatformerConfigComponent(pub Platformer3DConfig);

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct PlatformerInputComponent(pub Platformer3DInput);

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct PlatformerStateWrapper(pub Platformer3DState);

#[derive(Component, Clone, Copy, Debug, Default)]
pub struct PlatformerFsmWrapper(pub Platformer3DFsmState);

pub fn attach(
    world: &mut World,
    entity: EntityId,
    config: Platformer3DConfig,
    shape: PlatformerSlotShape,
) {
    world.add_component(
        entity,
        (
            PlatformerConfigComponent(config),
            PlatformerInputComponent(Platformer3DInput::default()),
            PlatformerStateWrapper::default(),
            PlatformerFsmWrapper::default(),
            shape,
        ),
    );
}

pub fn set_input_axes(world: &mut World, entity: EntityId, move_x: f32, move_z: f32) {
    if let Ok(mut inputs) = world.borrow::<ViewMut<PlatformerInputComponent>>() {
        if let Ok(mut input) = (&mut inputs).get(entity) {
            input.0.move_x = move_x.clamp(-1.0, 1.0);
            input.0.move_z = move_z.clamp(-1.0, 1.0);
        }
    }
}

pub fn set_input_buttons(world: &mut World, entity: EntityId, jump: bool, run: bool) {
    if let Ok(mut inputs) = world.borrow::<ViewMut<PlatformerInputComponent>>() {
        if let Ok(mut input) = (&mut inputs).get(entity) {
            input.0.jump = jump;
            input.0.run = run;
        }
    }
}

/// Layout: `[grounded, jump_count, fsm_state, vy]`.
pub fn query(world: &World, entity: EntityId, scratch: &mut [f32]) -> bool {
    if scratch.len() < 4 {
        return false;
    }
    if let (Ok(states), Ok(fsm)) = (
        world.borrow::<View<PlatformerStateWrapper>>(),
        world.borrow::<View<PlatformerFsmWrapper>>(),
    ) {
        if let (Ok(state), Ok(fsm_state)) = (states.get(entity), fsm.get(entity)) {
            scratch[0] = if state.0.grounded { 1.0 } else { 0.0 };
            scratch[1] = state.0.jump_count as f32;
            scratch[2] = fsm_state.0 as u32 as f32;
            scratch[3] = state.0.current_speed;
            return true;
        }
    }
    false
}

/// Lookup helper used by the simulation's per-tick step.
pub fn slot_shape(world: &World, entity: EntityId) -> Option<PlatformerSlotShape> {
    world
        .borrow::<View<PlatformerSlotShape>>()
        .ok()
        .and_then(|v| v.get(entity).copied().ok())
}

/// Read the current input vector for a platformer entity.
pub fn slot_input(world: &World, entity: EntityId) -> Option<Platformer3DInput> {
    world
        .borrow::<View<PlatformerInputComponent>>()
        .ok()
        .and_then(|v| v.get(entity).copied().ok().map(|w| w.0))
}

/// Read the current config for a platformer entity.
pub fn slot_config(world: &World, entity: EntityId) -> Option<Platformer3DConfig> {
    world
        .borrow::<View<PlatformerConfigComponent>>()
        .ok()
        .and_then(|v| v.get(entity).copied().ok().map(|w| w.0))
}

pub fn read_state(world: &World, entity: EntityId) -> Option<Platformer3DState> {
    world
        .borrow::<View<PlatformerStateWrapper>>()
        .ok()
        .and_then(|v| v.get(entity).copied().ok().map(|w| w.0))
}

pub fn write_state(world: &mut World, entity: EntityId, state: Platformer3DState, fsm: Platformer3DFsmState) {
    if let (Ok(mut states), Ok(mut fsms)) = (
        world.borrow::<ViewMut<PlatformerStateWrapper>>(),
        world.borrow::<ViewMut<PlatformerFsmWrapper>>(),
    ) {
        if let Ok(mut s) = (&mut states).get(entity) {
            s.0 = state;
        }
        if let Ok(mut f) = (&mut fsms).get(entity) {
            f.0 = fsm;
        }
    }
}

/// References needed by the platformer step. The simulation passes these in
/// rather than embedding them in the World, so the existing Rapier-based
/// implementation in `crate::runtime::behaviors::platformer_3d::system` can
/// be ported across.
pub struct PlatformerStepEntity {
    pub entity: EntityId,
    pub slot: u32,
    pub body: RigidBodyHandle,
}
