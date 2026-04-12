pub const EVENT_STRIDE: usize = crate::runtime::common::EVENT_STRIDE;

#[repr(u32)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RuntimeEventType {
    BoundaryBounce = 1,
    ColliderBounce = 2,
    /// Dynamic circle entered a trigger AABB (edge-triggered). Payload: primary = circle slot, secondary = trigger_id, aux = trigger list index.
    RegionEntered = 3,
}
