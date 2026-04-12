#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Body2DKind {
    None,
    DynamicCircle,
    KinematicAabb,
}

impl Default for Body2DKind {
    fn default() -> Self {
        Self::None
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct DynamicCircleBody2DConfig {
    pub radius: f32,
    pub initial_velocity: [f32; 2],
    pub min_speed: f32,
    pub max_speed: f32,
    pub speed_multiplier: f32,
    pub max_angle_deg: f32,
    pub reflection_mode: u8,
    /// When true, the top/bottom world bounds can reflect this body.
    pub uses_boundary_2d: bool,
    /// When true, this body participates in 2D ricochet against kinematic AABBs.
    pub uses_ricochet_2d: bool,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct KinematicAabbBody2DConfig {
    pub input_channel: usize,
    pub speed: f32,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct PendingBody2DSlot {
    pub dynamic_circle: Option<DynamicCircleBody2DConfig>,
    pub kinematic_aabb: Option<KinematicAabbBody2DConfig>,
    pub uses_boundary_2d: bool,
    pub uses_ricochet_2d: bool,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct Body2DSlot {
    pub kind: Body2DKind,
    pub position: [f32; 3],
    pub velocity: [f32; 2],
    pub half_extents: [f32; 2],
    pub radius: f32,
    pub input_channel: usize,
    pub speed: f32,
    pub min_speed: f32,
    pub max_speed: f32,
    pub speed_multiplier: f32,
    pub max_angle_deg: f32,
    pub reflection_mode: u8,
    pub uses_boundary_2d: bool,
    pub uses_ricochet_2d: bool,
}
