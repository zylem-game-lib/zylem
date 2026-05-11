//! Stable `u32` slot handles for `StageSimulation` entities.
//!
//! The host (TS `WasmStageRuntime`) addresses entities by an opaque `u32`
//! slot; the table tracks per-slot generation so reused slots can be
//! detected, even though the public FFI exposes only the slot index for
//! brevity (the host's `GameEntity.runtimeHandle` lifetime tracks the slot
//! generation implicitly via spawn / despawn).

use rapier3d::prelude::{ColliderHandle, RigidBodyHandle};
use shipyard::EntityId;

/// Sentinel returned by FFI when a slot allocation fails.
pub const INVALID_SLOT: u32 = u32::MAX;

#[derive(Clone, Default)]
pub struct Slot {
    pub generation: u32,
    pub active: bool,
    pub entity_id: Option<EntityId>,
    pub body: Option<RigidBodyHandle>,
    pub colliders: Vec<ColliderHandle>,
    /// Sticky flag: if any of this slot's colliders were created with the
    /// `sensor` flag, behaviors that need intersection events read this
    /// instead of probing each collider.
    pub has_sensor_collider: bool,
}

#[derive(Default)]
pub struct SlotTable {
    slots: Vec<Slot>,
    free_list: Vec<u32>,
    active_count: u32,
}

impl SlotTable {
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            slots: Vec::with_capacity(capacity),
            free_list: Vec::with_capacity(capacity),
            active_count: 0,
        }
    }

    /// Allocates a new slot, reusing a freed entry when possible. The slot
    /// has no Shipyard entity / body until a subsequent `attach_*` call
    /// records them.
    pub fn allocate(&mut self) -> u32 {
        if let Some(slot_index) = self.free_list.pop() {
            let slot = &mut self.slots[slot_index as usize];
            slot.generation = slot.generation.wrapping_add(1);
            slot.active = true;
            slot.entity_id = None;
            slot.body = None;
            slot.colliders.clear();
            slot.has_sensor_collider = false;
            self.active_count += 1;
            return slot_index;
        }

        if self.slots.len() >= u32::MAX as usize - 1 {
            return INVALID_SLOT;
        }

        let slot_index = self.slots.len() as u32;
        self.slots.push(Slot {
            generation: 0,
            active: true,
            entity_id: None,
            body: None,
            colliders: Vec::new(),
            has_sensor_collider: false,
        });
        self.active_count += 1;
        slot_index
    }

    /// Marks a slot inactive and pushes it onto the free list. Caller is
    /// responsible for actually removing the Shipyard entity / Rapier body
    /// from their respective storages.
    pub fn release(&mut self, slot: u32) -> Option<Slot> {
        let s = self.slots.get_mut(slot as usize)?;
        if !s.active {
            return None;
        }

        s.active = false;
        let snapshot = s.clone();
        s.entity_id = None;
        s.body = None;
        s.colliders.clear();
        s.has_sensor_collider = false;
        self.free_list.push(slot);
        self.active_count = self.active_count.saturating_sub(1);
        Some(snapshot)
    }

    pub fn get(&self, slot: u32) -> Option<&Slot> {
        let s = self.slots.get(slot as usize)?;
        if s.active { Some(s) } else { None }
    }

    pub fn get_mut(&mut self, slot: u32) -> Option<&mut Slot> {
        let s = self.slots.get_mut(slot as usize)?;
        if s.active { Some(s) } else { None }
    }

    pub fn capacity(&self) -> usize {
        self.slots.len()
    }

    pub fn active_count(&self) -> u32 {
        self.active_count
    }

    pub fn iter_active(&self) -> impl Iterator<Item = (u32, &Slot)> + '_ {
        self.slots
            .iter()
            .enumerate()
            .filter_map(|(i, s)| s.active.then_some((i as u32, s)))
    }
}
