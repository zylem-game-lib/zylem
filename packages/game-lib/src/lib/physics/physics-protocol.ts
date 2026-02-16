/**
 * Message protocol for communication between the main thread and the
 * physics Web Worker.
 *
 * Data flows in two directions:
 *   Main → Worker: {@link PhysicsCommand} (init, entity CRUD, per-frame step)
 *   Worker → Main: {@link PhysicsEvent}   (ready, step results, errors)
 *
 * All types are plain JSON-serializable objects so they can cross the
 * postMessage boundary without structured-clone issues.
 */

// ─── Serializable Descriptor Types ─────────────────────────────────────────

/** Rigid body type mirroring Rapier's RigidBodyType enum values. */
export type SerializableBodyType = 'dynamic' | 'fixed' | 'kinematicPositionBased' | 'kinematicVelocityBased';

/**
 * Plain-object representation of a Rapier RigidBodyDesc.
 * Created on the main thread and reconstructed in the worker.
 */
export interface SerializableBodyDesc {
	type: SerializableBodyType;
	translation: [number, number, number];
	gravityScale: number;
	canSleep: boolean;
	ccdEnabled: boolean;
	lockTranslations?: boolean;
	lockRotations?: boolean;
}

/** Collider shape kind. Matches the factory functions in collision-factories. */
export type ColliderShapeKind =
	| 'cuboid'
	| 'ball'
	| 'capsule'
	| 'cone'
	| 'cylinder'
	| 'heightfield';

/**
 * Plain-object representation of a Rapier ColliderDesc.
 * Shape-specific dimensions are stored in {@link dimensions}.
 */
export interface SerializableColliderDesc {
	shape: ColliderShapeKind;
	/** Shape-specific numeric dimensions (e.g. halfExtents, radius, halfHeight). */
	dimensions: number[];
	/** Collider offset translation relative to the body. */
	translation?: [number, number, number];
	sensor?: boolean;
	collisionGroups?: number;
	activeCollisionTypes?: number;
	/** For heightfield: number of rows and columns. */
	heightfieldMeta?: { nrows: number; ncols: number };
}

/** Describes a character controller to be created alongside the body. */
export interface SerializableCharacterController {
	offset: number;
	maxSlopeClimbAngle: number;
	minSlopeSlideAngle: number;
	snapToGroundDistance: number;
	slideEnabled: boolean;
	applyImpulsesToDynamic: boolean;
	characterMass: number;
}

// ─── Per-Body Commands (batched inside a step) ─────────────────────────────

export type BodyCommand =
	| { kind: 'setLinvel'; uuid: string; x: number; y: number; z: number }
	| { kind: 'setAngvel'; uuid: string; x: number; y: number; z: number }
	| { kind: 'setTranslation'; uuid: string; x: number; y: number; z: number }
	| { kind: 'setRotation'; uuid: string; x: number; y: number; z: number; w: number }
	| { kind: 'applyImpulse'; uuid: string; x: number; y: number; z: number }
	| { kind: 'applyTorqueImpulse'; uuid: string; x: number; y: number; z: number }
	| { kind: 'lockTranslations'; uuid: string; locked: boolean }
	| { kind: 'lockRotations'; uuid: string; locked: boolean }
	| { kind: 'addTranslation'; uuid: string; dx: number; dy: number; dz: number }
	| { kind: 'setLinearDamping'; uuid: string; damping: number }
	| { kind: 'setGravityScale'; uuid: string; scale: number };

// ─── Main → Worker Commands ────────────────────────────────────────────────

export type PhysicsCommand =
	| PhysicsInitCommand
	| PhysicsAddBodyCommand
	| PhysicsRemoveBodyCommand
	| PhysicsStepCommand
	| PhysicsDisposeCommand;

export interface PhysicsInitCommand {
	type: 'init';
	gravity: [number, number, number];
	physicsRate: number;
}

export interface PhysicsAddBodyCommand {
	type: 'addBody';
	uuid: string;
	body: SerializableBodyDesc;
	colliders: SerializableColliderDesc[];
	characterController?: SerializableCharacterController;
}

export interface PhysicsRemoveBodyCommand {
	type: 'removeBody';
	uuid: string;
}

export interface PhysicsStepCommand {
	type: 'step';
	delta: number;
	commands: BodyCommand[];
}

export interface PhysicsDisposeCommand {
	type: 'dispose';
}

// ─── Worker → Main Events ──────────────────────────────────────────────────

export type PhysicsEvent =
	| PhysicsReadyEvent
	| PhysicsStepResultEvent
	| PhysicsErrorEvent;

export interface PhysicsReadyEvent {
	type: 'ready';
}

/**
 * Result of a physics step sent from the worker each frame.
 *
 * `transforms` is a flat Float32Array with 13 floats per body:
 *   [posX, posY, posZ, rotX, rotY, rotZ, rotW, linvelX, linvelY, linvelZ, angvelX, angvelY, angvelZ]
 *
 * The order matches {@link bodyOrder} — an array of UUIDs in the same
 * index order as the transform buffer.
 */
export interface PhysicsStepResultEvent {
	type: 'stepResult';
	/** Flat buffer: 13 floats per body (pos3, rot4, linvel3, angvel3). */
	transforms: Float32Array;
	/** UUID order matching the transforms buffer. */
	bodyOrder: string[];
	/** Collision pairs detected this frame. */
	collisions: CollisionPair[];
	/** Interpolation alpha for rendering (0..1). */
	interpolationAlpha: number;
}

export interface PhysicsErrorEvent {
	type: 'error';
	message: string;
}

/** A collision pair detected during the physics step. */
export interface CollisionPair {
	uuidA: string;
	uuidB: string;
	contactType: 'contact' | 'intersection';
}

// ─── Transform Buffer Layout ───────────────────────────────────────────────

/** Number of floats per body in the transforms buffer. */
export const FLOATS_PER_BODY = 13;

/** Offsets into the per-body segment of the transforms buffer. */
export const TransformOffset = {
	POS_X: 0,
	POS_Y: 1,
	POS_Z: 2,
	ROT_X: 3,
	ROT_Y: 4,
	ROT_Z: 5,
	ROT_W: 6,
	LINVEL_X: 7,
	LINVEL_Y: 8,
	LINVEL_Z: 9,
	ANGVEL_X: 10,
	ANGVEL_Y: 11,
	ANGVEL_Z: 12,
} as const;
