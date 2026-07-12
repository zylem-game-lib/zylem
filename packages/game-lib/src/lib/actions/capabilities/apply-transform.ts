import { TransformState } from '@zylem/behaviors/core';

/**
 * Structural slice of the simulation body facade used to flush transform
 * intents. `SimulationBody` satisfies this shape.
 */
export interface TransformableBodyLike {
	linvel(): { x: number; y: number; z: number };
	translation(): { x: number; y: number; z: number };
	setLinvel(velocity: { x: number; y: number; z: number }, wakeUp: boolean): void;
	setTranslation(translation: { x: number; y: number; z: number }, wakeUp: boolean): void;
	setRotation(rotation: { x: number; y: number; z: number; w: number }, wakeUp: boolean): void;
	setAngvel(velocity: { x: number; y: number; z: number }, wakeUp: boolean): void;
}

interface ComposedAxis {
	value: number;
	touched: boolean;
}

interface ComposedVelocity {
	x: ComposedAxis;
	y: ComposedAxis;
	z: ComposedAxis;
}

interface ResolvedIntent {
	sourceId: string;
	mode: 'replace' | 'add';
	priority: number;
	x?: number;
	y?: number;
	z?: number;
}

function sortIntents(a: ResolvedIntent, b: ResolvedIntent): number {
	if (a.priority !== b.priority) return a.priority - b.priority;
	return a.sourceId.localeCompare(b.sourceId);
}

function composeAxis(
	current: number,
	intents: ResolvedIntent[],
	axis: 'x' | 'y' | 'z',
): ComposedAxis {
	let touched = false;
	let addSum = 0;
	let hasReplace = false;
	let replaceValue = current;
	let replacePriority = Number.NEGATIVE_INFINITY;

	for (const intent of intents) {
		const axisValue = intent[axis];
		if (axisValue == null) continue;
		touched = true;

		if (intent.mode === 'add') {
			addSum += axisValue;
			continue;
		}

		if (!hasReplace || intent.priority >= replacePriority) {
			hasReplace = true;
			replacePriority = intent.priority;
			replaceValue = axisValue;
		}
	}

	return {
		touched,
		value: (hasReplace ? replaceValue : 0) + addSum,
	};
}

function composeVelocity(current: { x: number; y: number; z: number }, intents: ResolvedIntent[]): ComposedVelocity {
	return {
		x: composeAxis(current.x, intents, 'x'),
		y: composeAxis(current.y, intents, 'y'),
		z: composeAxis(current.z, intents, 'z'),
	};
}

function clearVelocityChannels(store: TransformState): void {
	for (const sourceId in store.velocityChannels) {
		delete store.velocityChannels[sourceId];
	}
	store.dirty.velocityChannels = false;
}

/**
 * Collect per-source velocity intents from the store (channels + per-axis
 * fallbacks) into a single resolvable list. Shared by the Rapier and WASM
 * application paths.
 */
function collectVelocityIntents(store: TransformState): ResolvedIntent[] {
	const intents: ResolvedIntent[] = [];
	if (store.dirty.velocityChannels) {
		for (const sourceId in store.velocityChannels) {
			const intent = store.velocityChannels[sourceId];
			intents.push({
				sourceId,
				mode: intent.mode ?? 'replace',
				priority: intent.priority ?? 0,
				x: intent.x,
				y: intent.y,
				z: intent.z,
			});
		}
	}

	if (store.dirty.velocityX || store.dirty.velocityY || store.dirty.velocityZ) {
		intents.push({
			sourceId: '__legacy_per_axis__',
			mode: 'replace',
			priority: -100,
			x: store.dirty.velocityX ? store.velocity.x : undefined,
			y: store.dirty.velocityY ? store.velocity.y : undefined,
			z: store.dirty.velocityZ ? store.velocity.z : undefined,
		});
	}

	return intents;
}

function resetTransformDirty(store: TransformState): void {
	store.dirty.position = false;
	store.dirty.rotation = false;
	store.dirty.velocityX = false;
	store.dirty.velocityY = false;
	store.dirty.velocityZ = false;
	clearVelocityChannels(store);
	store.dirty.angularVelocity = false;
}

/**
 * Apply accumulated transform intents through the WASM runtime's FFI setters.
 * Mirrors the Rapier branch of {@link applyTransformChanges}: velocity is
 * composed from intents, rotation/angular-velocity are absolute, and position
 * is treated as a delta against the current runtime pose.
 */
