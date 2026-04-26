//! Components for the 3D platformer behavior.
//!
//! These mirror the TypeScript `platformer-3d` components in
//! `packages/game-lib/src/lib/behaviors/platformer-3d/components.ts` but live
//! on the wasm runtime side and operate on `Body3DSlot` poses driven by
//! Rapier's `KinematicCharacterController`.

/// Tunable platformer movement parameters.
///
/// Defaults are intentionally identical to the TypeScript
/// `createPlatformer3DMovementComponent` factory so behavior stays consistent
/// when host code switches from the TS implementation to the wasm one.
#[derive(Clone, Copy, Debug)]
pub struct Platformer3DConfig {
    pub walk_speed: f32,
    pub run_speed: f32,
    pub jump_force: f32,
    pub max_jumps: u32,
    /// Magnitude of downward gravity applied to `linvel.y` when airborne.
    /// Stored as a positive number; the sign is applied internally.
    pub gravity: f32,
    pub coyote_time: f32,
    pub jump_buffer_time: f32,
    pub jump_cut_multiplier: f32,
    pub multi_jump_window: f32,
    /// Maximum slope angle (in degrees) the controller can climb. Forwarded
    /// to KCC's `max_slope_climb_angle` at bootstrap.
    pub max_slope_deg: f32,
    /// Auto-step height (world units). 0 disables stairs/curb climbing.
    pub autostep_height: f32,
    /// Snap-to-ground length (world units). 0 disables ground snapping.
    pub snap_to_ground: f32,
}

impl Default for Platformer3DConfig {
    fn default() -> Self {
        Self {
            walk_speed: 12.0,
            run_speed: 24.0,
            jump_force: 12.0,
            max_jumps: 1,
            gravity: 9.82,
            coyote_time: 0.1,
            jump_buffer_time: 0.1,
            jump_cut_multiplier: 0.5,
            multi_jump_window: 0.15,
            max_slope_deg: 50.0,
            autostep_height: 0.3,
            snap_to_ground: 0.2,
        }
    }
}

/// Per-frame platformer intent. Written by host code each tick before `step`.
#[derive(Clone, Copy, Debug, Default)]
pub struct Platformer3DInput {
    pub move_x: f32,
    pub move_z: f32,
    pub jump: bool,
    pub run: bool,
}

/// Runtime state tracking jump FSM, coyote/buffer windows, and grounded
/// timing. Mirrors the TypeScript `Platformer3DStateComponent` shape.
#[derive(Clone, Copy, Debug)]
pub struct Platformer3DState {
    pub grounded: bool,
    pub jumping: bool,
    pub falling: bool,
    pub jump_count: u32,
    pub jump_pressed_last_frame: bool,
    pub jump_held: bool,
    /// Must release jump button before each multi-jump.
    pub jump_released_since_last_jump: bool,
    pub jump_buffered: bool,
    pub jump_buffer_timer: f32,
    pub jump_cut_applied: bool,
    /// Remaining seconds of jump-cut velocity ramp (lerps `vy` toward
    /// `vy * jump_cut_multiplier` to avoid a single-frame discontinuity).
    pub jump_cut_ramp_timer: f32,
    pub time_since_grounded: f32,
    pub time_since_jump: f32,
    /// Set true on the frame a jump impulse is applied. Suppresses gravity
    /// for exactly that frame so the jump impulse is the authoritative `vy`.
    pub jumped_this_frame: bool,
    pub current_speed: f32,
    pub last_grounded_y: f32,
}

impl Default for Platformer3DState {
    fn default() -> Self {
        Self {
            grounded: false,
            jumping: false,
            falling: false,
            jump_count: 0,
            jump_pressed_last_frame: false,
            jump_held: false,
            jump_released_since_last_jump: true,
            jump_buffered: false,
            jump_buffer_timer: 0.0,
            jump_cut_applied: false,
            jump_cut_ramp_timer: 0.0,
            time_since_grounded: 0.0,
            time_since_jump: 0.0,
            jumped_this_frame: false,
            current_speed: 0.0,
            last_grounded_y: 0.0,
        }
    }
}

/// Duration of the jump-cut velocity ramp. Lifted directly from
/// `JUMP_CUT_RAMP_DURATION` in the TS implementation so behavior matches.
pub const JUMP_CUT_RAMP_DURATION: f32 = 0.05;
