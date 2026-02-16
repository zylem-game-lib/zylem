export { PhysicsProxy } from './physics-proxy';
export { PhysicsBodyHandle } from './physics-body-handle';
export { serializeBodyDesc, serializeColliderDesc, serializeCharacterController } from './serialize-descriptors';
export type {
	PhysicsCommand,
	PhysicsEvent,
	PhysicsStepResultEvent,
	PhysicsReadyEvent,
	PhysicsErrorEvent,
	BodyCommand,
	CollisionPair,
	SerializableBodyDesc,
	SerializableColliderDesc,
	SerializableCharacterController,
	SerializableBodyType,
	ColliderShapeKind,
} from './physics-protocol';
export { FLOATS_PER_BODY, TransformOffset } from './physics-protocol';
