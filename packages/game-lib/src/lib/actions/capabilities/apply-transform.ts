import { RigidBody } from '@dimforge/rapier3d-compat';
import { TransformState } from './transform-store';

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
 * Entity that can have transformations applied from a store
 */
export interface TransformableEntity {
	body: RigidBody | null;
	transformStore?: TransformState;
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
	if (!entity.body) return;

	const hasPosition = store.dirty.position;
	const hasRotation = store.dirty.rotation;
	const hasAngularVelocity = store.dirty.angularVelocity;
	const hasPerAxis = store.dirty.velocityX || store.dirty.velocityY || store.dirty.velocityZ;
	const hasLegacyVelocity = store.dirty.velocity;
	const hasChannels = store.dirty.velocityChannels;

	if (!hasPosition && !hasRotation && !hasAngularVelocity && !hasPerAxis && !hasLegacyVelocity && !hasChannels) {
		return;
	}

	const intents: ResolvedIntent[] = [];
	if (hasChannels) {
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

	// Legacy fallback mapped into the same composition pipeline.
	if (hasLegacyVelocity) {
		intents.push({
			sourceId: '__legacy_velocity__',
			mode: 'replace',
			priority: -100,
			x: store.velocity.x,
			y: store.velocity.y,
			z: store.velocity.z,
		});
	} else if (hasPerAxis) {
		intents.push({
			sourceId: '__legacy_per_axis__',
			mode: 'replace',
			priority: -100,
			x: store.dirty.velocityX ? store.velocity.x : undefined,
			y: store.dirty.velocityY ? store.velocity.y : undefined,
			z: store.dirty.velocityZ ? store.velocity.z : undefined,
		});
	}

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

	// Reset dirty flags for next frame
	store.dirty.position = false;
	store.dirty.rotation = false;
	store.dirty.velocity = false;
	store.dirty.velocityX = false;
	store.dirty.velocityY = false;
	store.dirty.velocityZ = false;
	clearVelocityChannels(store);
	store.dirty.angularVelocity = false;
}
