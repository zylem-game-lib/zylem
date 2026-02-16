/**
 * Physics Web Worker.
 *
 * Owns the Rapier world and runs the fixed-timestep simulation loop.
 * Communicates with the main thread via {@link PhysicsCommand} /
 * {@link PhysicsEvent} messages defined in physics-protocol.ts.
 *
 * Lifecycle:
 *   1. Main sends `init` → worker creates Rapier world.
 *   2. Main sends `addBody` / `removeBody` to manage entities.
 *   3. Main sends `step` each frame → worker runs accumulator,
 *      collects transforms + collisions, replies with `stepResult`.
 *   4. Main sends `dispose` → worker frees resources.
 */

import RAPIER, { RigidBody, RigidBodyDesc, RigidBodyType, ColliderDesc, World, ActiveCollisionTypes } from '@dimforge/rapier3d-compat';
import type {
	PhysicsCommand,
	PhysicsStepResultEvent,
	BodyCommand,
	SerializableBodyDesc,
	SerializableColliderDesc,
	SerializableCharacterController,
	CollisionPair,
} from './physics-protocol';
import { FLOATS_PER_BODY, TransformOffset } from './physics-protocol';

// ─── Internal State ────────────────────────────────────────────────────────

let world: World | null = null;
let fixedTimestep = 1 / 60;
let accumulator = 0;
const MAX_STEPS_PER_FRAME = 5;

/** Map from entity UUID to Rapier RigidBody handle. */
const bodyMap = new Map<string, RigidBody>();

/** Ordered list of UUIDs for deterministic transform packing. */
let bodyOrder: string[] = [];

/** Character controllers keyed by entity UUID. */
const controllerMap = new Map<string, RAPIER.KinematicCharacterController>();

// ─── Message Handler ───────────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<PhysicsCommand>) => {
	const cmd = e.data;
	switch (cmd.type) {
		case 'init':
			handleInit(cmd.gravity, cmd.physicsRate);
			break;
		case 'addBody':
			handleAddBody(cmd.uuid, cmd.body, cmd.colliders, cmd.characterController);
			break;
		case 'removeBody':
			handleRemoveBody(cmd.uuid);
			break;
		case 'step':
			handleStep(cmd.delta, cmd.commands);
			break;
		case 'dispose':
			handleDispose();
			break;
	}
};

// ─── Command Handlers ──────────────────────────────────────────────────────

async function handleInit(gravity: [number, number, number], physicsRate: number) {
	try {
		await RAPIER.init();
		world = new RAPIER.World({ x: gravity[0], y: gravity[1], z: gravity[2] });
		fixedTimestep = 1 / physicsRate;
		world.integrationParameters.dt = fixedTimestep;
		accumulator = 0;
		(self as unknown as Worker).postMessage({ type: 'ready' });
	} catch (err) {
		(self as unknown as Worker).postMessage({
			type: 'error',
			message: `Failed to init physics worker: ${err}`,
		});
	}
}

function handleAddBody(
	uuid: string,
	desc: SerializableBodyDesc,
	colliderDescs: SerializableColliderDesc[],
	charCtrl?: SerializableCharacterController,
) {
	if (!world) return;

	const bodyDesc = reconstructBodyDesc(desc);
	const body = world.createRigidBody(bodyDesc);
	body.userData = { uuid };

	for (const cd of colliderDescs) {
		const colliderDesc = reconstructColliderDesc(cd);
		world.createCollider(colliderDesc, body);
	}

	if (charCtrl) {
		const controller = world.createCharacterController(charCtrl.offset);
		controller.setMaxSlopeClimbAngle(charCtrl.maxSlopeClimbAngle);
		controller.setMinSlopeSlideAngle(charCtrl.minSlopeSlideAngle);
		controller.enableSnapToGround(charCtrl.snapToGroundDistance);
		controller.setSlideEnabled(charCtrl.slideEnabled);
		controller.setApplyImpulsesToDynamicBodies(charCtrl.applyImpulsesToDynamic);
		controller.setCharacterMass(charCtrl.characterMass);
		controllerMap.set(uuid, controller);
		body.lockRotations(true, true);
	}

	bodyMap.set(uuid, body);
	bodyOrder.push(uuid);
}

