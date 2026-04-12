//! Shipyard-backed simulation with batched float buffers for host ↔ wasm exchange.

use rapier3d::prelude::*;
use shipyard::{EntityId, View, ViewMut, World};

#[path = "runtime/behaviors/mod.rs"]
mod behaviors;
#[path = "runtime/components/mod.rs"]
mod components;
#[allow(dead_code)]
#[path = "runtime/common.rs"]
mod common;
#[allow(dead_code)]
#[path = "runtime/events.rs"]
mod events;
#[path = "runtime/modes/mod.rs"]
mod modes;

use components::body_2d::{Body2DKind, PendingBody2DSlot};
use modes::gameplay_2d::Gameplay2DState;
pub use components::body_2d::{DynamicCircleBody2DConfig, KinematicAabbBody2DConfig};
pub use common::{Bounds2D, StaticBoxCollider, DEFAULT_INSTANCING_GRAVITY_Y, EVENT_STRIDE, INPUT_STRIDE, RENDER_STRIDE, SUMMARY_LEN};
use common::{CollisionState, Gameplay2dTriggerAabb, Motion, Transform};

enum SimulationMode {
    BufferDriven,
    Instancing(InstancingState),
    Gameplay2D(Gameplay2DState),
}

struct InstancingState {
    gravity: Vector,
    integration_parameters: IntegrationParameters,
    physics_pipeline: PhysicsPipeline,
    island_manager: IslandManager,
    broad_phase: BroadPhaseBvh,
    narrow_phase: NarrowPhase,
    bodies: RigidBodySet,
    colliders: ColliderSet,
    impulse_joints: ImpulseJointSet,
    multibody_joints: MultibodyJointSet,
    ccd_solver: CCDSolver,
    body_handles: Vec<RigidBodyHandle>,
    collider_handles: Vec<ColliderHandle>,
}

impl InstancingState {
    fn new_from_positions(
        positions: &[[f32; 3]],
        half_extents: [f32; 3],
        static_colliders: &[StaticBoxCollider],
    ) -> Self {
        let count = positions.len();
        let mut bodies = RigidBodySet::new();
        let mut colliders = ColliderSet::new();
        let mut body_handles = Vec::with_capacity(count);
        let mut collider_handles = Vec::with_capacity(count);

        for collider in static_colliders {
            colliders.insert(
                ColliderBuilder::cuboid(
                    collider.half_extents[0],
                    collider.half_extents[1],
                    collider.half_extents[2],
                )
                .translation(
                    vector![collider.center[0], collider.center[1], collider.center[2]].into(),
                )
                .friction(collider.friction)
                .restitution(collider.restitution)
                .build(),
            );
        }

        for position in positions {
            let body = RigidBodyBuilder::dynamic()
                .translation(vector![position[0], position[1], position[2]].into())
                .linear_damping(0.05)
                .angular_damping(0.02)
                .can_sleep(false)
                .build();
            let body_handle = bodies.insert(body);
            let collider = ColliderBuilder::cuboid(half_extents[0], half_extents[1], half_extents[2])
                .friction(0.82)
                .restitution(0.08)
                .build();
            let collider_handle = colliders.insert_with_parent(collider, body_handle, &mut bodies);
            body_handles.push(body_handle);
            collider_handles.push(collider_handle);
        }

        let mut integration_parameters = IntegrationParameters::default();
        integration_parameters.dt = 1.0 / 60.0;

        Self {
            gravity: vector![0.0, DEFAULT_INSTANCING_GRAVITY_Y, 0.0].into(),
            integration_parameters,
            physics_pipeline: PhysicsPipeline::new(),
            island_manager: IslandManager::new(),
            broad_phase: BroadPhaseBvh::new(),
            narrow_phase: NarrowPhase::new(),
            bodies,
            colliders,
            impulse_joints: ImpulseJointSet::new(),
            multibody_joints: MultibodyJointSet::new(),
            ccd_solver: CCDSolver::new(),
            body_handles,
            collider_handles,
        }
    }

