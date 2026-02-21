import { TransformState, VelocityIntentMode } from './transform-store';

export interface VelocityIntentOptions {
	mode?: VelocityIntentMode;
	priority?: number;
}

export interface VelocityIntentVector {
	x?: number;
	y?: number;
	z?: number;
}

export function setVelocityIntent(
	store: TransformState,
	sourceId: string,
	vector: VelocityIntentVector,
	options: VelocityIntentOptions = {},
): void {
	const prev = store.velocityChannels[sourceId];
	const mode = options.mode ?? prev?.mode ?? 'replace';
	const priority = options.priority ?? prev?.priority ?? 0;
	const isAdditiveMerge = mode === 'add' && prev?.mode === 'add';

	const x =
		vector.x == null
			? prev?.x
			: isAdditiveMerge
				? (prev?.x ?? 0) + vector.x
				: vector.x;
	const y =
		vector.y == null
			? prev?.y
			: isAdditiveMerge
				? (prev?.y ?? 0) + vector.y
				: vector.y;
	const z =
		vector.z == null
			? prev?.z
			: isAdditiveMerge
				? (prev?.z ?? 0) + vector.z
				: vector.z;

	store.velocityChannels[sourceId] = {
		x,
		y,
		z,
		mode,
		priority,
	};
	store.dirty.velocityChannels = true;
}

export function clearVelocityIntent(store: TransformState, sourceId: string): void {
	if (!(sourceId in store.velocityChannels)) return;
	delete store.velocityChannels[sourceId];
	store.dirty.velocityChannels = true;
}
