/**
 * Unit tests for {@link WasmStageRuntime}.
 *
 * These tests use a hand-rolled fake `StageWasmExports` so we can exercise the
 * TS-side buffer management, view refresh, and FFI wrapping without needing to
 * load the actual `zylem_runtime.wasm` artifact (which only exists once the
 * Rust crate has been built to wasm32). The fake mirrors the Rust contract:
 * a single `WebAssembly.Memory`, exported pointer/length getters, and the
 * unified-Stage entrypoints used by `WasmStageRuntime`.
 */

import { describe, expect, it } from 'vitest';

import {
	STAGE_EVENT_STRIDE,
	STAGE_INVALID_SLOT,
	STAGE_POSE_LEN,
	STAGE_RENDER_STRIDE,
	StageEventType,
	WasmStageRuntime,
	type StageWasmExports,
} from '../../../src/lib/runtime/wasm-stage-runtime';

interface FakeBuffers {
	render: Float32Array;
	event: Float32Array;
	pose: Float32Array;
	vec3: Float32Array;
	query: Float32Array;
	scratch: Float32Array;
}

interface FakeState {
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

function createFakeExports(): { exports: StageWasmExports; buffers: FakeBuffers; state: FakeState } {
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

describe('WasmStageRuntime', () => {
	it('initializes with the configured capacity and refreshes typed views over wasm memory', () => {
		const { exports } = createFakeExports();
		const runtime = new WasmStageRuntime(exports, {
			initialCapacity: 16,
			gravity: [0, -9.81, 0],
		});

		expect(runtime.tickCount).toBe(0);
		expect(runtime.activeCount).toBe(0);

		// Step once and confirm the view is refreshed without throwing.
		const active = runtime.step(0.016);
		expect(runtime.tickCount).toBe(1);
		expect(active).toBe(runtime.activeCount);
	});

	it('createEntity returns sequential u32 slot handles and tracks active count', () => {
		const { exports } = createFakeExports();
		const runtime = new WasmStageRuntime(exports);

		const a = runtime.createEntity();
		const b = runtime.createEntity();
		const c = runtime.createEntity();
		expect(a).toBe(0);
		expect(b).toBe(1);
		expect(c).toBe(2);
		expect(runtime.activeCount).toBe(3);

		runtime.destroyEntity(b);
		expect(runtime.activeCount).toBe(2);
	});

	it('reads pose from the pose-scratch buffer when zylem_stage_get_pose returns 1', () => {
		const { exports, buffers } = createFakeExports();
		const runtime = new WasmStageRuntime(exports);

		buffers.pose.set([3, 4, 5, 0.1, 0.2, 0.3, 0.927]);
		const pose = runtime.getPose(7);
		expect(pose).not.toBeNull();
		expect(pose!.position).toEqual([3, 4, 5]);
		expect(pose!.rotation[0]).toBeCloseTo(0.1, 5);
		expect(pose!.rotation[1]).toBeCloseTo(0.2, 5);
		expect(pose!.rotation[2]).toBeCloseTo(0.3, 5);
		expect(pose!.rotation[3]).toBeCloseTo(0.927, 5);
	});

	it('drainEvents parses the typed-event buffer using the published count + stride', () => {
		const { exports, buffers, state } = createFakeExports();
		const runtime = new WasmStageRuntime(exports);

		// Seed two events directly in the wasm event buffer. Missing-slot
		// sentinel is NaN per the Rust contract (`f32::NAN`).
		buffers.event.set(
			[
				StageEventType.BoundaryHit, 5, Number.NaN, 1, 0, 0,
				StageEventType.Ricochet, 11, 12, 0.5, -0.5, 0.0,
			],
			0,
		);
		state.eventCount = 2;

		const events = runtime.drainEvents();
		expect(events).toHaveLength(2);
		const [boundaryHit, ricochet] = events;
		expect(boundaryHit).toBeDefined();
		expect(ricochet).toBeDefined();
		expect(boundaryHit!.type).toBe(StageEventType.BoundaryHit);
		expect(boundaryHit!.primarySlot).toBe(5);
		expect(boundaryHit!.secondarySlot).toBeNull();
		expect(ricochet!.type).toBe(StageEventType.Ricochet);
		expect(ricochet!.primarySlot).toBe(11);
		expect(ricochet!.secondarySlot).toBe(12);
		expect(ricochet!.payload[0]).toBeCloseTo(0.5, 5);
	});

	it('dispose() forwards to the wasm destructor', () => {
		const { exports, state } = createFakeExports();
		const runtime = new WasmStageRuntime(exports);

		state.active = 5;
		state.tick = 99;
		runtime.dispose();
		expect(state.active).toBe(0);
		expect(state.tick).toBe(0);
	});
});
