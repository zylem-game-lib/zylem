import { Color, Vector3 } from 'three';
import {
	BoundaryRicochet3DCoordinator,
	createBox,
	createCamera,
	createGame,
	createSphere,
	createStage,
	Ricochet3DBehavior,
	WorldBoundary3DBehavior,
} from '@zylem/game-lib';

const cubeHalfSize = 6;
const wallThickness = 0.35;
const ballRadius = 0.45;
const wallColor = new Color('#89a7b1');
const wallOpacity = 0.35;
const wallDefinitions = [
	{
		name: 'wall-left',
		position: new Vector3(-cubeHalfSize, 0, 0),
		size: new Vector3(wallThickness, cubeHalfSize * 2, cubeHalfSize * 2),
	},
	{
		name: 'wall-right',
		position: new Vector3(cubeHalfSize, 0, 0),
		size: new Vector3(wallThickness, cubeHalfSize * 2, cubeHalfSize * 2),
	},
	{
		name: 'wall-bottom',
		position: new Vector3(0, -cubeHalfSize, 0),
		size: new Vector3(cubeHalfSize * 2, wallThickness, cubeHalfSize * 2),
	},
	{
		name: 'wall-top',
		position: new Vector3(0, cubeHalfSize, 0),
		size: new Vector3(cubeHalfSize * 2, wallThickness, cubeHalfSize * 2),
	},
	{
		name: 'wall-back',
		position: new Vector3(0, 0, -cubeHalfSize),
		size: new Vector3(cubeHalfSize * 2, cubeHalfSize * 2, wallThickness),
	},
	{
		name: 'wall-front',
		position: new Vector3(0, 0, cubeHalfSize),
		size: new Vector3(cubeHalfSize * 2, cubeHalfSize * 2, wallThickness),
	},
] as const;

const boundaryInset = wallThickness / 2;
const boxBounds = {
	left: -cubeHalfSize + boundaryInset,
	right: cubeHalfSize - boundaryInset,
	bottom: -cubeHalfSize + boundaryInset,
	top: cubeHalfSize - boundaryInset,
	back: -cubeHalfSize + boundaryInset,
	front: cubeHalfSize - boundaryInset,
} as const;

const walls = wallDefinitions.map((wall) =>
	createBox({
		name: wall.name,
		position: wall.position,
		size: wall.size,
		collision: { static: true, sensor: true },
		material: {
			color: wallColor.clone().offsetHSL(0, 0, Math.random() * 0.08),
			opacity: wallOpacity,
		},
	}),
);

const ball = createSphere({
	name: 'ricochet-ball',
	radius: ballRadius,
	position: new Vector3(0, 0, 0),
	material: { color: new Color('#ff6f61') },
});

const ball2 = ball.clone({
	name: 'ricochet-ball-2',
	position: new Vector3(1.75, -1.25, 1.2),
	material: { color: new Color('#ffd166') },
});

function attachBoundaryRicochet(
	entity: typeof ball,
	initialVelocity: { x: number; y: number; z: number },
) {
	const ricochet = entity.use(Ricochet3DBehavior, {
		minSpeed: 8,
		maxSpeed: 12,
		speedMultiplier: 1,
		reflectionMode: 'simple',
		maxAngleDeg: 25,
	});
	const boundary = entity.use(WorldBoundary3DBehavior, {
		boundaries: boxBounds,
		padding: ballRadius,
	});
	const coordinator = new BoundaryRicochet3DCoordinator(
		entity,
		boundary,
		ricochet,
	);

	entity.onSetup(({ me }) => {
		me.body?.setGravityScale(0, true);
		me.body?.setLinvel(initialVelocity, true);
	});

	entity.onUpdate(() => {
		coordinator.update();
	});
}

attachBoundaryRicochet(ball, { x: 8, y: 5.5, z: 6.5 });
attachBoundaryRicochet(ball2, { x: -9.25, y: 4.25, z: -7.5 });

const camera = createCamera({
	position: new Vector3(16, 12, 16),
	target: new Vector3(0, 0, 0),
});

const stage = createStage({
	backgroundColor: new Color('#0f1720'),
}, camera);

stage.add(ball, ball2, ...walls);

const game = createGame({
	id: 'ricochet-3d',
	debug: true,
}, stage);

export default game;
