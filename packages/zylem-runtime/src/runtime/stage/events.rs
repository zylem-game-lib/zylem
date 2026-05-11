//! Typed event buffer published by `StageSimulation` each frame.
//!
//! Replaces the legacy per-mode event buffers (`Gameplay2DState::event_buffer`,
//! `Gameplay3DState::event_buffer`). The host (`WasmStageRuntime`) drains this
//! buffer once per frame and routes events to behavior handles, coordinators,
//! and `entity.onCollision` callbacks.
//!
//! Each event packs into 6 floats so the host can read it without a JSON
//! decode hop:
//! ```text
//!   [0] type     (StageEventType as f32)
//!   [1] primary slot id (u32 as f32) or NaN if not slot-bound
//!   [2] secondary slot id (u32 as f32) or NaN
//!   [3..6] payload[0..3] (event-specific floats)
//! ```

pub const STAGE_EVENT_STRIDE: usize = 6;
pub const STAGE_EVENT_BUFFER_CAPACITY: usize = 4096;

#[repr(u32)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum StageEventType {
    /// Two colliders started overlapping (contact pair). Payload[0] = 1 if
    /// either side is a sensor, payload[1..3] = approximate contact normal
    /// (best-effort; zero-vector if not available).
    CollisionStarted = 1,
    /// Two colliders stopped overlapping.
    CollisionStopped = 2,
    /// Boundary FSM detected an axis hit. Payload[0] = axis bitmask
    /// (1 = x, 2 = y, 4 = z), payload[1] = sign mask (1 = max edge,
    /// 0 = min edge).
    BoundaryHit = 3,
    /// Ball-style ricochet bounce. Payload[0] = `RicochetKind` discriminant
    /// (0 = wall, 1 = collider).
    Ricochet = 4,
    /// Trigger-region entered (edge-triggered). Payload[0] = trigger id.
    RegionEntered = 5,
    /// Platformer-style jump impulse applied. Payload[0] = jump count after
    /// this jump.
    JumpStarted = 6,
    /// Grounded edge: !was_grounded -> grounded.
    Landed = 7,
    /// Screen-wrap fired. Payload[0] = bitmask of axes wrapped (1 = x, 2 = y).
    Wrapped = 8,
    /// Cooldown fired (debug / observability). Payload[0] = cooldown id.
    CooldownFired = 9,
}

impl StageEventType {
    pub fn as_f32(self) -> f32 {
        self as u32 as f32
    }
}

#[derive(Clone, Copy, Debug)]
pub struct StageEvent {
    pub event_type: StageEventType,
    pub primary_slot: Option<u32>,
    pub secondary_slot: Option<u32>,
    pub payload: [f32; 3],
}

impl StageEvent {
    pub fn new(event_type: StageEventType) -> Self {
        Self {
            event_type,
            primary_slot: None,
            secondary_slot: None,
            payload: [0.0; 3],
        }
    }

    pub fn with_primary(mut self, slot: u32) -> Self {
        self.primary_slot = Some(slot);
        self
    }

    pub fn with_secondary(mut self, slot: u32) -> Self {
        self.secondary_slot = Some(slot);
        self
    }

    pub fn with_payload(mut self, payload: [f32; 3]) -> Self {
        self.payload = payload;
        self
    }

    pub fn write_into(self, dst: &mut [f32]) {
        debug_assert!(dst.len() >= STAGE_EVENT_STRIDE);
        dst[0] = self.event_type.as_f32();
        dst[1] = self
            .primary_slot
            .map(|s| s as f32)
            .unwrap_or(f32::NAN);
        dst[2] = self
            .secondary_slot
            .map(|s| s as f32)
            .unwrap_or(f32::NAN);
        dst[3] = self.payload[0];
        dst[4] = self.payload[1];
        dst[5] = self.payload[2];
    }
}

#[derive(Default)]
pub struct EventBuffer {
    events: Vec<StageEvent>,
    /// Float-backed view exposed via FFI; rebuilt each `flush()`.
    buffer: Vec<f32>,
}

impl EventBuffer {
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            events: Vec::with_capacity(capacity),
            buffer: vec![0.0; capacity * STAGE_EVENT_STRIDE],
        }
    }

    pub fn push(&mut self, event: StageEvent) {
        if self.events.len() >= STAGE_EVENT_BUFFER_CAPACITY {
            return;
        }
        self.events.push(event);
    }

    pub fn clear(&mut self) {
        self.events.clear();
    }

    pub fn count(&self) -> usize {
        self.events.len()
    }

    pub fn buffer_ptr(&self) -> *const f32 {
        self.buffer.as_ptr()
    }

    pub fn buffer_len(&self) -> usize {
        self.events.len() * STAGE_EVENT_STRIDE
    }

    /// Materialize the event list into the float buffer. Call before any
    /// host-visible read.
    pub fn flush(&mut self) {
        let capacity_floats = self.buffer.len();
        let needed = self.events.len() * STAGE_EVENT_STRIDE;
        if needed > capacity_floats {
            self.buffer.resize(needed, 0.0);
        }
        for (i, event) in self.events.iter().enumerate() {
            let base = i * STAGE_EVENT_STRIDE;
            event.write_into(&mut self.buffer[base..base + STAGE_EVENT_STRIDE]);
        }
    }
}