    fn step(&mut self, dt: f32) {
        if dt > 0.0 {
            self.integration_parameters.dt = dt.max(1.0 / 240.0);
        }

        self.physics_pipeline.step(
            self.gravity,
            &self.integration_parameters,
            &mut self.island_manager,
            &mut self.broad_phase,
            &mut self.narrow_phase,
            &mut self.bodies,
            &mut self.colliders,
            &mut self.impulse_joints,
            &mut self.multibody_joints,
            &mut self.ccd_solver,
            &(),
            &(),
        );
    }

    fn contact_count(&self, collider: ColliderHandle) -> u32 {
        self.narrow_phase
            .contact_pairs_with(collider)
            .filter(|pair| pair.has_any_active_contact())
            .count() as u32
    }
}

/// Fixed-capacity ECS simulation. It can either consume host-provided buffers or own
/// a small Rapier-backed instancing simulation for example demos.
pub struct Simulation {
    pub(crate) world: World,
    pub(crate) entity_order: Vec<EntityId>,
    pub(crate) active_count: usize,
    pub(crate) input_buffer: Vec<f32>,
    pub(crate) render_buffer: Vec<f32>,
    pub(crate) summary_buffer: Vec<f32>,
    pub(crate) tick_count: u32,
    pending_static_colliders: Vec<StaticBoxCollider>,
    pending_gameplay2d_bounds: Option<Bounds2D>,
    pending_gameplay2d_slots: Vec<PendingBody2DSlot>,
    pending_gameplay2d_triggers: Vec<Gameplay2dTriggerAabb>,
    mode: SimulationMode,
}

impl Simulation {
    pub fn new(capacity: usize, initial_active: usize) -> Option<Self> {
        Self::with_mode(capacity, initial_active, SimulationMode::BufferDriven)
    }

    fn with_mode(capacity: usize, initial_active: usize, mode: SimulationMode) -> Option<Self> {
        if capacity == 0 {
            return None;
        }

        let mut world = World::new();
        let entity_order = world
            .bulk_add_entity((0..capacity).map(|_index| {
                (
                    Transform::default(),
                    Motion::default(),
                    CollisionState::default(),
                )
            }))
            .collect();

        Some(Self {
            world,
            entity_order,
            active_count: initial_active.min(capacity),
            input_buffer: vec![0.0; capacity * INPUT_STRIDE],
            render_buffer: vec![0.0; capacity * RENDER_STRIDE],
            summary_buffer: vec![0.0; SUMMARY_LEN],
            tick_count: 0,
            pending_static_colliders: Vec::new(),
            pending_gameplay2d_bounds: None,
            pending_gameplay2d_slots: vec![PendingBody2DSlot::default(); capacity],
            pending_gameplay2d_triggers: Vec::new(),
            mode,
        })
    }

    pub fn step(&mut self, dt: f32) {
        let dt = dt.max(0.0);
        let world = &mut self.world;
        let entity_order = &self.entity_order;
        let active_count = self.active_count;
        let input_buffer = &mut self.input_buffer;

        match &mut self.mode {
            SimulationMode::BufferDriven => {
                Self::sync_input(world, entity_order, active_count, input_buffer);
            }
            SimulationMode::Instancing(state) => {
                state.step(dt);
                Self::sync_instancing(world, entity_order, active_count, input_buffer, state);
            }
            SimulationMode::Gameplay2D(state) => {
                state.step(dt);
                Self::sync_pong(world, entity_order, active_count, input_buffer, state);
            }
        }

        self.update_collision_state(dt);
        self.build_render_buffer();
        self.tick_count = self.tick_count.saturating_add(1);
    }

    pub fn bootstrap_instancing_from_input(&mut self, half_extents: [f32; 3]) -> usize {
        if !matches!(self.mode, SimulationMode::BufferDriven) {
            return self.active_count;
        }
        if self.active_count == 0 || self.input_buffer.len() < INPUT_STRIDE {
            return 0;
        }

        let mut positions = Vec::with_capacity(self.active_count);
        for index in 0..self.active_count {
            let base = index * INPUT_STRIDE;
            positions.push([
                self.input_buffer[base],
                self.input_buffer[base + 1],
                self.input_buffer[base + 2],
            ]);
        }

        self.mode = SimulationMode::Instancing(InstancingState::new_from_positions(
            &positions,
            [
                half_extents[0].max(0.01),
                half_extents[1].max(0.01),
                half_extents[2].max(0.01),
            ],
            &self.pending_static_colliders,
        ));
        self.active_count
    }

