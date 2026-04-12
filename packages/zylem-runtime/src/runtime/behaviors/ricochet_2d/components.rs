#[derive(Clone, Copy, Debug, Default)]
pub struct Ricochet2DConfig {
    pub min_speed: f32,
    pub max_speed: f32,
    pub speed_multiplier: f32,
    pub max_angle_deg: f32,
    pub reflection_mode: u8,
}
