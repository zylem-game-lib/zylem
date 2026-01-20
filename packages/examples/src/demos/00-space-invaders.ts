import { Color, Vector2, Vector3 } from 'three';
import { 
	createCamera, destroy, entitySpawner, createGame, makeMoveable, 
	Perspectives, createSprite, createStage, createText, setGlobal, TEXT_TYPE,
	WorldBoundary2DBehavior, MovementSequence2DBehavior, makeTransformable
} from '@zylem/game-lib';
import playerShip from '@zylem/assets/2d/space/player-ship.png';
import enemyShip from '@zylem/assets/2d/space/enemy-ship.png';
import playerLaser from '@zylem/assets/2d/space/player-laser.png';

const player = makeTransformable(createSprite({
	name: 'player',
	images: [
		{ name: 'player', file: playerShip },
	],
	position: new Vector3(0, -5, 0),
}));

// Attach boundary behavior to player
const playerBoundary = player.use(WorldBoundary2DBehavior, {
	boundaries: { top: 1, bottom: -7, left: -10, right: 10 },
});

async function createBullet(x: number, y: number) {
	const bullet = makeTransformable(createSprite({
		name: 'bullet',
		images: [
			{ name: 'bullet', file: playerLaser },
		],
		position: new Vector3(x, y, 0),
		size: new Vector3(0.5, 0.5, 1),
	}));

	// Attach boundary behavior to bullet
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
		bulletSpawner.spawnRelative(player, stage1, new Vector2(0, 1));
	}
});

const enemies: any[] = [];

for (let i = 0; i < 10; i++) {
	for (let j = 0; j < 4; j++) {
		const enemy = makeMoveable(createSprite({
			name: 'enemy',
			images: [
				{ name: 'enemy', file: enemyShip },
			],
		}));

		// Attach movement sequence behavior (before onSetup so we can reset it)
		const sequence = enemy.use(MovementSequence2DBehavior, {
			sequence: [
				{ name: 'move-left', moveX: -1.5, moveY: 0, timeInSeconds: 2 },
				{ name: 'move-down', moveX: 0, moveY: -0.5, timeInSeconds: 0.5 },
				{ name: 'move-right', moveX: 1.5, moveY: 0, timeInSeconds: 2 },
				{ name: 'move-down', moveX: 0, moveY: -0.5, timeInSeconds: 0.5 },
			],
			loop: true,
		});

		// Attach boundary behavior
		enemy.use(WorldBoundary2DBehavior, {
			boundaries: { top: 10, bottom: -10, left: -20, right: 20 },
		});

		enemy.onSetup(({ me }) => {
			me.setPosition(4 + (i * 2 - 10), j + 3, 0);
			// Reset the sequence when the entity is set up (e.g., on game restart)
			sequence.reset();
		});

		enemy.onUpdate(({ me }) => {
			// Get movement from sequence and apply it
			const { moveX, moveY } = sequence.getMovement();
			me.moveXY(moveX, moveY);
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

const stage1 = createStage({
	backgroundColor: new Color(Color.NAMES.black),
}, camera);
stage1.add(player);
stage1.add(...enemies);

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
}, stage1, livesText, scoreText)
.onGlobalChange<number>('score', (score, stage) => {
	stage?.getEntityByName('scoreText', TEXT_TYPE)?.updateText(`Score: ${score}`);
})
.onGlobalChange<number>('lives', (lives, stage) => {
	stage?.getEntityByName('livesText', TEXT_TYPE)?.updateText(`Lives: ${lives}`);
});

export default game;