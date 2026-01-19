/**
 * Thruster-specific ECS Components
 * 
 * These components are specific to the thruster movement system.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ThrusterMovementComponent (capability / hardware spec)
// Defines the thrust capabilities of an entity
// ─────────────────────────────────────────────────────────────────────────────

export interface ThrusterMovementComponent {
	/** Linear thrust force in Newtons (or scaled units) */
	linearThrust: number;
	/** Angular thrust torque scalar */
	angularThrust: number;
	/** Optional linear damping override */
	linearDamping?: number;
	/** Optional angular damping override */
	angularDamping?: number;
}

export function createThrusterMovementComponent(
	linearThrust: number,
	angularThrust: number,
	options?: { linearDamping?: number; angularDamping?: number }
): ThrusterMovementComponent {
	return {
		linearThrust,
		angularThrust,
		linearDamping: options?.linearDamping,
		angularDamping: options?.angularDamping,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// ThrusterInputComponent (intent)
// Written by: Player controller, AI controller, FSM adapter
// Read by: ThrusterMovementBehavior
// ─────────────────────────────────────────────────────────────────────────────

export interface ThrusterInputComponent {
	/** Forward thrust intent: 0..1 */
	thrust: number;
	/** Rotation intent: -1..1 */
	rotate: number;
}

export function createThrusterInputComponent(): ThrusterInputComponent {
	return {
		thrust: 0,
		rotate: 0,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// ThrusterStateComponent (optional but useful)
// Useful for: damage, EMP, overheating, UI feedback
// ─────────────────────────────────────────────────────────────────────────────

export interface ThrusterStateComponent {
	/** Whether the thruster is enabled */
	enabled: boolean;
	/** Current thrust after FSM/gating */
	currentThrust: number;
}

export function createThrusterStateComponent(): ThrusterStateComponent {
	return {
		enabled: true,
		currentThrust: 0,
	};
}
