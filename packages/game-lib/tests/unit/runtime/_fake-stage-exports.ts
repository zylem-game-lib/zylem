/**
 * Shared test helper: a hand-rolled fake `StageWasmExports` backed by a real
 * `WebAssembly.Memory`. Lets unit tests exercise the TS side of the unified
 * runtime (buffer management, the physics bridge, render reads) without loading
 * the actual `zylem_runtime.wasm` artifact.
 *
 * Mirrors the inline fake in `wasm-stage-runtime.spec.ts`; extracted so the
 * bridge tests can drive the same contract.
 */
import {
	STAGE_EVENT_STRIDE,
	STAGE_INVALID_SLOT,
	STAGE_POSE_LEN,
	STAGE_RENDER_STRIDE,
	type StageWasmExports,
} from '../../../src/lib/runtime/wasm-stage-runtime';

export interface FakeBuffers {
	render: Float32Array;
	event: Float32Array;
	pose: Float32Array;
	vec3: Float32Array;
	query: Float32Array;
	scratch: Float32Array;
}

export interface FakeState {
	pointers: {
		render: number;
		event: number;
		pose: number;
		vec3: number;
		query: number;
		scratch: number;
	};
	tick: number;
	active: number;
	nextSlot: number;
	eventCount: number;
}

export function createFakeExports(): {
	exports: StageWasmExports;
	buffers: FakeBuffers;
	state: FakeState;
} {
	const PAGE = 65536;
	const memory = new WebAssembly.Memory({ initial: 4 });

	const renderCapacity = STAGE_RENDER_STRIDE * 8;
	const eventCapacity = STAGE_EVENT_STRIDE * 8;
	const queryCapacity = 32;
	const scratchCapacity = 64;

	const layout = {
		render: PAGE * 1,
		event: PAGE * 1 + renderCapacity * 4,
		pose: PAGE * 1 + (renderCapacity + eventCapacity) * 4,
		vec3: PAGE * 1 + (renderCapacity + eventCapacity + STAGE_POSE_LEN) * 4,
		query: PAGE * 1 + (renderCapacity + eventCapacity + STAGE_POSE_LEN + 3) * 4,
		scratch: PAGE * 1 + (renderCapacity + eventCapacity + STAGE_POSE_LEN + 3 + queryCapacity) * 4,
	};

	const buffers: FakeBuffers = {
		render: new Float32Array(memory.buffer, layout.render, renderCapacity),
		event: new Float32Array(memory.buffer, layout.event, eventCapacity),
		pose: new Float32Array(memory.buffer, layout.pose, STAGE_POSE_LEN),
		vec3: new Float32Array(memory.buffer, layout.vec3, 3),
		query: new Float32Array(memory.buffer, layout.query, queryCapacity),
		scratch: new Float32Array(memory.buffer, layout.scratch, scratchCapacity),
	};

	const state: FakeState = {
		pointers: layout,
		tick: 0,
		active: 0,
		nextSlot: 0,
		eventCount: 0,
	};

	const noop = () => {};
	const ok = () => 1;

	const exports: StageWasmExports = {
		memory,
		zylem_stage_create: () => 1,
		zylem_stage_destroy: () => {
			state.tick = 0;
			state.active = 0;
			state.nextSlot = 0;
		},
		zylem_stage_set_gravity: noop,
		zylem_stage_step: () => {
			state.tick += 1;
			return state.active;
		},
		zylem_stage_tick_count: () => state.tick,
		zylem_stage_active_count: () => state.active,
		zylem_stage_create_entity: () => {
			const slot = state.nextSlot++;
			state.active += 1;
			return slot;
		},
		zylem_stage_destroy_entity: () => {
			state.active = Math.max(0, state.active - 1);
			return 1;
		},
		zylem_stage_attach_body: ok,
		zylem_stage_capacity: () => 64,
		zylem_stage_add_collider_box: ok,
		zylem_stage_add_collider_sphere: ok,
		zylem_stage_add_collider_capsule: ok,
		zylem_stage_add_collider_cylinder: ok,
		zylem_stage_add_collider_convex_hull: ok,
		zylem_stage_add_collider_trimesh: ok,
		zylem_stage_add_collider_heightfield: ok,
		zylem_stage_pose_ptr: () => state.pointers.pose,
		zylem_stage_pose_len: () => STAGE_POSE_LEN,
		zylem_stage_get_pose: () => 1,
		zylem_stage_set_position: ok,
		zylem_stage_set_rotation: ok,
		zylem_stage_set_linvel: ok,
		zylem_stage_get_linvel: ok,
		zylem_stage_set_angvel: ok,
		zylem_stage_apply_impulse: ok,
		zylem_stage_vec3_ptr: () => state.pointers.vec3,
		zylem_stage_render_ptr: () => state.pointers.render,
		zylem_stage_render_len: () => renderCapacity,
		zylem_stage_render_stride: () => STAGE_RENDER_STRIDE,
		zylem_stage_event_ptr: () => state.pointers.event,
		zylem_stage_event_len: () => eventCapacity,
		zylem_stage_event_count: () => state.eventCount,
		zylem_stage_event_stride: () => STAGE_EVENT_STRIDE,
		zylem_stage_query_ptr: () => state.pointers.query,
		zylem_stage_query_len: () => queryCapacity,
		zylem_stage_scratch_ptr: () => state.pointers.scratch,
		zylem_stage_scratch_capacity: () => scratchCapacity,
		zylem_stage_attach_cooldown: ok,
		zylem_stage_cooldown_register: ok,
		zylem_stage_cooldown_fire: ok,
		zylem_stage_cooldown_reset: ok,
		zylem_stage_cooldown_remaining: () => 0,
		zylem_stage_attach_world_boundary: ok,
		zylem_stage_query_world_boundary: () => 1,
		zylem_stage_attach_screen_wrap: ok,
		zylem_stage_query_screen_wrap: () => 1,
		zylem_stage_attach_ricochet: ok,
		zylem_stage_query_ricochet: () => 1,
		zylem_stage_attach_thruster: ok,
		zylem_stage_set_thruster_input: noop,
		zylem_stage_query_thruster: () => 1,
		zylem_stage_attach_top_down: ok,
		zylem_stage_set_top_down_input: noop,
		zylem_stage_attach_jumper_2d: ok,
		zylem_stage_set_jumper_2d_input: noop,
		zylem_stage_query_jumper_2d: () => 1,
		zylem_stage_attach_jumper_3d: ok,
		zylem_stage_set_jumper_3d_input: noop,
		zylem_stage_query_jumper_3d: () => 1,
		zylem_stage_attach_shooter_2d: ok,
		zylem_stage_shooter_2d_fire: ok,
		zylem_stage_query_shooter_2d: () => 1,
		zylem_stage_attach_platformer_3d: ok,
		zylem_stage_set_platformer_3d_input_axes: noop,
		zylem_stage_set_platformer_3d_input_buttons: noop,
		zylem_stage_query_platformer_3d: () => 1,
		zylem_stage_attach_first_person: ok,
		zylem_stage_set_first_person_input: noop,
		zylem_stage_query_first_person: () => 1,
		zylem_stage_invalid_slot: () => STAGE_INVALID_SLOT,
	};

	return { exports, buffers, state };
}
