use shipyard::Component;

pub const INPUT_STRIDE: usize = 9;
pub const RENDER_STRIDE: usize = 12;
pub const SUMMARY_LEN: usize = 6;
pub const EVENT_STRIDE: usize = 4;
pub const DEFAULT_INSTANCING_GRAVITY_Y: f32 = -9.81;

#[derive(Component, Clone, Copy, Default)]
pub(crate) struct Transform {
    pub position: [f32; 3],
    pub rotation: [f32; 4],
}

#[derive(Component, Clone, Copy, Default)]
pub(crate) struct Motion {
    pub speed: f32,
}

#[derive(Component, Clone, Copy, Default)]
pub(crate) struct CollisionState {
    pub contacts: u32,
    pub heat: f32,
    pub lifetime_contacts: u32,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct StaticBoxCollider {
    pub center: [f32; 3],
    pub half_extents: [f32; 3],
    pub friction: f32,
    pub restitution: f32,
}

/// Static heightfield collider mirroring a TS playground plane. Heights are
/// laid out outer-x / inner-z (TS convention from `PlaneMeshBuilder.postBuild`),
/// i.e. `heights[x_idx * (cols + 1) + z_idx]`. The collider conversion in
/// `Gameplay3DState::from_pending` repacks them to rapier3d's column-major
/// `Array2` (`row → z`, `col → x`).
///
/// `rows` and `cols` are *subdivisions* not vertex counts; the heights vec
/// must have exactly `(rows + 1) * (cols + 1)` entries. `scale.0` and
/// `scale.2` are the full tile width and depth; `scale.1` is the multiplier
/// applied to height values.
#[derive(Clone, Debug, Default)]
pub struct StaticHeightfieldCollider {
    pub rows: u32,
    pub cols: u32,
    pub heights: Vec<f32>,
    pub scale: [f32; 3],
    pub translation: [f32; 3],
    pub friction: f32,
    pub restitution: f32,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct Bounds2D {
    pub left: f32,
    pub right: f32,
    pub bottom: f32,
    pub top: f32,
}

/// Axis-aligned 2D trigger volume in the gameplay2d plane (XY). Host assigns `trigger_id`; wasm only reports overlap.
#[derive(Clone, Copy, Debug)]
pub struct Gameplay2dTriggerAabb {
    pub trigger_id: u32,
    pub position: [f32; 3],
    pub half_extents: [f32; 2],
}
