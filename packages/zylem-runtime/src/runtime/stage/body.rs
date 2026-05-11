//! Plain configuration types describing the body / collider shapes the
//! host wants the wasm runtime to materialize. These mirror the TS-side
//! `runtime-collision-builder.ts` payloads so callers never touch a Rapier
//! `RigidBodyDesc` / `ColliderDesc` directly.

use rapier3d::math::{Rotation, Vec3};
use rapier3d::prelude::*;

/// How a body integrates with the Rapier world. Mirrors the TS-side
/// `RuntimeBodyKind`.
#[repr(u32)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RuntimeBodyKind {
    Dynamic = 0,
    Static = 1,
    KinematicPosition = 2,
    KinematicVelocity = 3,
}

impl RuntimeBodyKind {
    pub fn from_u32(value: u32) -> Self {
        match value {
            1 => Self::Static,
            2 => Self::KinematicPosition,
            3 => Self::KinematicVelocity,
            _ => Self::Dynamic,
        }
    }

    pub fn to_rigid_body_type(self) -> RigidBodyType {
        match self {
            Self::Dynamic => RigidBodyType::Dynamic,
            Self::Static => RigidBodyType::Fixed,
            Self::KinematicPosition => RigidBodyType::KinematicPositionBased,
            Self::KinematicVelocity => RigidBodyType::KinematicVelocityBased,
        }
    }
}

/// Plain body configuration shipped from TS at attach time.
#[derive(Clone, Copy, Debug)]
pub struct BodyConfig {
    pub kind: RuntimeBodyKind,
    pub position: [f32; 3],
    pub rotation: [f32; 4],
    pub linear_damping: f32,
    pub angular_damping: f32,
    pub gravity_scale: f32,
    pub can_sleep: bool,
    pub ccd_enabled: bool,
    pub lock_rotation: [bool; 3],
    pub lock_translation: [bool; 3],
}

impl Default for BodyConfig {
    fn default() -> Self {
        Self {
            kind: RuntimeBodyKind::Dynamic,
            position: [0.0; 3],
            rotation: [0.0, 0.0, 0.0, 1.0],
            linear_damping: 0.0,
            angular_damping: 0.0,
            gravity_scale: 1.0,
            can_sleep: false,
            ccd_enabled: true,
            lock_rotation: [false; 3],
            lock_translation: [false; 3],
        }
    }
}

impl BodyConfig {
    pub fn build(self) -> RigidBody {
        let q = Rotation::from_xyzw(
            self.rotation[0],
            self.rotation[1],
            self.rotation[2],
            self.rotation[3],
        )
        .normalize();
        let scaled_axis = q.to_scaled_axis();

        let mut builder = RigidBodyBuilder::new(self.kind.to_rigid_body_type())
            .translation(Vec3::new(
                self.position[0],
                self.position[1],
                self.position[2],
            ))
            .rotation(scaled_axis)
            .linear_damping(self.linear_damping.max(0.0))
            .angular_damping(self.angular_damping.max(0.0))
            .gravity_scale(self.gravity_scale)
            .can_sleep(self.can_sleep)
            .ccd_enabled(self.ccd_enabled);

        if self.lock_rotation[0] || self.lock_rotation[1] || self.lock_rotation[2] {
            builder = builder.enabled_rotations(
                !self.lock_rotation[0],
                !self.lock_rotation[1],
                !self.lock_rotation[2],
            );
        }

        if self.lock_translation[0] || self.lock_translation[1] || self.lock_translation[2] {
            builder = builder.enabled_translations(
                !self.lock_translation[0],
                !self.lock_translation[1],
                !self.lock_translation[2],
            );
        }

        builder.build()
    }
}

/// Collider shapes the runtime can build directly from primitive parameters.
/// Mesh-based shapes (convex hull, trimesh) consume their vertex / index data
/// from the simulation's shared scratch buffer.
#[derive(Clone, Copy, Debug)]
pub enum ColliderShape {
    Box {
        half_extents: [f32; 3],
    },
    Sphere {
        radius: f32,
    },
    Capsule {
        half_height: f32,
        radius: f32,
    },
    Cylinder {
        half_height: f32,
        radius: f32,
    },
    /// Vertices read from `scratch[vertex_offset..vertex_offset + vertex_count*3]`.
    ConvexHull {
        vertex_offset: u32,
        vertex_count: u32,
    },
    /// Vertices read from `scratch[vertex_offset..vertex_offset + vertex_count*3]`,
    /// indices read from `scratch[index_offset..index_offset + index_count]`
    /// (each index stored as a `f32` truncated to `u32`).
    Trimesh {
        vertex_offset: u32,
        vertex_count: u32,
        index_offset: u32,
        index_count: u32,
    },
    /// Heightfield: `(rows + 1) * (cols + 1)` height samples laid out
    /// outer-x / inner-z (matches TS `PlaneMeshBuilder.postBuild`).
    Heightfield {
        rows: u32,
        cols: u32,
        scale: [f32; 3],
        height_offset: u32,
    },
}