    pub fn clear_static_box_colliders(&mut self) {
        self.pending_static_colliders.clear();
    }

    pub fn add_static_box_collider(&mut self, collider: StaticBoxCollider) {
        self.pending_static_colliders.push(collider);
    }

    pub fn clear_gameplay2d_config(&mut self) {
        self.pending_gameplay2d_bounds = None;
        self.pending_gameplay2d_slots.fill(PendingBody2DSlot::default());
        self.pending_gameplay2d_triggers.clear();
    }

    pub fn set_gameplay2d_world_bounds(&mut self, bounds: Bounds2D) {
        self.pending_gameplay2d_bounds = Some(bounds);
    }

    pub fn configure_dynamic_circle_body2d(&mut self, slot: usize, config: DynamicCircleBody2DConfig) -> bool {
        let Some(pending) = self.pending_gameplay2d_slots.get_mut(slot) else {
            return false;
        };
        pending.uses_boundary_2d = config.uses_boundary_2d;
        pending.uses_ricochet_2d = config.uses_ricochet_2d;
        pending.dynamic_circle = Some(config);
        true
    }

    pub fn configure_kinematic_aabb_body2d(
        &mut self,
        slot: usize,
        config: KinematicAabbBody2DConfig,
        half_extents: [f32; 2],
    ) -> bool {
        let Some(pending) = self.pending_gameplay2d_slots.get_mut(slot) else {
            return false;
        };
        pending.kinematic_aabb = Some(config);
        // Store size through goal slot fields? no, via input buffer extents on bootstrap.
        let _ = half_extents;
        true
    }

    pub fn add_gameplay2d_trigger_aabb(
        &mut self,
        trigger_id: u32,
        position: [f32; 3],
        half_extents: [f32; 2],
    ) {
        self.pending_gameplay2d_triggers.push(Gameplay2dTriggerAabb {
            trigger_id,
            position,
            half_extents: [
                half_extents[0].max(0.01),
                half_extents[1].max(0.01),
            ],
        });
    }

    pub fn bootstrap_gameplay2d_from_input(&mut self) -> usize {
        if !matches!(self.mode, SimulationMode::BufferDriven) {
            return self.active_count;
        }
        if self.active_count == 0 || self.input_buffer.len() < INPUT_STRIDE {
            return 0;
        }

        let mut positions = Vec::with_capacity(self.active_count);
        for index in 0..self.active_count {
            let base = index * INPUT_STRIDE;
            positions.push([
                self.input_buffer[base],
                self.input_buffer[base + 1],
                self.input_buffer[base + 2],
            ]);

            let pending = &mut self.pending_gameplay2d_slots[index];
            let half_x = self.input_buffer[base + 7].max(0.01);
            let half_y = self.input_buffer[base + 8].max(0.01);
            if pending.dynamic_circle.is_some() {
                // balls use radius in half_x
            } else if pending.kinematic_aabb.is_some() {
                // store half extents by encoding into velocity? no-op handled in sync below by re-reading input buffer.
                let _ = (half_x, half_y);
            }
        }

        let mut gameplay = Gameplay2DState::from_pending(&positions, &self.pending_gameplay2d_slots);
        for index in 0..self.active_count {
            let base = index * INPUT_STRIDE;
            let half_x = self.input_buffer[base + 7].max(0.01);
            let half_y = self.input_buffer[base + 8].max(0.01);
            match gameplay.slots[index].kind {
                Body2DKind::DynamicCircle => {
                    gameplay.slots[index].radius = half_x;
                }
                Body2DKind::KinematicAabb => {
                    gameplay.slots[index].half_extents = [half_x, half_y];
                }
                Body2DKind::None => {}
            }
        }
        gameplay.bounds = self.pending_gameplay2d_bounds.unwrap_or(Bounds2D {
            left: -15.0,
            right: 15.0,
            bottom: -5.0,
            top: 5.0,
        });
        gameplay.set_triggers(self.pending_gameplay2d_triggers.clone());
        self.mode = SimulationMode::Gameplay2D(gameplay);
        self.active_count
    }