function handleRemoveBody(uuid: string) {
	if (!world) return;

	const ctrl = controllerMap.get(uuid);
	if (ctrl) {
		try { ctrl.free(); } catch { /* noop */ }
		controllerMap.delete(uuid);
	}

	const body = bodyMap.get(uuid);
	if (body) {
		world.removeRigidBody(body);
		bodyMap.delete(uuid);
		bodyOrder = bodyOrder.filter((id) => id !== uuid);
	}
}

function handleStep(delta: number, commands: BodyCommand[]) {
	if (!world) return;

	applyBodyCommands(commands);

	accumulator += delta;
	const maxAccum = fixedTimestep * MAX_STEPS_PER_FRAME;
	accumulator = Math.min(accumulator, maxAccum);

	const collisions: CollisionPair[] = [];

	while (accumulator >= fixedTimestep) {
		world.step();
		collectCollisions(collisions);
		accumulator -= fixedTimestep;
	}

	const interpolationAlpha = accumulator / fixedTimestep;

	const transforms = packTransforms();

	const result: PhysicsStepResultEvent = {
		type: 'stepResult',
		transforms,
		bodyOrder: [...bodyOrder],
		collisions,
		interpolationAlpha,
	};

	(self as unknown as Worker).postMessage(result, [transforms.buffer]);
}

function handleDispose() {
	for (const ctrl of controllerMap.values()) {
		try { ctrl.free(); } catch { /* noop */ }
	}
	controllerMap.clear();
	bodyMap.clear();
	bodyOrder = [];

	if (world) {
		try { world.free(); } catch { /* noop */ }
		world = null;
	}
}

// ─── Body Command Application ──────────────────────────────────────────────

function applyBodyCommands(commands: BodyCommand[]) {
	for (const cmd of commands) {
		const body = bodyMap.get(cmd.uuid);
		if (!body) continue;

		switch (cmd.kind) {
			case 'setLinvel':
				body.setLinvel({ x: cmd.x, y: cmd.y, z: cmd.z }, true);
				break;
			case 'setAngvel':
				body.setAngvel({ x: cmd.x, y: cmd.y, z: cmd.z }, true);
				break;
			case 'setTranslation':
				body.setTranslation({ x: cmd.x, y: cmd.y, z: cmd.z }, true);
				break;
			case 'setRotation':
				body.setRotation({ x: cmd.x, y: cmd.y, z: cmd.z, w: cmd.w }, true);
				break;
			case 'applyImpulse':
				body.applyImpulse({ x: cmd.x, y: cmd.y, z: cmd.z }, true);
				break;
			case 'applyTorqueImpulse':
				body.applyTorqueImpulse({ x: cmd.x, y: cmd.y, z: cmd.z }, true);
				break;
			case 'lockTranslations':
				body.lockTranslations(cmd.locked, true);
				break;
			case 'lockRotations':
				body.lockRotations(cmd.locked, true);
				break;
			case 'addTranslation': {
				const t = body.translation();
				body.setTranslation({ x: t.x + cmd.dx, y: t.y + cmd.dy, z: t.z + cmd.dz }, true);
				break;
			}
			case 'setLinearDamping':
				body.setLinearDamping(cmd.damping);
				break;
			case 'setGravityScale':
				body.setGravityScale(cmd.scale, true);
				break;
		}
	}
}

// ─── Collision Collection ──────────────────────────────────────────────────

function collectCollisions(out: CollisionPair[]) {
	if (!world) return;

	for (const [uuid, body] of bodyMap) {
		const collider = body.collider(0);
		if (!collider) continue;

		world.contactsWith(collider, (otherCollider) => {
			const otherBody = otherCollider.parent();
			if (!otherBody) return;
			const otherUuid = (otherBody.userData as any)?.uuid as string | undefined;
			if (otherUuid) {
				out.push({ uuidA: uuid, uuidB: otherUuid, contactType: 'contact' });
			}
		});

		world.intersectionsWith(collider, (otherCollider) => {
			const otherBody = otherCollider.parent();
			if (!otherBody) return;
			const otherUuid = (otherBody.userData as any)?.uuid as string | undefined;
			if (otherUuid) {
				out.push({ uuidA: uuid, uuidB: otherUuid, contactType: 'intersection' });
			}
		});
	}
}

