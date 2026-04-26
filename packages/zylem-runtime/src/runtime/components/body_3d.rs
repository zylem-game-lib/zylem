//! Body slot data for the 3D gameplay mode.
//!
//! Mirrors the `body_2d` module but for capsule-based kinematic 3D character
//! bodies. The capsule body is used by the `platformer_3d` behavior together
//! with Rapier's `KinematicCharacterController`.

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Body3DKind {
    None,
    /// Capsule body whose pose is moved by `KinematicCharacterController`.
    KinematicCapsule,
}

impl Default for Body3DKind {
    fn default() -> Self {
        Self::None
    }
}

/// Capsule shape configuration for a kinematic character body.
#[derive(Clone, Copy, Debug, Default)]
pub struct KinematicCapsuleBody3DConfig {
    /// Half height of the capsule's cylindrical segment (excluding hemispheres).
    pub half_height: f32,
    /// Radius of the capsule.
    pub radius: f32,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct PendingBody3DSlot {
    pub kinematic_capsule: Option<KinematicCapsuleBody3DConfig>,
}

#[derive(Clone, Copy, Debug, Default)]
pub struct Body3DSlot {
    pub kind: Body3DKind,
    pub position: [f32; 3],
    pub rotation: [f32; 4],
    /// Linear velocity that the platformer behavior writes each step;
    /// integrated as `desired_translation = linvel * dt` and then handed to
    /// `KinematicCharacterController::move_shape`.
    pub linvel: [f32; 3],
    pub half_height: f32,
    pub radius: f32,
    /// Last reported `EffectiveCharacterMovement.grounded` from KCC.
    pub grounded: bool,
}

impl Body3DSlot {
    pub fn capsule_kinematic(position: [f32; 3], half_height: f32, radius: f32) -> Self {
        Self {
            kind: Body3DKind::KinematicCapsule,
            position,
            rotation: [0.0, 0.0, 0.0, 1.0],
            linvel: [0.0; 3],
            half_height: half_height.max(0.01),
            radius: radius.max(0.01),
            grounded: false,
        }
    }
}
