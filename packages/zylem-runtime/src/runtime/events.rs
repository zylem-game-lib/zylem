pub const EVENT_STRIDE: usize = crate::runtime::common::EVENT_STRIDE;

#[repr(u32)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RuntimeEventType {
    BoundaryBounce = 1,
    ColliderBounce = 2,
    /// Dynamic circle entered a trigger AABB (edge-triggered). Payload: primary = circle slot, secondary = trigger_id, aux = trigger list index.
    RegionEntered = 3,
    /// Platformer 3D jump impulse applied. Payload: primary = slot, secondary = jump_count after this jump, aux = 0.
    JumpStarted = 4,
    /// Platformer 3D landed (grounded edge: !was_grounded -> grounded). Payload: primary = slot, secondary = 0, aux = 0.
    Landed = 5,
}
