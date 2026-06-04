/**
 * First Person Controller ECS Components
 *
 * Components for first-person movement and camera control:
 * - Movement configuration (walk/run speed, sensitivity, eye height)
 * - Input intent (WASD movement + mouse look deltas)
 * - Runtime state (yaw, pitch, speed)
 */

// ─────────────────────────────────────────────────────────────────────────────
// FirstPersonMovementComponent (capability / configuration)
// Defines movement capabilities and look parameters
// ─────────────────────────────────────────────────────────────────────────────

export interface FirstPersonMovementComponent {
	/** Base walking speed (units/sec) */
	walkSpeed: number;
	/** Sprint/run speed (units/sec) */
	runSpeed: number;
	/** Look sensitivity multiplier applied to raw input deltas */
	lookSensitivity: number;
	/** Vertical offset above entity position for eye/camera placement */
	eyeHeight: number;
}

export function createFirstPersonMovementComponent(
	options: Partial<FirstPersonMovementComponent> = {},
): FirstPersonMovementComponent {
	return {
		walkSpeed: options.walkSpeed ?? 8,
		runSpeed: options.runSpeed ?? 16,
		lookSensitivity: options.lookSensitivity ?? 2,
		eyeHeight: options.eyeHeight ?? 1.7,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// FirstPersonInputComponent (intent)
// Written by: Player controller (game.onUpdate / entity.onUpdate)
// Read by: FirstPersonControllerBehavior
// ─────────────────────────────────────────────────────────────────────────────

export interface FirstPersonInputComponent {
	/** Horizontal movement input (-1 to 1, strafe) */
	moveX: number;
	/** Forward/backward movement input (-1 to 1) */
	moveZ: number;
	/** Horizontal look delta (mouse/stick, raw value before sensitivity) */
	lookX: number;
	/** Vertical look delta (mouse/stick, raw value before sensitivity) */
	lookY: number;
	/** Sprint button held */
	sprint: boolean;
}

export function createFirstPersonInputComponent(): FirstPersonInputComponent {
	return {
		moveX: 0,
		moveZ: 0,
		lookX: 0,
		lookY: 0,
		sprint: false,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// FirstPersonStateComponent (runtime state)
// Tracks the current state of the first-person entity
// ─────────────────────────────────────────────────────────────────────────────

export interface FirstPersonStateComponent {
	/** Current yaw in radians */
	yaw: number;
	/** Current pitch in radians */
	pitch: number;
	/** Current movement speed being applied */
	currentSpeed: number;
}

export function createFirstPersonStateComponent(): FirstPersonStateComponent {
	return {
		yaw: 0,
		pitch: 0,
		currentSpeed: 0,
	};
}
