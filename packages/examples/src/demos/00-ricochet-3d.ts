import { Color, Vector3 } from 'three';
import {
	createBox,
	createCamera,
	createGame,
	createSphere,
	createStage,
	Ricochet3DBehavior,
} from '@zylem/game-lib';

const cubeHalfSize = 6;
const wallThickness = 0.35;
const wallColor = new Color('#89a7b1');
const wallDefinitions = [
	{
		name: 'wall-left',
		position: new Vector3(-cubeHalfSize, 0, 0),
		size: new Vector3(wallThickness, cubeHalfSize * 2, cubeHalfSize * 2),
		normal: { x: 1, y: 0, z: 0 },
	},
	{
		name: 'wall-right',
		position: new Vector3(cubeHalfSize, 0, 0),
		size: new Vector3(wallThickness, cubeHalfSize * 2, cubeHalfSize * 2),
		normal: { x: -1, y: 0, z: 0 },
	},
	{
		name: 'wall-bottom',
		position: new Vector3(0, -cubeHalfSize, 0),
		size: new Vector3(cubeHalfSize * 2, wallThickness, cubeHalfSize * 2),
		normal: { x: 0, y: 1, z: 0 },
	},
	{
		name: 'wall-top',
		position: new Vector3(0, cubeHalfSize, 0),
		size: new Vector3(cubeHalfSize * 2, wallThickness, cubeHalfSize * 2),
		normal: { x: 0, y: -1, z: 0 },
	},
	{
		name: 'wall-back',
		position: new Vector3(0, 0, -cubeHalfSize),
		size: new Vector3(cubeHalfSize * 2, cubeHalfSize * 2, wallThickness),
		normal: { x: 0, y: 0, z: 1 },
	},
	{
		name: 'wall-front',
		position: new Vector3(0, 0, cubeHalfSize),
		size: new Vector3(cubeHalfSize * 2, cubeHalfSize * 2, wallThickness),
		normal: { x: 0, y: 0, z: -1 },
	},
] as const;

const walls = wallDefinitions.map((wall) =>
	createBox({
		name: wall.name,
		position: wall.position,
		size: wall.size,
		collision: { static: true },
		material: { color: wallColor.clone().offsetHSL(0, 0, Math.random() * 0.08) },
	}),
);

const wallNormals = new Map(
	wallDefinitions.map((wall) => [wall.name, wall.normal]),
);

const ball = createSphere({
	name: 'ricochet-ball',
	radius: 0.45,
	position: new Vector3(0, 0, 0),
	material: { color: new Color('#ff6f61') },
});

const ricochet = ball.use(Ricochet3DBehavior, {
	minSpeed: 8,
	maxSpeed: 12,
	speedMultiplier: 1,
	reflectionMode: 'simple',
	maxAngleDeg: 25,
});

ball.onSetup(({ me }) => {
	me.body?.setGravityScale(0, true);
	me.body?.setLinvel({ x: 8, y: 5.5, z: 6.5 }, true);
});

ball.onCollision(({ entity, other }) => {
	const normal = wallNormals.get(other.name);
	if (!normal) return;

	const applied = ricochet.applyRicochet({
		entity,
		otherEntity: other,
		contact: { normal },
	});
	if (!applied) return;

	const result = ricochet.getLastResult();
	if (!result) return;
	entity.body?.setLinvel(result.velocity, true);
});

const camera = createCamera({
	position: new Vector3(16, 12, 16),
	target: new Vector3(0, 0, 0),
});

const stage = createStage({
	backgroundColor: new Color('#0f1720'),
}, camera);

stage.add(ball, ...walls);

const game = createGame({
	id: 'ricochet-3d',
	debug: true,
}, stage);

export default game;