// ─── Transform Packing ─────────────────────────────────────────────────────

function packTransforms(): Float32Array {
	const buf = new Float32Array(bodyOrder.length * FLOATS_PER_BODY);

	for (let i = 0; i < bodyOrder.length; i++) {
		const body = bodyMap.get(bodyOrder[i]);
		if (!body) continue;

		const offset = i * FLOATS_PER_BODY;
		const pos = body.translation();
		const rot = body.rotation();
		const linvel = body.linvel();
		const angvel = body.angvel();

		buf[offset + TransformOffset.POS_X] = pos.x;
		buf[offset + TransformOffset.POS_Y] = pos.y;
		buf[offset + TransformOffset.POS_Z] = pos.z;

		buf[offset + TransformOffset.ROT_X] = rot.x;
		buf[offset + TransformOffset.ROT_Y] = rot.y;
		buf[offset + TransformOffset.ROT_Z] = rot.z;
		buf[offset + TransformOffset.ROT_W] = rot.w;

		buf[offset + TransformOffset.LINVEL_X] = linvel.x;
		buf[offset + TransformOffset.LINVEL_Y] = linvel.y;
		buf[offset + TransformOffset.LINVEL_Z] = linvel.z;

		buf[offset + TransformOffset.ANGVEL_X] = angvel.x;
		buf[offset + TransformOffset.ANGVEL_Y] = angvel.y;
		buf[offset + TransformOffset.ANGVEL_Z] = angvel.z;
	}

	return buf;
}

// ─── Descriptor Reconstruction ─────────────────────────────────────────────

function reconstructBodyDesc(desc: SerializableBodyDesc): RigidBodyDesc {
	const typeMap: Record<string, RigidBodyType> = {
		dynamic: RigidBodyType.Dynamic,
		fixed: RigidBodyType.Fixed,
		kinematicPositionBased: RigidBodyType.KinematicPositionBased,
		kinematicVelocityBased: RigidBodyType.KinematicVelocityBased,
	};

	const bodyDesc = new RigidBodyDesc(typeMap[desc.type] ?? RigidBodyType.Dynamic)
		.setTranslation(desc.translation[0], desc.translation[1], desc.translation[2])
		.setGravityScale(desc.gravityScale)
		.setCanSleep(desc.canSleep)
		.setCcdEnabled(desc.ccdEnabled);

	return bodyDesc;
}

function reconstructColliderDesc(desc: SerializableColliderDesc): ColliderDesc {
	let colliderDesc: ColliderDesc;
	const d = desc.dimensions;

	switch (desc.shape) {
		case 'cuboid':
			colliderDesc = ColliderDesc.cuboid(d[0], d[1], d[2]);
			break;
		case 'ball':
			colliderDesc = ColliderDesc.ball(d[0]);
			break;
		case 'capsule':
			colliderDesc = ColliderDesc.capsule(d[0], d[1]);
			break;
		case 'cone':
			colliderDesc = ColliderDesc.cone(d[0], d[1]);
			break;
		case 'cylinder':
			colliderDesc = ColliderDesc.cylinder(d[0], d[1]);
			break;
		case 'heightfield': {
			const meta = desc.heightfieldMeta!;
			const heights = new Float32Array(d);
			colliderDesc = ColliderDesc.heightfield(meta.nrows, meta.ncols, heights, { x: 1, y: 1, z: 1 });
			break;
		}
		default:
			colliderDesc = ColliderDesc.cuboid(0.5, 0.5, 0.5);
	}

	if (desc.translation) {
		colliderDesc.setTranslation(desc.translation[0], desc.translation[1], desc.translation[2]);
	}

	if (desc.sensor) {
		colliderDesc.setSensor(true);
	}

	if (desc.collisionGroups !== undefined) {
		colliderDesc.setCollisionGroups(desc.collisionGroups);
	}

	if (desc.activeCollisionTypes !== undefined) {
		colliderDesc.activeCollisionTypes = desc.activeCollisionTypes as ActiveCollisionTypes;
	}

	return colliderDesc;
}
