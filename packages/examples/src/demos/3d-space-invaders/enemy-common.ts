import {
	createActor,
	Destructible3DBehavior,
	FractureOptions,
	type Destructible3DHandle,
} from '@zylem/game-lib';
import { destructiblePrebakeWorkerUrl } from '../lib/destructible-prebake-worker-url';
import { Matrix4, Vector3 } from 'three';
import {
	type EnemyKind,
	DOWN_VECTOR,
	ENEMY_COLLISION_TYPE,
	ENEMY_MODEL_TILT_X,
	ENEMY_MODEL_YAW_OFFSET,
	PLAYER_BULLET_COLLISION_TYPE,
	PLAYER_COLLISION_TYPE,
	faceEntity,
	getFirstMesh,
	orientEntityModel,
	setWorldPosition,
} from './shared';

type EnemyProjectile = ReturnType<typeof import('@zylem/game-lib').createSphere>;

export type EnemyPhase =
	| 'patrol'
	| 'dive'
	| 'orbit'
	| 'return'
	| 'pause'
	| 'charge'
	| 'recover';

export type EnemyRuntime = {
	entity: ReturnType<typeof createActor>;
	destructible: Destructible3DHandle;
	kind: EnemyKind;
	anchor: Vector3;
	patrolRange: number;
	patrolSpeed: number;
	fireCooldown: number;
	abilityCooldown: number;
	time: number;
	phase: EnemyPhase;
	phaseTime: number;
	alive: boolean;
	orbitCenter: Vector3;
	orbitAngle: number;
	chargeVelocity: Vector3;
	phaseOffset: number;
	difficulty: number;
	explode: (impactWorld?: Vector3) => boolean;
};

export type EnemyFactoryOptions = {
	anchor: Vector3;
	waveNumber: number;
	index: number;
};

export type EnemyUpdateContext = {
	delta: number;
	getPlayerPosition: () => Vector3 | null;
	addProjectile: (projectile: EnemyProjectile) => void;
	createSineEnemyBullet: (position: Vector3) => EnemyProjectile;
	createStraightEnemyBullet: (
		position: Vector3,
		color: string,
	) => EnemyProjectile;
};

type EnemyRuntimeConfig = {
	name: string;
	kind: EnemyKind;
	model: string;
	anchor: Vector3;
	scale: number;
	collisionSize: { x: number; y: number; z: number };
	collisionPosition?: { x: number; y: number; z: number };
	patrolRange: number;
	patrolSpeed: number;
	fireCooldown: number;
	abilityCooldown: number;
	phaseOffset: number;
	difficulty: number;
	modelTiltX?: number;
	modelYawOffset?: number;
	fractureSeed?: number;
	fragmentCount?: number;
};

export function createEnemyRuntime({
	name,
	kind,
	model,
	anchor,
	scale,
	collisionSize,
	collisionPosition = { x: 0, y: -0.08, z: 0 },
	patrolRange,
	patrolSpeed,
	fireCooldown,
	abilityCooldown,
	phaseOffset,
	difficulty,
	modelTiltX = ENEMY_MODEL_TILT_X,
	modelYawOffset = ENEMY_MODEL_YAW_OFFSET,
	fractureSeed = 17,
	fragmentCount = 12,
}: EnemyRuntimeConfig): EnemyRuntime {
	const inverseMatrix = new Matrix4();
	const enemy = createActor({
		name,
		models: [model],
		scale: { x: scale, y: scale, z: scale },
		collisionShape: 'bounds',
		collision: {
			size: collisionSize,
			position: collisionPosition,
		},
		position: { x: anchor.x, y: anchor.y, z: anchor.z },
		collisionType: ENEMY_COLLISION_TYPE,
		collisionFilter: [PLAYER_COLLISION_TYPE, PLAYER_BULLET_COLLISION_TYPE],
	});
	const destructible = enemy.use(Destructible3DBehavior, {
		fractureOptions: new FractureOptions({
			fractureMethod: 'voronoi',
			fragmentCount,
			voronoiOptions: {
				mode: '3D',
			},
			seed: fractureSeed,
		}),
		prebakeWorkerUrl: destructiblePrebakeWorkerUrl,
		collider: {
			shape: 'cuboid',
			// Rapier packed groups 0: fragment colliders generate no contacts (visual debris only).
			collisionGroups: 0,
		},
		fragmentPhysics: {
			mode: 'independent',
			outwardVelocity: 3,
			angularVelocity: 1.45,
		},
	});
	let warmedUp = false;
	let exploded = false;

	const orient = () => {
		orientEntityModel(enemy, modelTiltX, modelYawOffset);
	};

	const warmupDestructible = () => {
		if (warmedUp || !enemy.mesh) {
			return;
		}

		void destructible.prebakeAsync().then(
			() => {
				warmedUp = true;
			},
			(error) => {
				console.warn(`Failed to warm destructible enemy ship: ${name}`, error);
			},
		);
	};

	const bindPrimaryMesh = () => {
		const primaryMesh = getFirstMesh(enemy.group);
		if (!primaryMesh) {
			return;
		}

		enemy.mesh = primaryMesh;
		warmupDestructible();
	};

	const buildImpactOverride = (impactWorld?: Vector3) => {
		if (!impactWorld) {
			return undefined;
		}

		const targetRoot = enemy.mesh ?? enemy.group;
		if (!targetRoot) {
			return undefined;
		}

		targetRoot.updateMatrixWorld(true);
		const impactPoint = impactWorld.clone().applyMatrix4(
			inverseMatrix.copy(targetRoot.matrixWorld).invert(),
		);

		return {
			fractureMethod: 'voronoi' as const,
			fragmentCount,
			voronoiOptions: {
				mode: '3D' as const,
				impactPoint,
				impactRadius: 0.56,
			},
		};
	};

	enemy.onSetup(({ me }: any) => {
		me.body?.setGravityScale(0, true);
		me.body?.setLinearDamping(0);
		setWorldPosition(me, anchor);
		faceEntity(me, DOWN_VECTOR);
		orient();
		bindPrimaryMesh();
	});

	enemy.listen('entity:model:loaded', () => {
		orient();
		bindPrimaryMesh();
	});

	return {
		entity: enemy,
		destructible,
		kind,
		anchor: anchor.clone(),
		patrolRange,
		patrolSpeed,
		fireCooldown,
		abilityCooldown,
		time: 0,
		phase: 'patrol',
		phaseTime: 0,
		alive: true,
		orbitCenter: anchor.clone(),
		orbitAngle: Math.random() * Math.PI * 2,
		chargeVelocity: anchor.clone().set(0, 0, 0),
		phaseOffset,
		difficulty,
		explode(impactWorld?: Vector3) {
			if (exploded || !enemy.mesh) {
				return false;
			}

			exploded = true;
			destructible.fracture(buildImpactOverride(impactWorld));
			return true;
		},
	};
}
