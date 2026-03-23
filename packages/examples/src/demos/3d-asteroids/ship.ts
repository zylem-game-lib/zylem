import { Color, Matrix4, Vector3 } from 'three';
import {
	createActor,
	createSphere,
	Destructible3DBehavior,
	destroy,
	FractureOptions,
	ScreenWrapBehavior,
	type Destructible3DHandle,
} from '@zylem/game-lib';
import fisherShipGlb from '../../assets/fisher-ship.glb';
import { shipShieldShader } from './shield.shader';
import {
	BULLET_BOUNDS_X,
	BULLET_BOUNDS_Y,
	SHIP_MODEL_TILT_X,
	SHIP_MODEL_YAW_OFFSET,
	WRAP_HEIGHT,
	WRAP_WIDTH,
	getFirstMesh,
	getModelRoot,
} from './shared';

export type ShipRuntime = {
	entity: ReturnType<typeof createActor>;
	destructible: Destructible3DHandle;
	shield: ReturnType<typeof createSphere>;
	explode: (impactWorld?: Vector3) => boolean;
};

export function setEntityVisibility(
	entity: { group?: { visible: boolean } | null; mesh?: { visible: boolean } | null },
	visible: boolean,
) {
	if (entity.group) {
		entity.group.visible = visible;
	}
	if (entity.mesh) {
		entity.mesh.visible = visible;
	}
}

export function createShip(): ShipRuntime {
	const inverseMatrix = new Matrix4();
	const ship = createActor({
		name: '3d-asteroids-ship',
		models: [fisherShipGlb],
		scale: { x: 0.85, y: 0.85, z: 0.85 },
		collisionShape: 'bounds',
		collision: {
			size: { x: 0.82, y: 0.96, z: 0.72 },
			position: { x: 0, y: -0.14, z: 0 },
		},
		position: { x: 0, y: 0, z: 0 },
	});
	const shield = createSphere({
		name: '3d-asteroids-ship-shield',
		radius: 1.22,
		position: { x: 0, y: 0, z: 0 },
		material: {
			shader: shipShieldShader,
			opacity: 0.74,
		},
		collision: {
			static: true,
			sensor: true,
		},
		collisionType: 'ship-shield',
		collisionFilter: [],
	});
	const destructible = ship.use(Destructible3DBehavior, {
		fractureOptions: new FractureOptions({
			fractureMethod: 'voronoi',
			fragmentCount: 16,
			voronoiOptions: {
				mode: '3D',
			},
			seed: 41,
		}),
		collider: {
			shape: 'cuboid',
		},
		fragmentPhysics: {
			mode: 'independent',
			outwardVelocity: 3.6,
			angularVelocity: 1.9,
		},
	});
	let warmedUp = false;
	let exploded = false;

	ship.use(ScreenWrapBehavior, {
		width: WRAP_WIDTH,
		height: WRAP_HEIGHT,
	});

	ship.onSetup(({ me }) => {
		me.body?.setGravityScale(0, true);
		me.body?.setLinearDamping(0);
		me.setRotation(0, 0, 0);
		bindPrimaryMesh();
	});
	shield.onSetup(() => {
		setEntityVisibility(shield, false);
	});

	ship.listen('entity:model:loaded', () => {
		orientShipModel(ship);
		bindPrimaryMesh();
	});

	function warmupDestructible() {
		if (warmedUp || !ship.mesh) {
			return;
		}

		try {
			destructible.prebake();
			warmedUp = true;
		} catch (error) {
			console.warn('Failed to warm destructible ship', error);
		}
	}

	function bindPrimaryMesh() {
		const primaryMesh = getFirstMesh(ship.group);
		if (!primaryMesh) {
			return;
		}

		ship.mesh = primaryMesh;
		warmupDestructible();
	}

	function buildImpactOverride(impactWorld?: Vector3) {
		if (!impactWorld) {
			return undefined;
		}

		const targetRoot = ship.mesh ?? ship.group;
		if (!targetRoot) {
			return undefined;
		}

		targetRoot.updateMatrixWorld(true);
		const impactPoint = impactWorld.clone().applyMatrix4(
			inverseMatrix.copy(targetRoot.matrixWorld).invert(),
		);

		return {
			fractureMethod: 'voronoi' as const,
			fragmentCount: 16,
			voronoiOptions: {
				mode: '3D' as const,
				impactPoint,
				impactRadius: 0.58,
			},
		};
	}

	return {
		entity: ship,
		destructible,
		shield,
		explode(impactWorld?: Vector3) {
			if (exploded || !ship.mesh) {
				return false;
			}

			exploded = true;
			destructible.fracture(buildImpactOverride(impactWorld));
			return true;
		},
	};
}

export function orientShipModel(ship: ShipRuntime['entity']) {
	const modelRoot = getModelRoot(ship);
	if (!modelRoot) {
		return;
	}

	modelRoot.rotation.set(SHIP_MODEL_TILT_X, 0, SHIP_MODEL_YAW_OFFSET);
}

export function createProjectile(
	position: Vector3,
	velocity: Vector3,
	sourceUuid: string,
	onAsteroidHit: (
		otherUuid: string,
		hitPosition: Vector3,
		globals: Record<string, unknown>,
	) => boolean,
) {
	const bullet = createSphere({
		name: '3d-asteroids-projectile',
		radius: 0.14,
		position: { x: position.x, y: position.y, z: 0 },
		material: {
			color: new Color('#ffe08a'),
		},
	});

	let lifetime = 1.15;

	bullet.onSetup(({ me }) => {
		me.body?.setGravityScale(0, true);
		me.body?.setLinearDamping(0);
	});

	bullet.onUpdate(({ me, delta }) => {
		lifetime -= delta;
		me.moveXY(velocity.x, velocity.y);
		me.setPositionZ(0);

		const current = me.getPosition();
		if (
			lifetime <= 0
			|| !current
			|| Math.abs(current.x) > BULLET_BOUNDS_X
			|| Math.abs(current.y) > BULLET_BOUNDS_Y
		) {
			destroy(me);
		}
	});

	bullet.onCollision(({ entity, other, globals }) => {
		if (other.uuid === sourceUuid) {
			return;
		}

		const hitPosition = entity.getPosition();
		if (!hitPosition) {
			return;
		}

		const didHitAsteroid = onAsteroidHit(
			other.uuid,
			new Vector3(hitPosition.x, hitPosition.y, hitPosition.z ?? 0),
			globals,
		);
		if (didHitAsteroid) {
			destroy(entity, globals);
		}
	}, {
		phase: 'enter',
	});

	return bullet;
}
