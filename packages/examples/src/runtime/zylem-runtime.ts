import {
	bootstrapZylemRuntimeInstancing,
	bootstrapZylemRuntimeGameplay2D,
	createZylemRuntimeStageAdapter,
	createZylemRuntimeInstancedBatchSession,
	createZylemRuntimeGameplay2DSession,
	createZylemRuntimeSession,
	setZylemRuntimeGameplay2DSlotPosition,
	setZylemRuntimeGameplay2DSlotVelocity,
	type StageRuntimeAdapter,
	type ZylemRuntimeEvent,
	type ZylemRuntimeBufferViews,
	type ZylemRuntimeInstancedBatchConfig,
	type ZylemRuntimeDynamicCircleBody2DConfig,
	type ZylemRuntimeGameplay2DConfig,
	type ZylemRuntimeGameplay2DWorldBounds,
	type ZylemRuntimeKinematicAabbBody2DConfig,
	type ZylemRuntimeStaticBoxCollider,
} from '@zylem/game-lib/runtime';

import runtimeWasmUrl from '../../../zylem-runtime/target/wasm32-unknown-unknown/release/zylem_runtime.wasm?url';

export type {
	ZylemRuntimeBufferViews,
	ZylemRuntimeExports,
	ZylemRuntimeEvent,
	ZylemRuntimeInstancedBatchConfig,
	ZylemRuntimeDynamicCircleBody2DConfig,
	ZylemRuntimeGameplay2DConfig,
	ZylemRuntimeGameplay2DWorldBounds,
	ZylemRuntimeKinematicAabbBody2DConfig,
	ZylemRuntimeStaticBoxCollider,
	StageRuntimeAdapter,
} from '@zylem/game-lib/runtime';
export {
	attachZylemRuntimeBufferViews,
	bootstrapZylemRuntimeInstancing,
	bootstrapZylemRuntimeGameplay2D,
	createZylemRuntimeStageAdapter,
	createZylemRuntimeInstancedBatchSession,
	createZylemRuntimeGameplay2DSession,
	createZylemRuntimeSession,
	loadZylemRuntimeWasm,
	readZylemRuntimeEvents,
	readRenderSlot,
	readSummary,
	setZylemRuntimeGameplay2DInputAxis,
	setZylemRuntimeGameplay2DSlotPosition,
	setZylemRuntimeGameplay2DSlotVelocity,
	writeInputSlot,
	writeInputSlotFromParts,
	ZYLEM_RUNTIME_EVENT_STRIDE,
	ZYLEM_RUNTIME_INPUT_STRIDE,
	ZYLEM_RUNTIME_RENDER_STRIDE,
	ZYLEM_RUNTIME_SUMMARY_LEN,
	ZylemRuntimeEventType,
} from '@zylem/game-lib/runtime';

/** URL to the built `zylem_runtime.wasm` in this monorepo (Vite `?url`). */
export const ZYLEM_RUNTIME_WASM_URL: string = runtimeWasmUrl;

/**
 * Loads the workspace wasm bundle and initializes a session with the given capacity.
 */
export function createBundledZylemRuntimeSession(
	capacity: number,
	initialActive: number,
): Promise<ZylemRuntimeBufferViews> {
	return createZylemRuntimeSession(runtimeWasmUrl, capacity, initialActive);
}

export function createBundledZylemRuntimeInstancedBatchSession(
	config: ZylemRuntimeInstancedBatchConfig,
): Promise<ZylemRuntimeBufferViews> {
	return createZylemRuntimeInstancedBatchSession(runtimeWasmUrl, config);
}

export function createBundledZylemRuntimeStageAdapter(): StageRuntimeAdapter {
	return createZylemRuntimeStageAdapter({ source: runtimeWasmUrl });
}
