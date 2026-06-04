import type { Vector3 } from 'three';

/**
 * Structural contract for the engine `FirstPersonPerspective`.
 *
 * Behaviors drive a perspective (yaw/pitch accumulation + eye position) without
 * depending on the concrete camera implementation in `@zylem/game-lib`. The real
 * `FirstPersonPerspective` class is structurally assignable to this interface.
 */
export interface FirstPersonPerspective {
	/** Fallback / eye position. Mutated directly by the first-person behavior. */
	initialPosition?: Vector3;
	/** Current yaw in radians. */
	readonly yaw: number;
	/** Current pitch in radians. */
	readonly pitch: number;
	/** Accumulate yaw and pitch deltas. */
	look(deltaYaw: number, deltaPitch: number): void;
	/** Set absolute yaw and pitch. */
	setLook?(yaw: number, pitch: number): void;
}
