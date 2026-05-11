//! Render-buffer layout for `StageSimulation`.
//!
//! The host (`WasmStageRuntime`) reads one slot of this buffer per entity
//! each frame and writes the result into Three.js mesh transforms. Layout
//! is intentionally fixed-stride to keep the read loop a tight memcpy.
//!
//! ```text
//! per slot (12 floats):
//!   [0..3]   position xyz
//!   [3..7]   rotation quaternion xyzw
//!   [7]      uniform scale
//!   [8..12]  custom0..custom3 (per-behavior shading hints, e.g.
//!            heat / contacts / speed / FSM-state-as-float)
//! ```
//!
//! The render buffer is contiguous and indexed by raw slot id, including
//! freed slots (whose values are zeroed). The summary header is reserved
//! for stage-wide statistics if the host wants them in the future, but the
//! unified-Stage path doesn't currently emit a separate summary.

pub const STAGE_RENDER_STRIDE: usize = 12;

#[derive(Clone, Copy, Debug, Default)]
pub struct RenderSlot {
    pub position: [f32; 3],
    pub rotation: [f32; 4],
    pub scale: f32,
    pub custom: [f32; 4],
}

impl RenderSlot {
    pub fn write_into(self, dst: &mut [f32]) {
        debug_assert!(dst.len() >= STAGE_RENDER_STRIDE);
        dst[0] = self.position[0];
        dst[1] = self.position[1];
        dst[2] = self.position[2];
        dst[3] = self.rotation[0];
        dst[4] = self.rotation[1];
        dst[5] = self.rotation[2];
        dst[6] = self.rotation[3];
        dst[7] = self.scale;
        dst[8] = self.custom[0];
        dst[9] = self.custom[1];
        dst[10] = self.custom[2];
        dst[11] = self.custom[3];
    }
}
