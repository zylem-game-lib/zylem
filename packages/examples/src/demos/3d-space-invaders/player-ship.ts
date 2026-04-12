import { Color, Matrix4, Vector3 } from 'three';
import {
	createActor,
	createSphere,
	Destructible3DBehavior,
	FractureOptions,
	type Destructible3DHandle,
} from '@zylem/game-lib';
import fisherShipGlb from '../../assets/fisher-ship.glb';
import { destructiblePrebakeWorkerUrl } from '../lib/destructible-prebake-worker-url';
import {
	ENEMY_BULLET_COLLISION_TYPE,
	ENEMY_COLLISION_TYPE,
	PLAYER_COLLISION_TYPE,
	PLAYER_COLOR,
	PLAYER_MODEL_TILT_X,
	PLAYER_MODEL_YAW_OFFSET,
	PLAYER_SHIELD_COLLISION_TYPE,
	PLAYER_START_Y,
	getFirstMesh,
	orientEntityModel,
	setEntityVisibility,
} from './shared';

export type PlayerShipRuntime = {
	entity: ReturnType<typeof createActor>;
	destructible: Destructible3DHandle;
	shield: ReturnType<typeof createSphere>;
	explode: (impactWorld?: Vector3) => boolean;
};

export function orientPlayerModel(player: PlayerShipRuntime['entity']) {
	orientEntityModel(player, PLAYER_MODEL_TILT_X, PLAYER_MODEL_YAW_OFFSET);
}

export function createPlayerShip(): PlayerShipRuntime {
	const inverseMatrix = new Matrix4();
	const ship = createActor({
		name: '3d-space-invaders-player',
		models: [fisherShipGlb],
		scale: { x: 0.82, y: 0.82, z: 0.82 },
		collisionShape: 'bounds',
		collision: {
			size: { x: 0.82, y: 0.96, z: 0.72 },
			position: { x: 0, y: -0.14, z: 0 },
		},
		position: { x: 0, y: PLAYER_START_Y, z: 0 },
		collisionType: PLAYER_COLLISION_TYPE,
		collisionFilter: [ENEMY_COLLISION_TYPE, ENEMY_BULLET_COLLISION_TYPE],
	});
	const shield = createSphere({
		name: '3d-space-invaders-player-shield',
		radius: 1.15,
		position: { x: 0, y: PLAYER_START_Y, z: 0 },
		material: {
			color: new Color(PLAYER_COLOR),
			opacity: 0.24,
		},
		collision: {
			static: true,
			sensor: true,
		},
		collisionType: PLAYER_SHIELD_COLLISION_TYPE,
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
		prebakeWorkerUrl: destructiblePrebakeWorkerUrl,
		collider: {
			shape: 'cuboid',
			collisionGroups: 0,
		},
		fragmentPhysics: {
			mode: 'independent',
			inheritSourceVelocity: false,
			outwardVelocity: 3.6,
			angularVelocity: 1.9,
		},
	});

	let warmedUp = false;
	let exploded = false;

	const warmupDestructible = () => {
		if (warmedUp || !ship.mesh) {
			return;
		}

		void destructible.prebakeAsync().then(
			() => {
				warmedUp = true;
			},
			(error) => {
				console.warn('Failed to warm destructible space invaders player', error);
			},
		);
	};

	const bindPrimaryMesh = () => {
		const primaryMesh = getFirstMesh(ship.group);
		if (!primaryMesh) {
			return;
		}

		ship.mesh = primaryMesh;
		warmupDestructible();
	};

	ship.onSetup(({ me }: any) => {
		me.body?.setGravityScale(0, true);
		me.body?.setLinearDamping(0);
		me.setRotation(0, 0, 0);
		orientPlayerModel(ship);
		bindPrimaryMesh();
	});

	shield.onSetup(({ me }: any) => {
		me.body?.setGravityScale(0, true);
		setEntityVisibility(shield, false);
	});

	ship.listen('entity:model:loaded', () => {
		orientPlayerModel(ship);
		bindPrimaryMesh();
	});

	return {
		entity: ship,
		destructible,
		shield,
		explode(impactWorld?: Vector3) {
			if (exploded || !ship.mesh) {
				return false;
			}

			exploded = true;
			destructible.fracture();
			return true;
		},
	};
}
