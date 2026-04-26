/**
 * End-to-end smoke tests for the Gameplay3D wasm path:
 *   bootstrap → step → buffer view reads.
 *
 * The Rust side is exhaustively covered by inline unit/integration tests
 * (`platformer_3d::system::tests`, `gameplay_3d::tests`). This spec only
 * verifies the TS bindings + buffer-view layer wires the FFI correctly.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import {
	addZylemRuntimeStaticHeightfieldCollider,
	bootstrapZylemRuntimeGameplay3D,
	createZylemRuntimeSession,
	getZylemRuntimeGameplay3DDebugRender,
	getZylemRuntimeGameplay3DGrounded,
	getZylemRuntimeGameplay3DJumpCount,
	getZylemRuntimeGameplay3DState,
	readZylemRuntimeGameplay3DEvents,
	setZylemRuntimeGameplay3DInputAxes,
	setZylemRuntimeGameplay3DInputButtons,
	type ZylemRuntimeBufferViews,
	type ZylemRuntimeGameplay3DConfig,
	ZylemRuntimeEventType,
	ZylemRuntimePlatformer3DFsmState,
} from '../../../src/lib/runtime/zylem-wasm-runtime';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REL_WASM = 'wasm32-unknown-unknown/release/zylem_runtime.wasm';
const WORKSPACE_WASM_PATH = path.resolve(
	__dirname,
	`../../../../zylem-runtime/target/${REL_WASM}`,
);
const CARGO_TARGET_DIR = process.env.CARGO_TARGET_DIR;
const WASM_CANDIDATES: readonly string[] = CARGO_TARGET_DIR
	? [path.resolve(CARGO_TARGET_DIR, REL_WASM), WORKSPACE_WASM_PATH]
	: [WORKSPACE_WASM_PATH];

const DT = 1 / 60;

let wasmBytes: ArrayBuffer | null = null;

async function loadWasmBytes(): Promise<ArrayBuffer> {
	if (wasmBytes) return wasmBytes;
	const errors: string[] = [];
	for (const candidate of WASM_CANDIDATES) {
		try {
			const buffer = await readFile(candidate);
			const arrayBuffer = buffer.buffer.slice(
				buffer.byteOffset,
				buffer.byteOffset + buffer.byteLength,
			) as ArrayBuffer;
			wasmBytes = arrayBuffer;
			return arrayBuffer;
		} catch (error) {
			errors.push(`${candidate}: ${(error as Error).message}`);
		}
	}
	throw new Error(
		`Failed to load zylem-runtime wasm. Tried:\n${errors.join('\n')}\nRun \`cargo build --manifest-path packages/zylem-runtime/Cargo.toml --target wasm32-unknown-unknown --release\` first.`,
	);
}

function platformerConfig(slot: number): ZylemRuntimeGameplay3DConfig['platformers'][number] {
	return {
		slot,
		walkSpeed: 6,
		runSpeed: 12,
		jumpForce: 8,
		maxJumps: 1,
		gravity: 9.82,
		coyoteTime: 0.1,
		jumpBufferTime: 0.1,
		jumpCutMultiplier: 0.5,
		multiJumpWindow: 0.15,
		maxSlopeDeg: 50,
		autostepHeight: 0.3,
		snapToGround: 0.2,
	};
}

async function bootstrapSingleCharacter(
	overrides: Partial<ZylemRuntimeGameplay3DConfig> = {},
): Promise<ZylemRuntimeBufferViews> {
	const bytes = await loadWasmBytes();
	const buffers = await createZylemRuntimeSession(bytes, 1, 1);
	const config: ZylemRuntimeGameplay3DConfig = {
		capsules: [
			{
				slot: 0,
				position: [0, 2, 0],
				halfHeight: 0.5,
				radius: 0.3,
			},
		],
		platformers: [platformerConfig(0)],
		staticColliders: [
			{
				center: [0, -0.5, 0],
				halfExtents: [10, 0.5, 10],
				friction: 0.95,
			},
		],
		...overrides,
	};
	return bootstrapZylemRuntimeGameplay3D(buffers, config);
}

function stepUntilGrounded(buffers: ZylemRuntimeBufferViews, maxTicks = 240): boolean {
	for (let i = 0; i < maxTicks; i++) {
		buffers.exports.zylem_runtime_step(DT);
		if (getZylemRuntimeGameplay3DGrounded(buffers, 0)) {
			return true;
		}
	}
	return false;
}

describe('zylem-wasm-runtime gameplay3d', () => {
	beforeAll(async () => {
		await loadWasmBytes();
	});

	it('bootstrap initializes input buffer and buffer views', async () => {
		const buffers = await bootstrapSingleCharacter();

		expect(buffers.inputLen).toBeGreaterThanOrEqual(buffers.inputStride);
		expect(buffers.renderLen).toBeGreaterThanOrEqual(buffers.renderStride);
		expect(buffers.gameplay3dEventLen).toBeGreaterThanOrEqual(0);

		expect(buffers.inputView[0]).toBeCloseTo(0);
		expect(buffers.inputView[1]).toBeCloseTo(2);
		expect(buffers.inputView[2]).toBeCloseTo(0);
		expect(getZylemRuntimeGameplay3DGrounded(buffers, 0)).toBe(false);
		expect(getZylemRuntimeGameplay3DJumpCount(buffers, 0)).toBe(0);
	});

	it('character falls onto the ground and reports grounded via FFI', async () => {
		const buffers = await bootstrapSingleCharacter();
		const settled = stepUntilGrounded(buffers);
		expect(settled).toBe(true);
		expect(getZylemRuntimeGameplay3DGrounded(buffers, 0)).toBe(true);

		const yAfterSettle = buffers.inputView[1]!;
		expect(yAfterSettle).toBeGreaterThan(-0.5);
		expect(yAfterSettle).toBeLessThan(2);
	});

	it('jump press lifts off, increments jump count, and emits JumpStarted', async () => {
		const buffers = await bootstrapSingleCharacter();
		expect(stepUntilGrounded(buffers)).toBe(true);

		setZylemRuntimeGameplay3DInputButtons(buffers, 0, true, false);
		buffers.exports.zylem_runtime_step(DT);

		const events = readZylemRuntimeGameplay3DEvents(buffers);
		const jumpStarted = events.find((event) => event.type === ZylemRuntimeEventType.JumpStarted);
		expect(jumpStarted).toBeDefined();
		expect(jumpStarted!.primarySlot).toBe(0);
		expect(jumpStarted!.secondarySlot).toBe(1);

		expect(getZylemRuntimeGameplay3DJumpCount(buffers, 0)).toBe(1);
		expect(getZylemRuntimeGameplay3DGrounded(buffers, 0)).toBe(false);
	});

	it('character lands and emits Landed event after the jump arc', async () => {
		const buffers = await bootstrapSingleCharacter();
		expect(stepUntilGrounded(buffers)).toBe(true);

		setZylemRuntimeGameplay3DInputButtons(buffers, 0, true, false);
		buffers.exports.zylem_runtime_step(DT);
		setZylemRuntimeGameplay3DInputButtons(buffers, 0, false, false);

		let landedEvent: ReturnType<typeof readZylemRuntimeGameplay3DEvents>[number] | undefined;
		for (let i = 0; i < 240; i++) {
			buffers.exports.zylem_runtime_step(DT);
			const events = readZylemRuntimeGameplay3DEvents(buffers);
			landedEvent = events.find((event) => event.type === ZylemRuntimeEventType.Landed);
			if (landedEvent) break;
		}
		expect(landedEvent).toBeDefined();
		expect(landedEvent!.primarySlot).toBe(0);
		expect(getZylemRuntimeGameplay3DGrounded(buffers, 0)).toBe(true);
		expect(getZylemRuntimeGameplay3DJumpCount(buffers, 0)).toBe(0);
	});

	it('FSM state transitions through idle → walking → running → jumping → falling → idle', async () => {
		const buffers = await bootstrapSingleCharacter();
		expect(stepUntilGrounded(buffers)).toBe(true);

		// Grounded with no input → Idle.
		expect(getZylemRuntimeGameplay3DState(buffers, 0)).toBe(
			ZylemRuntimePlatformer3DFsmState.Idle,
		);

		// Add horizontal axis → Walking on next step.
		setZylemRuntimeGameplay3DInputAxes(buffers, 0, 1, 0);
		buffers.exports.zylem_runtime_step(DT);
		expect(getZylemRuntimeGameplay3DState(buffers, 0)).toBe(
			ZylemRuntimePlatformer3DFsmState.Walking,
		);

		// Toggle run → Running.
		setZylemRuntimeGameplay3DInputButtons(buffers, 0, false, true);
		buffers.exports.zylem_runtime_step(DT);
		expect(getZylemRuntimeGameplay3DState(buffers, 0)).toBe(
			ZylemRuntimePlatformer3DFsmState.Running,
		);

		// Press jump → Jumping (jump_started edge).
		setZylemRuntimeGameplay3DInputButtons(buffers, 0, true, false);
		buffers.exports.zylem_runtime_step(DT);
		expect(getZylemRuntimeGameplay3DState(buffers, 0)).toBe(
			ZylemRuntimePlatformer3DFsmState.Jumping,
		);

		// Cut input + step until apex passed → Falling.
		setZylemRuntimeGameplay3DInputAxes(buffers, 0, 0, 0);
		setZylemRuntimeGameplay3DInputButtons(buffers, 0, false, false);
		let sawFalling = false;
		for (let i = 0; i < 240; i++) {
			buffers.exports.zylem_runtime_step(DT);
			if (
				getZylemRuntimeGameplay3DState(buffers, 0) ===
				ZylemRuntimePlatformer3DFsmState.Falling
			) {
				sawFalling = true;
				break;
			}
		}
		expect(sawFalling).toBe(true);

		// Land → eventually Idle once the Landing edge resolves.
		for (let i = 0; i < 240; i++) {
			buffers.exports.zylem_runtime_step(DT);
			if (
				getZylemRuntimeGameplay3DGrounded(buffers, 0) &&
				getZylemRuntimeGameplay3DState(buffers, 0) ===
					ZylemRuntimePlatformer3DFsmState.Idle
			) {
				break;
			}
		}
		expect(getZylemRuntimeGameplay3DState(buffers, 0)).toBe(
			ZylemRuntimePlatformer3DFsmState.Idle,
		);
	});

	it('heightfield collider catches a falling capsule above the ramp', async () => {
		const bytes = await loadWasmBytes();
		const buffers = await createZylemRuntimeSession(bytes, 1, 1);

		// 4x4 grid (5x5 vertices) flat heightfield at y=0 in world units.
		const rows = 4;
		const cols = 4;
		const heights = new Float32Array((rows + 1) * (cols + 1));
		addZylemRuntimeStaticHeightfieldCollider(buffers.exports, buffers.exports.memory, {
			rows,
			cols,
			heights,
			scale: [10, 1, 10],
			translation: [0, 0, 0],
			friction: 0.95,
			restitution: 0,
		});

		const config: ZylemRuntimeGameplay3DConfig = {
			capsules: [
				{
					slot: 0,
					position: [0, 3, 0],
					halfHeight: 0.5,
					radius: 0.3,
				},
			],
			platformers: [platformerConfig(0)],
			staticColliders: [],
		};
		const view = bootstrapZylemRuntimeGameplay3D(buffers, config);
		expect(stepUntilGrounded(view)).toBe(true);
		// Capsule should rest on the heightfield (y ≈ 0 + half_height + radius)
		// rather than falling forever.
		const restingY = view.inputView[1]!;
		expect(restingY).toBeGreaterThan(-0.5);
		expect(restingY).toBeLessThan(2);
	});

	it('demo third-person heightfield catches the demo capsule', async () => {
		// Mirrors `00-third-person-test.ts`'s exact bootstrap path: 5x5
		// height grid (subdivisions=4), scale 100x1x100, translation y=-4,
		// capsule (halfHeight=1.4, radius=0.5) starting at y=5.
		const bytes = await loadWasmBytes();
		const buffers = await createZylemRuntimeSession(bytes, 1, 1);

		const rows = 4;
		const cols = 4;
		const heights = new Float32Array((rows + 1) * (cols + 1));
		for (let x = 0; x <= rows; x++) {
			for (let z = 0; z <= cols; z++) {
				heights[x * (cols + 1) + z] = (x + z) * 0.5;
			}
		}
		addZylemRuntimeStaticHeightfieldCollider(buffers.exports, buffers.exports.memory, {
			rows,
			cols,
			heights,
			scale: [100, 1, 100],
			translation: [0, -4, 0],
			friction: 0.95,
			restitution: 0,
		});

		const demoConfig: ZylemRuntimeGameplay3DConfig = {
			capsules: [
				{
					slot: 0,
					position: [0, 5, 0],
					halfHeight: 1.4,
					radius: 0.5,
				},
			],
			platformers: [
				{
					slot: 0,
					walkSpeed: 10,
					runSpeed: 20,
					jumpForce: 16,
					maxJumps: 4,
					gravity: 9.82,
					coyoteTime: 0.1,
					jumpBufferTime: 0.1,
					jumpCutMultiplier: 0.5,
					multiJumpWindow: 0.15,
					maxSlopeDeg: 50,
					autostepHeight: 0.3,
					snapToGround: 0.2,
				},
			],
			staticColliders: [],
		};
		const view = bootstrapZylemRuntimeGameplay3D(buffers, demoConfig);
		expect(stepUntilGrounded(view, 600)).toBe(true);
		const restingY = view.inputView[1]!;
		// Heightfield surface near origin sits roughly at y ≈ -2 (height 2.0
		// minus translation -4); capsule centre ≈ -2 + 1.4 + 0.5 = -0.1.
		expect(restingY).toBeGreaterThan(-1.5);
		expect(restingY).toBeLessThan(1.0);
	});

	it('rejects heightfield length mismatches', async () => {
		const bytes = await loadWasmBytes();
		const buffers = await createZylemRuntimeSession(bytes, 1, 1);
		expect(() =>
			addZylemRuntimeStaticHeightfieldCollider(buffers.exports, buffers.exports.memory, {
				rows: 2,
				cols: 2,
				heights: new Float32Array(4),
				scale: [10, 1, 10],
				translation: [0, 0, 0],
			}),
		).toThrow(/heights length/);
	});

	it('debug render returns non-empty vertex/color buffers after bootstrap', async () => {
		const buffers = await bootstrapSingleCharacter();
		// Step once so DebugRenderPipeline has a fully-stepped world to inspect.
		buffers.exports.zylem_runtime_step(DT);

		const debug = getZylemRuntimeGameplay3DDebugRender(buffers.exports, buffers.exports.memory);
		expect(debug).not.toBeNull();
		expect(debug!.vertexCount).toBeGreaterThan(0);
		// Position attr is stride 3, color attr is stride 4 — same layout as
		// TS-Rapier `world.debugRender()`.
		expect(debug!.vertices.length).toBe(debug!.vertexCount * 3);
		expect(debug!.colors.length).toBe(debug!.vertexCount * 4);
		expect(debug!.vertices.length % 6).toBe(0);
		expect(debug!.colors.length % 8).toBe(0);
	});

	it('horizontal input axes translate slot position via render buffer', async () => {
		const buffers = await bootstrapSingleCharacter();
		expect(stepUntilGrounded(buffers)).toBe(true);

		const startX = buffers.inputView[0]!;
		setZylemRuntimeGameplay3DInputAxes(buffers, 0, 1, 0);
		for (let i = 0; i < 30; i++) {
			buffers.exports.zylem_runtime_step(DT);
		}
		const endX = buffers.inputView[0]!;
		expect(endX - startX).toBeGreaterThan(0.5);

		const renderBase = 0 * buffers.renderStride;
		expect(buffers.renderView[renderBase]).toBeCloseTo(endX, 3);
	});
});