    pub fn set_gameplay2d_input_axis(&mut self, player_index: usize, vertical: f32) {
        if let SimulationMode::Gameplay2D(state) = &mut self.mode {
            state.set_input_axis(player_index, vertical);
        }
    }

    pub fn set_gameplay2d_slot_position(&mut self, slot: usize, x: f32, y: f32, z: f32) {
        if let SimulationMode::Gameplay2D(state) = &mut self.mode {
            if let Some(slot_ref) = state.slots.get_mut(slot) {
                slot_ref.position = [x, y, z];
            }
        }
    }

    pub fn set_gameplay2d_slot_velocity(&mut self, slot: usize, x: f32, y: f32) {
        if let SimulationMode::Gameplay2D(state) = &mut self.mode {
            if let Some(slot_ref) = state.slots.get_mut(slot) {
                slot_ref.velocity = [x, y];
            }
        }
    }

    pub fn gameplay2d_slot_position(&self, slot: usize) -> Option<[f32; 3]> {
        match &self.mode {
            SimulationMode::Gameplay2D(state) => state.slots.get(slot).map(|slot_ref| slot_ref.position),
            _ => None,
        }
    }

    pub fn gameplay2d_event_buffer(&self) -> Option<&[f32]> {
        match &self.mode {
            SimulationMode::Gameplay2D(state) => Some(&state.event_buffer),
            _ => None,
        }
    }

    pub fn gameplay2d_event_count(&self) -> usize {
        match &self.mode {
            SimulationMode::Gameplay2D(state) => state.event_count(),
            _ => 0,
        }
    }

    fn sync_input(
        world: &mut World,
        entity_order: &[EntityId],
        active_count: usize,
        input_buffer: &[f32],
    ) {
        let (mut transforms, mut motion, mut collisions) = world
            .borrow::<(ViewMut<Transform>, ViewMut<Motion>, ViewMut<CollisionState>)>()
            .expect("storages should exist");

        for (index, &entity) in entity_order[..active_count].iter().enumerate() {
            let base = index * INPUT_STRIDE;
            transforms[entity].position = [
                input_buffer[base],
                input_buffer[base + 1],
                input_buffer[base + 2],
            ];
            transforms[entity].rotation = [
                input_buffer[base + 3],
                input_buffer[base + 4],
                input_buffer[base + 5],
                input_buffer[base + 6],
            ];
            motion[entity].speed = input_buffer[base + 8];
            collisions[entity].contacts = input_buffer[base + 7].max(0.0) as u32;
        }
    }

    fn sync_instancing(
        world: &mut World,
        entity_order: &[EntityId],
        active_count: usize,
        input_buffer: &mut [f32],
        state: &InstancingState,
    ) {
        let (mut transforms, mut motion, mut collisions) = world
            .borrow::<(ViewMut<Transform>, ViewMut<Motion>, ViewMut<CollisionState>)>()
            .expect("storages should exist");

        for (index, &entity) in entity_order[..active_count].iter().enumerate() {
            let base = index * INPUT_STRIDE;
            let body_handle = state.body_handles[index];
            let collider_handle = state.collider_handles[index];
            let body = state
                .bodies
                .get(body_handle)
                .expect("instancing body should exist");
            let position = body.translation();
            let rotation = body.rotation();
            let speed = body.linvel().length();
            let contacts = state.contact_count(collider_handle);

            transforms[entity].position = [position.x, position.y, position.z];
            transforms[entity].rotation = [rotation.x, rotation.y, rotation.z, rotation.w];
            motion[entity].speed = speed;
            collisions[entity].contacts = contacts;

            input_buffer[base] = position.x;
            input_buffer[base + 1] = position.y;
            input_buffer[base + 2] = position.z;
            input_buffer[base + 3] = rotation.x;
            input_buffer[base + 4] = rotation.y;
            input_buffer[base + 5] = rotation.z;
            input_buffer[base + 6] = rotation.w;
            input_buffer[base + 7] = contacts as f32;
            input_buffer[base + 8] = speed;
        }
    }