#[derive(Clone, Copy, Debug)]
pub struct ColliderConfig {
    pub shape: ColliderShape,
    pub offset: [f32; 3],
    pub friction: f32,
    pub restitution: f32,
    pub sensor: bool,
    /// Packed collision groups, matches Rapier's interaction-group format
    /// (high 16 bits = membership, low 16 bits = filter).
    pub collision_groups: u32,
}

impl ColliderConfig {
    pub fn new(shape: ColliderShape) -> Self {
        Self {
            shape,
            offset: [0.0; 3],
            friction: 0.5,
            restitution: 0.0,
            sensor: false,
            collision_groups: 0xFFFF_FFFF,
        }
    }
}

/// Build a Rapier collider from a plain config + scratch buffer (used for
/// convex hulls / trimeshes / heightfields).
pub fn build_collider(config: ColliderConfig, scratch: &[f32]) -> Option<Collider> {
    let mut builder = match config.shape {
        ColliderShape::Box { half_extents } => Some(ColliderBuilder::cuboid(
            half_extents[0].max(0.001),
            half_extents[1].max(0.001),
            half_extents[2].max(0.001),
        )),
        ColliderShape::Sphere { radius } => Some(ColliderBuilder::ball(radius.max(0.001))),
        ColliderShape::Capsule {
            half_height,
            radius,
        } => Some(ColliderBuilder::capsule_y(
            half_height.max(0.001),
            radius.max(0.001),
        )),
        ColliderShape::Cylinder {
            half_height,
            radius,
        } => Some(ColliderBuilder::cylinder(
            half_height.max(0.001),
            radius.max(0.001),
        )),
        ColliderShape::ConvexHull {
            vertex_offset,
            vertex_count,
        } => {
            let start = vertex_offset as usize;
            let end = start + vertex_count as usize * 3;
            if end > scratch.len() || vertex_count < 4 {
                None
            } else {
                let points: Vec<Vec3> = scratch[start..end]
                    .chunks_exact(3)
                    .map(|chunk| Vec3::new(chunk[0], chunk[1], chunk[2]))
                    .collect();
                ColliderBuilder::convex_hull(&points)
            }
        }
        ColliderShape::Trimesh {
            vertex_offset,
            vertex_count,
            index_offset,
            index_count,
        } => {
            let v_start = vertex_offset as usize;
            let v_end = v_start + vertex_count as usize * 3;
            let i_start = index_offset as usize;
            let i_end = i_start + index_count as usize;
            if v_end > scratch.len()
                || i_end > scratch.len()
                || index_count % 3 != 0
                || vertex_count == 0
            {
                None
            } else {
                let vertices: Vec<Vec3> = scratch[v_start..v_end]
                    .chunks_exact(3)
                    .map(|c| Vec3::new(c[0], c[1], c[2]))
                    .collect();
                let indices: Vec<[u32; 3]> = scratch[i_start..i_end]
                    .chunks_exact(3)
                    .map(|c| [c[0] as u32, c[1] as u32, c[2] as u32])
                    .collect();
                ColliderBuilder::trimesh(vertices, indices).ok()
            }
        }
        ColliderShape::Heightfield {
            rows,
            cols,
            scale,
            height_offset,
        } => {
            let count = (rows as usize + 1) * (cols as usize + 1);
            let start = height_offset as usize;
            let end = start + count;
            if end > scratch.len() || rows == 0 || cols == 0 {
                None
            } else {
                let nrows = (cols + 1) as usize;
                let ncols = (rows + 1) as usize;
                let data: Vec<f32> = scratch[start..end].to_vec();
                let array = Array2::new(nrows, ncols, data);
                Some(ColliderBuilder::heightfield(
                    array,
                    Vec3::new(scale[0], scale[1], scale[2]),
                ))
            }
        }
    }?;

    builder = builder
        .friction(config.friction.max(0.0))
        .restitution(config.restitution.max(0.0))
        .sensor(config.sensor)
        .collision_groups(InteractionGroups::new(
            Group::from_bits_truncate((config.collision_groups >> 16) & 0xFFFF),
            Group::from_bits_truncate(config.collision_groups & 0xFFFF),
            InteractionTestMode::And,
        ))
        .translation(Vec3::new(config.offset[0], config.offset[1], config.offset[2]))
        .active_events(ActiveEvents::COLLISION_EVENTS);

    Some(builder.build())
}
