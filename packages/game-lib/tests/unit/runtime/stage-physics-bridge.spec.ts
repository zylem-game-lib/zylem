/**
 * Unit tests for the WASM-owned-rendering Phase A primitives:
 *  - `readStageRenderSlot` (typed decode of the 12-float render layout)
 *  - `StagePhysicsBridge` (slot allocation + fixed-step + render interpolation)
 *
 * Both are exercised against a real {@link WasmStageRuntime} backed by the
 * shared fake `StageWasmExports`, so the buffer plumbing is real.
 */
import { describe, expect, it } from 'vitest';

import {
	WasmStageRuntime,
	readStageRenderSlot,
	type StageRenderSlot,
} from '../../../src/lib/runtime/wasm-stage-runtime';
import {
	StagePhysicsBridge,
	resolveEntityCollisionBundle,
	type BridgeTransform,
} from '../../../src/lib/runtime/stage-physics-bridge';
import { createFakeExports } from './_fake-stage-exports';

function makeTransform(): BridgeTransform {
	return { position: [0, 0, 0], rotation: [0, 0, 0, 1], scale: 1, custom: [0, 0, 0, 0] };
}

function makeFakeEntity(options: Record<string, unknown> = {}): any {
	return {
		options,
		runtimeHandle: -1,
		runtimeSlot: -1,
		runtimeAttached: false,
		wasmStageRef: null,
	};
}

describe('readStageRenderSlot', () => {
	it('decodes position, rotation, scale, and custom channels for a slot', () => {
		const view = new Float32Array(12 * 3);
		// slot 1
		view.set([1, 2, 3, 0.1, 0.2, 0.3, 0.927, 2.5, 0.5, 0.6, 0.7, 0.8], 12);

		const slot = readStageRenderSlot(view, 1);
		expect(slot).not.toBeNull();
		expect(slot!.position).toEqual([1, 2, 3]);
		expect(slot!.rotation[3]).toBeCloseTo(0.927, 5);
		expect(slot!.scale).toBeCloseTo(2.5, 5);
		expect(slot!.custom[0]).toBeCloseTo(0.5, 5);
		expect(slot!.custom[1]).toBeCloseTo(0.6, 5);
		expect(slot!.custom[2]).toBeCloseTo(0.7, 5);
		expect(slot!.custom[3]).toBeCloseTo(0.8, 5);
	});

	it('treats a zero scale (freshly-zeroed slot) as identity scale 1', () => {
		const view = new Float32Array(12);
		const slot = readStageRenderSlot(view, 0);
		expect(slot!.scale).toBe(1);
	});

	it('returns null for out-of-range slots', () => {
		const view = new Float32Array(12);
		expect(readStageRenderSlot(view, -1)).toBeNull();
		expect(readStageRenderSlot(view, 1)).toBeNull();
	});

	it('writes into the provided out object without allocating', () => {
		const view = new Float32Array(12);
		view.set([5, 6, 7], 0);
		const out: StageRenderSlot = { position: [0, 0, 0], rotation: [0, 0, 0, 1], scale: 1, custom: [0, 0, 0, 0] };
		const result = readStageRenderSlot(view, 0, out);
		expect(result).toBe(out);
		expect(out.position).toEqual([5, 6, 7]);
	});
});

describe('resolveEntityCollisionBundle', () => {
	it('builds a dynamic body + box collider sized from options.size by default', () => {
		const entity = makeFakeEntity({ size: { x: 2, y: 4, z: 6 }, position: { x: 1, y: 1, z: 1 } });
		const bundle = resolveEntityCollisionBundle(entity);
		expect(bundle.body.position).toEqual([1, 1, 1]);
		expect(bundle.colliders).toHaveLength(1);
		// Box collider stores half-extents.
		expect(bundle.colliders[0]!.shape).toMatchObject({ type: 'box', halfExtents: [1, 2, 3] });
	});

	it('locks all rotation axes for controlled-rotation entities (actors)', () => {
		const entity = makeFakeEntity({ size: { x: 1, y: 1, z: 1 } });
		entity.controlledRotation = true;
		const bundle = resolveEntityCollisionBundle(entity);
		expect(bundle.body.lockRotation).toEqual([true, true, true]);
	});
});