    fn sync_pong(
        world: &mut World,
        entity_order: &[EntityId],
        active_count: usize,
        input_buffer: &mut [f32],
        state: &Gameplay2DState,
    ) {
        let (mut transforms, mut motion, mut collisions) = world
            .borrow::<(ViewMut<Transform>, ViewMut<Motion>, ViewMut<CollisionState>)>()
            .expect("storages should exist");

        for (index, &entity) in entity_order[..active_count].iter().enumerate() {
            let base = index * INPUT_STRIDE;
            let slot = &state.slots[index];
            transforms[entity].position = slot.position;
            transforms[entity].rotation = [0.0, 0.0, 0.0, 1.0];
            motion[entity].speed = (slot.velocity[0] * slot.velocity[0] + slot.velocity[1] * slot.velocity[1]).sqrt();
            collisions[entity].contacts = 0;

            input_buffer[base] = slot.position[0];
            input_buffer[base + 1] = slot.position[1];
            input_buffer[base + 2] = slot.position[2];
            input_buffer[base + 3] = 0.0;
            input_buffer[base + 4] = 0.0;
            input_buffer[base + 5] = 0.0;
            input_buffer[base + 6] = 1.0;
            input_buffer[base + 7] = 0.0;
            input_buffer[base + 8] = motion[entity].speed;
        }
    }

    fn update_collision_state(&mut self, dt: f32) {
        let (motion, mut collisions) = self
            .world
            .borrow::<(View<Motion>, ViewMut<CollisionState>)>()
            .expect("storages should exist");

        let mut colliding_entities = 0.0_f32;
        let mut total_contacts = 0.0_f32;
        let mut total_heat = 0.0_f32;
        let mut max_heat = 0.0_f32;
        let mut max_contacts = 0.0_f32;

        for &entity in &self.entity_order[..self.active_count] {
            let collision = &mut collisions[entity];
            let speed = motion[entity].speed;
            let contacts = collision.contacts as f32;

            if collision.contacts > 0 {
                colliding_entities += 1.0;
                collision.lifetime_contacts = collision
                    .lifetime_contacts
                    .saturating_add(collision.contacts);
                collision.heat = (collision.heat + dt * (0.9 + contacts * 0.16 + speed * 0.03))
                    .min(1.0);
            } else {
                collision.heat = (collision.heat - dt * (1.3 + speed * 0.02)).max(0.0);
            }

            total_contacts += contacts;
            total_heat += collision.heat;
            max_heat = max_heat.max(collision.heat);
            max_contacts = max_contacts.max(contacts);
        }

        let entity_count = self.active_count as f32;
        self.summary_buffer[0] = entity_count;
        self.summary_buffer[1] = colliding_entities;
        self.summary_buffer[2] = total_contacts;
        self.summary_buffer[3] = if entity_count > 0.0 {
            total_heat / entity_count
        } else {
            0.0
        };
        self.summary_buffer[4] = max_heat;
        self.summary_buffer[5] = max_contacts;
    }

    fn build_render_buffer(&mut self) {
        let (transforms, collisions) = self
            .world
            .borrow::<(View<Transform>, View<CollisionState>)>()
            .expect("storages should exist");

        for (index, &entity) in self.entity_order[..self.active_count].iter().enumerate() {
            let base = index * RENDER_STRIDE;
            let transform = &transforms[entity];
            let collision = &collisions[entity];

            let heat = collision.heat.clamp(0.0, 1.0);
            let scale = 1.0 + heat * 0.16 + (collision.contacts > 0) as u8 as f32 * 0.06;
            let speed = self.input_buffer[index * INPUT_STRIDE + 8];

            self.render_buffer[base] = transform.position[0];
            self.render_buffer[base + 1] = transform.position[1];
            self.render_buffer[base + 2] = transform.position[2];
            self.render_buffer[base + 3] = transform.rotation[0];
            self.render_buffer[base + 4] = transform.rotation[1];
            self.render_buffer[base + 5] = transform.rotation[2];
            self.render_buffer[base + 6] = transform.rotation[3];
            self.render_buffer[base + 7] = scale;
            self.render_buffer[base + 8] = collision.contacts as f32;
            self.render_buffer[base + 9] = heat;
            self.render_buffer[base + 10] = speed;
            self.render_buffer[base + 11] = 0.0;
        }
    }