function applyTransformChangesViaWasm(
	runtime: RuntimeTransformTarget,
	slot: number,
	store: TransformState,
): void {
	const hasPosition = store.dirty.position;
	const hasRotation = store.dirty.rotation;
	const hasAngularVelocity = store.dirty.angularVelocity;
	const hasPerAxis = store.dirty.velocityX || store.dirty.velocityY || store.dirty.velocityZ;
	const hasChannels = store.dirty.velocityChannels;

	if (!hasPosition && !hasRotation && !hasAngularVelocity && !hasPerAxis && !hasChannels) {
		return;
	}

	const intents = collectVelocityIntents(store);
	if (intents.length > 0) {
		const currentVel = runtime.getLinearVelocity(slot) ?? [0, 0, 0];
		const current = { x: currentVel[0], y: currentVel[1], z: currentVel[2] };
		if (intents.length > 1) {
			intents.sort(sortIntents);
		}
		const composed = composeVelocity(current, intents);
		runtime.setLinearVelocity(
			slot,
			composed.x.touched ? composed.x.value : current.x,
			composed.y.touched ? composed.y.value : current.y,
			composed.z.touched ? composed.z.value : current.z,
		);
	}

	if (hasRotation) {
		const r = store.rotation as { x: number; y: number; z: number; w: number };
		runtime.setRotation(slot, r.x, r.y, r.z, r.w);
	}

	if (hasAngularVelocity) {
		const a = store.angularVelocity as { x: number; y: number; z: number };
		runtime.setAngularVelocity(slot, a.x, a.y, a.z);
	}

	if (hasPosition) {
		const pose = runtime.getPose(slot);
		if (pose) {
			runtime.setPosition(
				slot,
				pose.position[0] + store.position.x,
				pose.position[1] + store.position.y,
				pose.position[2] + store.position.z,
			);
		}
	}

	resetTransformDirty(store);
}

/**
 * Minimal slice of the WASM stage runtime used to apply transform intents via
 * FFI. Kept structural so this module need not import the full runtime type.
 */
export interface RuntimeTransformTarget {
	getLinearVelocity(slot: number, out?: [number, number, number]): [number, number, number] | null;
	setLinearVelocity(slot: number, x: number, y: number, z: number): boolean;
	setAngularVelocity(slot: number, x: number, y: number, z: number): boolean;
	setRotation(slot: number, x: number, y: number, z: number, w: number): boolean;
	setPosition(slot: number, x: number, y: number, z: number): boolean;
	getPose(slot: number): { position: [number, number, number]; rotation: [number, number, number, number] } | null;
}

/**
 * Entity that can have transformations applied from a store.
 *
 * When `body` (the simulation body facade) is present the intents flush
 * through it; otherwise, if the entity carries a live WASM slot
 * (`runtimeHandle` >= 0 + `wasmStageRef`), they flush through the runtime's
 * FFI setters directly.
 */
export interface TransformableEntity {
	body: TransformableBodyLike | null;
	transformStore?: TransformState;
	/** Live WASM slot handle, or -1 when not runtime-attached. */
	runtimeHandle?: number;
	/** Runtime adapter the entity is attached to, if any. */
	wasmStageRef?: RuntimeTransformTarget | null;
}

/**
 * Apply accumulated transformations from the store to the physics body.
 * 
 * This is called automatically after onUpdate() callbacks complete,
 * flushing all pending transformations to the physics engine in a single batch.
 * 
 * Flow:
 * 1. Check dirty flags to see what changed
 * 2. Apply changes to RigidBody
 * 3. Reset store for next frame
 * 
 * @param entity Entity with physics body and transform store
 * @param store Transform store containing pending changes
 */
export function applyTransformChanges(
	entity: TransformableEntity,
	store: TransformState
): void {
	if (!entity.body) {
		// No body facade — route through the WASM runtime directly when the
		// entity carries a live slot. Falls through to a no-op otherwise.
		if (entity.wasmStageRef && (entity.runtimeHandle ?? -1) >= 0) {
			applyTransformChangesViaWasm(entity.wasmStageRef, entity.runtimeHandle!, store);
		}
		return;
	}

	const hasPosition = store.dirty.position;
	const hasRotation = store.dirty.rotation;
	const hasAngularVelocity = store.dirty.angularVelocity;
	const hasPerAxis = store.dirty.velocityX || store.dirty.velocityY || store.dirty.velocityZ;
	const hasChannels = store.dirty.velocityChannels;

	if (!hasPosition && !hasRotation && !hasAngularVelocity && !hasPerAxis && !hasChannels) {
		return;
	}

	const intents = collectVelocityIntents(store);

	if (intents.length > 0) {
		const current = entity.body.linvel();
		if (intents.length > 1) {
			intents.sort(sortIntents);
		}
		const composed = composeVelocity(current, intents);

		entity.body.setLinvel(
			{
				x: composed.x.touched ? composed.x.value : current.x,
				y: composed.y.touched ? composed.y.value : current.y,
				z: composed.z.touched ? composed.z.value : current.z,
			},
			true,
		);
	}

	if (hasRotation) {
		entity.body.setRotation(store.rotation, true);
	}

	if (hasAngularVelocity) {
		entity.body.setAngvel(store.angularVelocity, true);
	}

	if (hasPosition) {
		const current = entity.body.translation();
		entity.body.setTranslation(
			{
				x: current.x + store.position.x,
				y: current.y + store.position.y,
				z: current.z + store.position.z,
			},
			true,
		);
	}

	resetTransformDirty(store);
}
