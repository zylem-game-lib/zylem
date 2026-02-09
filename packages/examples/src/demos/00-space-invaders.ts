import { Color, Vector2, Vector3 } from 'three';
import {
	createCamera, destroy, entitySpawner, createGame,
	Perspectives, createSprite, createStage, createText, setGlobal, TEXT_TYPE,
	WorldBoundary2DBehavior,
	moveBy, sequence, repeatForever,
	useArrowsForAxes
} from '@zylem/game-lib';
import playerShip from '@zylem/assets/2d/space/player-ship.png';
import enemyShip from '@zylem/assets/2d/space/enemy-ship.png';
import playerLaser from '@zylem/assets/2d/space/player-laser.png';

const player = createSprite({
	name: 'player',
	images: [
		{ name: 'player', file: playerShip },
	],
	position: new Vector3(0, -5, 0),
});

const playerBoundary = player.use(WorldBoundary2DBehavior, {
	boundaries: { top: 1, bottom: -7, left: -10, right: 10 },
});

async function createBullet(x: number, y: number) {
	const bullet = createSprite({
		name: 'bullet',
		images: [
			{ name: 'bullet', file: playerLaser },
		],
		position: new Vector3(x, y, 0),
		size: new Vector3(0.5, 0.5, 1),
	});

	const bulletBoundary = bullet.use(WorldBoundary2DBehavior, {
		boundaries: { top: 10, bottom: -10, left: -10, right: 10 },
	});

	bullet.onSetup(({ me }) => {
		me.setPosition(x, y, 0);
		me.setRotationDegreesZ(180);
	}).onUpdate(({ me }) => {
		me.moveY(14);

		// Check if bullet hit top boundary
		const hits = bulletBoundary.getLastHits();
		if (hits?.top) {
			destroy(bullet);
			shotsFired = maxShots - 1;
		}
	}).onCollision(({ entity, other }) => {
		if (other.name === 'enemy') {
			destroy(other);
			destroy(entity);
			shotsFired = 0;
		}
	});

	return bullet;
}
const bulletSpawner = entitySpawner(createBullet);

const speed = 5;
const maxShots = 2;
let shotsFired = 0;

player.onUpdate(({ me, inputs }) => {
	let { Horizontal, Vertical } = inputs.p1.axes;
	const { A } = inputs.p1.buttons;

	let moveX = Horizontal.value * speed;
	let moveY = -(Vertical.value * speed);

	// Use boundary behavior to constrain movement
	({ moveX, moveY } = playerBoundary.getMovement(moveX, moveY));
	me.moveXY(moveX, moveY);

	if (A.pressed && shotsFired < maxShots) {
		shotsFired++;
		bulletSpawner.spawnRelative(player, stage, new Vector2(0, 1));
	}
});

const enemies: any[] = [];

for (let i = 0; i < 10; i++) {
	for (let j = 0; j < 4; j++) {
		const enemy = createSprite({
			name: 'enemy',
			images: [
				{ name: 'enemy', file: enemyShip },
			],
		});

		// Movement patrol using actions (replaces MovementSequence2DBehavior)
		const patrol = repeatForever(
			sequence(
				moveBy({ x: -3, duration: 2000 }),
				moveBy({ y: -0.25, duration: 500 }),
				moveBy({ x: 3, duration: 2000 }),
				moveBy({ y: -0.25, duration: 500 }),
			),
		);
		enemy.runAction(patrol);

		// Attach boundary behavior
		enemy.use(WorldBoundary2DBehavior, {
			boundaries: { top: 10, bottom: -10, left: -20, right: 20 },
		});

		enemy.onSetup(({ me }) => {
			me.setPosition(4 + (i * 2 - 10), j + 3, 0);
			// Reset the patrol when the entity is set up (e.g., on game restart)
			patrol.reset();
		});

		enemy.onDestroy(({ globals }) => {
			setGlobal('score', (globals.score as number) + 10);
		});

		enemies.push(enemy);
	}
}

const camera = createCamera({
	position: new Vector3(0, 0, 10),
	target: new Vector3(0, 0, 0),
	zoom: 20,
	perspective: Perspectives.Fixed2D,
});

const stage = createStage({
	backgroundColor: new Color(Color.NAMES.black),
}, camera);
stage.add(player);
stage.add(...enemies);
stage.setInputConfiguration(useArrowsForAxes('p1'));

const livesText = createText({
	name: 'livesText',
	text: 'Lives: 3',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(0.1, 0.05),
});

const scoreText = createText({
	name: 'scoreText',
	text: 'Score: 0',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(0.9, 0.05),
});

const game = createGame({
	id: 'space-invaders',
	globals: {
		score: 0,
		lives: 3,
		enemies: enemies.length,
	},
}, stage, livesText, scoreText)
	.onGlobalChange<number>('score', (score, stage) => {
		stage?.getEntityByName('scoreText', TEXT_TYPE)?.updateText(`Score: ${score}`);
	})
	.onGlobalChange<number>('lives', (lives, stage) => {
		stage?.getEntityByName('livesText', TEXT_TYPE)?.updateText(`Lives: ${lives}`);
	});

export default game;