    pub fn activate_next_entity(&mut self) -> Option<usize> {
        if self.active_count >= self.entity_order.len() {
            return None;
        }

        let next_index = self.active_count;
        self.active_count += 1;
        Some(next_index)
    }
}

#[cfg(test)]
mod tests {
    use super::{Simulation, StaticBoxCollider, INPUT_STRIDE};

    #[test]
    fn step_writes_input_to_render_and_increments_tick() {
        let mut sim = Simulation::new(4, 1).expect("capacity");
        sim.input_buffer[0] = 1.0;
        sim.input_buffer[1] = 2.0;
        sim.input_buffer[2] = 3.0;
        sim.input_buffer[3] = 0.0;
        sim.input_buffer[4] = 0.0;
        sim.input_buffer[5] = 0.0;
        sim.input_buffer[6] = 1.0;
        sim.input_buffer[7] = 0.0;
        sim.input_buffer[8] = 1.0;

        sim.step(0.5);

        assert_eq!(sim.render_buffer[0], 1.0);
        assert_eq!(sim.render_buffer[1], 2.0);
        assert_eq!(sim.render_buffer[2], 3.0);
        assert_eq!(sim.tick_count, 1);
        assert_eq!(sim.summary_buffer[0], 1.0);
    }

    #[test]
    fn contacts_increase_heat_and_affect_summary() {
        let mut sim = Simulation::new(2, 1).expect("capacity");
        sim.input_buffer[7] = 2.0;
        sim.input_buffer[8] = 0.0;

        sim.step(1.0 / 60.0);

        assert!(sim.render_buffer[9] > 0.0);
        assert!(sim.summary_buffer[2] >= 2.0);
    }

    #[test]
    fn activate_next_increments_active_count() {
        let mut sim = Simulation::new(3, 1).expect("capacity");
        assert_eq!(sim.active_count, 1);
        assert_eq!(sim.activate_next_entity(), Some(1));
        assert_eq!(sim.active_count, 2);
    }

    #[test]
    fn instancing_mode_populates_render_buffer() {
        let mut sim = Simulation::new(8, 8).expect("buffer sim");
        sim.add_static_box_collider(StaticBoxCollider {
            center: [0.0, -0.5, 0.0],
            half_extents: [12.0, 0.5, 12.0],
            friction: 0.95,
            restitution: 0.05,
        });
        for index in 0..8 {
            let base = index * INPUT_STRIDE;
            sim.input_buffer[base] = index as f32 * 0.25;
            sim.input_buffer[base + 1] = 4.0 + index as f32;
            sim.input_buffer[base + 2] = 0.0;
        }
        sim.bootstrap_instancing_from_input([0.25, 0.25, 0.25]);
        sim.step(1.0 / 60.0);

        assert_eq!(sim.active_count, 8);
        assert_eq!(sim.summary_buffer[0], 8.0);
        assert!(sim.render_buffer[1].is_finite());
        assert!(sim.render_buffer[7] > 0.0);
        assert!(sim.render_buffer[8] >= 0.0);
    }

    #[test]
    fn input_bootstrap_switches_to_instancing_mode() {
        let mut sim = Simulation::new(8, 8).expect("buffer sim");
        sim.input_buffer[0] = 3.0;
        sim.input_buffer[1] = 5.0;
        sim.input_buffer[2] = -2.0;

        sim.bootstrap_instancing_from_input([0.25, 0.25, 0.25]);
        sim.step(0.0);

        assert!((sim.render_buffer[0] - 3.0).abs() < 0.01);
        assert!((sim.render_buffer[1] - 5.0).abs() < 0.01);
        assert!((sim.render_buffer[2] + 2.0).abs() < 0.01);
        assert_eq!(sim.summary_buffer[0], 8.0);
    }

    #[test]
    fn input_stride_matches_layout() {
        assert_eq!(INPUT_STRIDE, 9);
    }
}