describe('StagePhysicsBridge', () => {
	it('attaches an entity, allocating a wasm slot and storing the handle', () => {
		const { exports } = createFakeExports();
		const runtime = new WasmStageRuntime(exports);
		const bridge = new StagePhysicsBridge(runtime, { physicsRate: 60 });

		const entity = makeFakeEntity({ size: { x: 1, y: 1, z: 1 } });
		const handle = bridge.attachEntity(entity);

		expect(handle).toBe(0);
		expect(entity.runtimeHandle).toBe(0);
		expect(entity.runtimeAttached).toBe(true);
		expect(entity.wasmStageRef).toBe(runtime);
		expect(runtime.activeCount).toBe(1);
		expect(bridge.getEntityForSlot(0)).toBe(entity);
	});

	it('is idempotent: re-attaching a live entity returns the same handle', () => {
		const { exports } = createFakeExports();
		const runtime = new WasmStageRuntime(exports);
		const bridge = new StagePhysicsBridge(runtime);
		const entity = makeFakeEntity({ size: { x: 1, y: 1, z: 1 } });

		const a = bridge.attachEntity(entity);
		const b = bridge.attachEntity(entity);
		expect(a).toBe(b);
		expect(runtime.activeCount).toBe(1);
	});

	it('detaches an entity, freeing the wasm slot', () => {
		const { exports } = createFakeExports();
		const runtime = new WasmStageRuntime(exports);
		const bridge = new StagePhysicsBridge(runtime);
		const entity = makeFakeEntity({ size: { x: 1, y: 1, z: 1 } });

		bridge.attachEntity(entity);
		bridge.detachEntity(entity);
		expect(entity.runtimeHandle).toBe(-1);
		expect(entity.runtimeAttached).toBe(false);
		expect(runtime.activeCount).toBe(0);
	});

	it('advances on a fixed timestep and interpolates render transforms', () => {
		const { exports, buffers, state } = createFakeExports();
		// Simulate motion: each physics substep advances slot 0 by +1 in x.
		exports.zylem_stage_step = () => {
			buffers.render[0] = (buffers.render[0] ?? 0) + 1;
			state.tick += 1;
			return state.active;
		};
		const runtime = new WasmStageRuntime(exports);
		const bridge = new StagePhysicsBridge(runtime, { physicsRate: 60 });

		const entity = makeFakeEntity({ size: { x: 1, y: 1, z: 1 } });
		bridge.attachEntity(entity);
		// Identity rotation in the slot so slerp is well-defined.
		buffers.render[6] = 1;

		const out = makeTransform();
		const fixed = 1 / 60;

		// One full step: prev=spawn(0), curr=stepped(1), alpha≈0 -> render prev.
		bridge.step(fixed);
		expect(bridge.interpolationAlpha).toBeCloseTo(0, 5);
		bridge.getTransform(0, out);
		expect(out.position[0]).toBeCloseTo(0, 4);

		// Half a step: no new substep, alpha=0.5 -> halfway between prev(0)/curr(1).
		bridge.step(fixed / 2);
		expect(bridge.interpolationAlpha).toBeCloseTo(0.5, 5);
		bridge.getTransform(0, out);
		expect(out.position[0]).toBeCloseTo(0.5, 4);

		// Another half completes a step: prev becomes 1, curr becomes 2, alpha≈0.
		bridge.step(fixed / 2);
		bridge.getTransform(0, out);
		expect(out.position[0]).toBeCloseTo(1, 4);
	});

	it('reports identity scale and passes through custom channels', () => {
		const { exports, buffers } = createFakeExports();
		const runtime = new WasmStageRuntime(exports);
		const bridge = new StagePhysicsBridge(runtime, { physicsRate: 60 });
		const entity = makeFakeEntity({ size: { x: 1, y: 1, z: 1 } });
		bridge.attachEntity(entity);

		buffers.render[6] = 1; // identity rotation
		buffers.render[8] = 0.7; // custom0
		bridge.step(1 / 60);

		const out = makeTransform();
		bridge.getTransform(0, out);
		// scale slot is 0 in the fake buffer -> treated as 1.
		expect(out.scale).toBeCloseTo(1, 5);
		expect(out.custom[0]).toBeCloseTo(0.7, 5);
	});

	it('returns null transforms for unattached handles', () => {
		const { exports } = createFakeExports();
		const runtime = new WasmStageRuntime(exports);
		const bridge = new StagePhysicsBridge(runtime);
		expect(bridge.getTransform(-1, makeTransform())).toBeNull();
	});

	it('builds box wireframes at the live transform for collider debug', () => {
		const { exports, buffers } = createFakeExports();
		const runtime = new WasmStageRuntime(exports);
		const bridge = new StagePhysicsBridge(runtime, { physicsRate: 60 });

		// 2×2×2 box -> half-extents [1,1,1], centered at x=10.
		const entity = makeFakeEntity({ size: { x: 2, y: 2, z: 2 } });
		bridge.attachEntity(entity);
		buffers.render[0] = 10; // position.x
		buffers.render[6] = 1;  // identity rotation (qw)
		buffers.render[7] = 1;  // scale
		bridge.step(1 / 60);

		const debug = bridge.getColliderDebugRender();
		// One box = 12 edges × 2 endpoints × 3 components.
		expect(debug.vertices.length).toBe(72);
		expect(debug.colors.length).toBe(96);
		// First build is always a change; a second build with no motion is not.
		expect(debug.changed).toBe(true);
		expect(bridge.getColliderDebugRender().changed).toBe(false);

		let minX = Infinity;
		let maxX = -Infinity;
		for (let i = 0; i < debug.vertices.length; i += 3) {
			minX = Math.min(minX, debug.vertices[i]!);
			maxX = Math.max(maxX, debug.vertices[i]!);
		}
		// Corners sit at center ± half-extent -> [9, 11] around x=10.
		expect(minX).toBeCloseTo(9, 4);
		expect(maxX).toBeCloseTo(11, 4);
	});

	it('drops collider debug geometry once an entity detaches', () => {
		const { exports } = createFakeExports();
		const runtime = new WasmStageRuntime(exports);
		const bridge = new StagePhysicsBridge(runtime, { physicsRate: 60 });

		const entity = makeFakeEntity({ size: { x: 1, y: 1, z: 1 } });
		bridge.attachEntity(entity);
		bridge.step(1 / 60);
		expect(bridge.getColliderDebugRender().vertices.length).toBe(72);

		bridge.detachEntity(entity);
		expect(bridge.getColliderDebugRender().vertices.length).toBe(0);
	});
});
