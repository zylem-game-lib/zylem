use crate::runtime::behaviors::boundary_2d::system as boundary_2d_system;
use crate::runtime::behaviors::paddle_input_2d::system as player_input_2d_system;
use crate::runtime::behaviors::ricochet_2d::system as ricochet_2d_system;
use crate::runtime::common::{Bounds2D, Gameplay2dTriggerAabb, EVENT_STRIDE};
use crate::runtime::components::body_2d::{
	Body2DKind,
	Body2DSlot,
	DynamicCircleBody2DConfig,
	KinematicAabbBody2DConfig,
	PendingBody2DSlot,
};
use crate::runtime::events::RuntimeEventType;

pub struct Gameplay2DState {
	pub slots: Vec<Body2DSlot>,
	pub bounds: Bounds2D,
	pub input_axes: [f32; 2],
	pub event_buffer: Vec<f32>,
	pub triggers: Vec<Gameplay2dTriggerAabb>,
	trigger_overlap_prev: Vec<bool>,
}

impl Gameplay2DState {
	pub fn from_pending(
		positions: &[[f32; 3]],
		pending: &[PendingBody2DSlot],
	) -> Self {
		let mut slots = Vec::with_capacity(positions.len());

		for (index, position) in positions.iter().enumerate() {
			let pending_slot = pending.get(index).copied().unwrap_or_default();
			let mut slot = Body2DSlot {
				position: *position,
				uses_boundary_2d: pending_slot.uses_boundary_2d,
				uses_ricochet_2d: pending_slot.uses_ricochet_2d,
				..Body2DSlot::default()
			};

			if let Some(body) = pending_slot.dynamic_circle {
				apply_dynamic_circle_config(&mut slot, body);
			} else if let Some(body) = pending_slot.kinematic_aabb {
				apply_kinematic_aabb_config(&mut slot, body);
			}

			slots.push(slot);
		}

		Self {
			slots,
			bounds: Bounds2D {
				left: -15.0,
				right: 15.0,
				bottom: -5.0,
				top: 5.0,
			},
			input_axes: [0.0, 0.0],
			event_buffer: Vec::with_capacity(EVENT_STRIDE * 8),
			triggers: Vec::new(),
			trigger_overlap_prev: Vec::new(),
		}
	}

	pub fn set_input_axis(&mut self, channel: usize, vertical: f32) {
		if let Some(axis) = self.input_axes.get_mut(channel) {
			*axis = vertical.clamp(-1.0, 1.0);
		}
	}

	pub fn step(&mut self, dt: f32) {
		let dt = dt.max(0.0);
		self.event_buffer.clear();

		player_input_2d_system::step_kinematic_aabb_bodies(self, dt);

		let Some(body_index) = self
			.slots
			.iter()
			.position(|slot| slot.kind == Body2DKind::DynamicCircle)
		else {
			return;
		};

		self.slots[body_index].position[0] += self.slots[body_index].velocity[0] * dt;
		self.slots[body_index].position[1] += self.slots[body_index].velocity[1] * dt;

		boundary_2d_system::resolve_boundary_bounce(self, body_index);
		ricochet_2d_system::resolve_collider_bounce(self, body_index);
		emit_region_entered_events(self, body_index);
	}

	pub fn dynamic_circle_hits_aabb(&self, circle_index: usize, aabb_index: usize) -> bool {
		let circle = self.slots[circle_index];
		let aabb = self.slots[aabb_index];
		let dx = (circle.position[0] - aabb.position[0]).abs();
		let dy = (circle.position[1] - aabb.position[1]).abs();
		dx <= aabb.half_extents[0] + circle.radius && dy <= aabb.half_extents[1] + circle.radius
	}

	pub fn dynamic_circle_speed(&self, circle_index: usize) -> f32 {
		let velocity = self.slots[circle_index].velocity;
		(velocity[0] * velocity[0] + velocity[1] * velocity[1]).sqrt()
	}

	pub fn clamp_dynamic_circle_speed(&self, circle_index: usize, speed: f32) -> f32 {
		speed.clamp(
			self.slots[circle_index].min_speed.max(0.01),
			self.slots[circle_index]
				.max_speed
				.max(self.slots[circle_index].min_speed.max(0.01)),
		)
	}

	pub fn push_event(
		&mut self,
		event_type: RuntimeEventType,
		primary_slot: usize,
		secondary_slot: usize,
		aux: usize,
	) {
		self.event_buffer.push(event_type as u32 as f32);
		self.event_buffer.push(primary_slot as f32);
		self.event_buffer.push(secondary_slot as f32);
		self.event_buffer.push(aux as f32);
	}

	pub fn event_count(&self) -> usize {
		self.event_buffer.len() / EVENT_STRIDE
	}

	/// Replaces trigger volumes and resets edge-detection state (call once at bootstrap).
	pub fn set_triggers(&mut self, triggers: Vec<Gameplay2dTriggerAabb>) {
		self.triggers = triggers;
		self.trigger_overlap_prev = vec![false; self.triggers.len()];
	}
}

fn apply_dynamic_circle_config(slot: &mut Body2DSlot, body: DynamicCircleBody2DConfig) {
	slot.kind = Body2DKind::DynamicCircle;
	slot.radius = body.radius.max(0.01);
	slot.velocity = body.initial_velocity;
	slot.min_speed = body.min_speed.max(0.01);
	slot.max_speed = body.max_speed.max(slot.min_speed);
	slot.speed_multiplier = body.speed_multiplier.max(1.0);
	slot.max_angle_deg = body.max_angle_deg.max(1.0);
	slot.reflection_mode = body.reflection_mode;
}

fn apply_kinematic_aabb_config(slot: &mut Body2DSlot, body: KinematicAabbBody2DConfig) {
	slot.kind = Body2DKind::KinematicAabb;
	slot.input_channel = body.input_channel.min(1);
	slot.speed = body.speed.max(0.0);
}

fn circle_overlaps_trigger_aabb(circle: &Body2DSlot, trigger: &Gameplay2dTriggerAabb) -> bool {
	let dx = (circle.position[0] - trigger.position[0]).abs();
	let dy = (circle.position[1] - trigger.position[1]).abs();
	let hw = trigger.half_extents[0].max(0.01);
	let hh = trigger.half_extents[1].max(0.01);
	let r = circle.radius.max(0.01);
	dx <= hw + r && dy <= hh + r
}

fn emit_region_entered_events(state: &mut Gameplay2DState, circle_index: usize) {
	if state.slots.get(circle_index).map(|s| s.kind) != Some(Body2DKind::DynamicCircle) {
		return;
	}
	let triggers_snapshot = state.triggers.clone();
	let mut pending = Vec::new();
	for (i, trigger) in triggers_snapshot.iter().enumerate() {
		let inside = circle_overlaps_trigger_aabb(&state.slots[circle_index], trigger);
		let was_inside = state.trigger_overlap_prev[i];
		state.trigger_overlap_prev[i] = inside;
		if inside && !was_inside {
			pending.push((trigger.trigger_id, i));
		}
	}
	for (trigger_id, aux_index) in pending {
		state.push_event(
			RuntimeEventType::RegionEntered,
			circle_index,
			trigger_id as usize,
			aux_index,
		);
	}
}
