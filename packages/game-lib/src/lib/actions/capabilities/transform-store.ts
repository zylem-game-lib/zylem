import { proxy } from 'valtio';

export type VelocityIntentMode = 'replace' | 'add';

export interface VelocityIntent {
	x?: number;
	y?: number;
	z?: number;
	mode: VelocityIntentMode;
	priority?: number;
}

/**
 * Transform state managed by Valtio for batched physics updates.
 * 
 * This store accumulates transformation intents during the frame,
 * then applies them all at once after onUpdate() callbacks complete.
 * 
 * Design decisions:
 * - Position: Accumulated deltas (additive)
 * - Rotation: Last value wins (replacement)
 * - Velocity: Accumulated deltas (additive)
 * - Angular velocity: Accumulated deltas (additive)
 */
export interface TransformState {
	/** Position deltas to be applied (accumulated) */
	position: { x: number; y: number; z: number };
	
	/** Rotation quaternion (last value wins) */
	rotation: { x: number; y: number; z: number; w: number };
	
	/** Linear velocity (accumulated) */
	velocity: { x: number; y: number; z: number };
	
	/** Angular velocity (accumulated) */
	angularVelocity: { x: number; y: number; z: number };

	/** Per-source velocity intents composed once per frame */
	velocityChannels: Record<string, VelocityIntent>;
	
	/** Dirty flags to track what needs to be applied */
	dirty: {
		position: boolean;
		rotation: boolean;
		/** @deprecated Use per-axis velocityX/Y/Z flags for new code */
		velocity: boolean;
		velocityX: boolean;
		velocityY: boolean;
		velocityZ: boolean;
		velocityChannels: boolean;
		angularVelocity: boolean;
	};
}

/**
 * Create a new transform store with optional initial values.
 * The store is a Valtio proxy, making it reactive for debugging/visualization.
 * 
 * @param initial Optional initial state values
 * @returns Reactive transform state
 */
export function createTransformStore(initial?: Partial<TransformState>): TransformState {
	const defaultState: TransformState = {
		position: { x: 0, y: 0, z: 0 },
		rotation: { x: 0, y: 0, z: 0, w: 1 },
		velocity: { x: 0, y: 0, z: 0 },
		angularVelocity: { x: 0, y: 0, z: 0 },
		velocityChannels: {},
		dirty: {
			position: false,
			rotation: false,
			velocity: false,
			velocityX: false,
			velocityY: false,
			velocityZ: false,
			velocityChannels: false,
			angularVelocity: false,
		},
	};

	return proxy({
		...defaultState,
		...initial,
		// Ensure dirty flags are properly initialized even if partial initial state
		dirty: {
			...defaultState.dirty,
			...initial?.dirty,
		},
	});
}

/**
 * Reset a transform store to its initial clean state.
 * Called after applying changes to prepare for the next frame.
 * 
 * @param store The transform store to reset
 */
export function resetTransformStore(store: TransformState): void {
	// Reset position deltas
	store.position.x = 0;
	store.position.y = 0;
	store.position.z = 0;

	// Reset rotation to identity quaternion
	store.rotation.x = 0;
	store.rotation.y = 0;
	store.rotation.z = 0;
	store.rotation.w = 1;

	// Reset velocity
	store.velocity.x = 0;
	store.velocity.y = 0;
	store.velocity.z = 0;

	// Reset angular velocity
	store.angularVelocity.x = 0;
	store.angularVelocity.y = 0;
	store.angularVelocity.z = 0;

	// Reset per-source velocity intents
	for (const sourceId of Object.keys(store.velocityChannels)) {
		delete store.velocityChannels[sourceId];
	}

	// Clear all dirty flags
	store.dirty.position = false;
	store.dirty.rotation = false;
	store.dirty.velocity = false;
	store.dirty.velocityX = false;
	store.dirty.velocityY = false;
	store.dirty.velocityZ = false;
	store.dirty.velocityChannels = false;
	store.dirty.angularVelocity = false;
}
