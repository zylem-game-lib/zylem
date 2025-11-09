/// <reference types="@zylem/assets" />
import { Color, Vector2, Vector3 } from 'three';
import { camera, destroy, entitySpawner, game, makeMoveable, Perspectives, sprite, stage, text } from '../src/main';
import { boundary2d } from '../src/lib/actions/behaviors/boundaries/boundary';
import { movementSequence2D } from '../src/lib/actions/behaviors/movement/movement-sequence-2d';
import { ZylemSprite } from '../src/lib/entities/sprite';
import { makeTransformable } from '../src/lib/actions/capabilities/transformable';
import playerShip from '@zylem/assets/2d/space/player-ship.png';
import enemyShip from '@zylem/assets/2d/space/enemy-ship.png';
import playerLaser from '@zylem/assets/2d/space/player-laser.png';

const player = makeTransformable(await sprite({
	name: 'player',
	images: [
		{ name: 'player', file: playerShip },
	],
	position: new Vector3(0, -5, 0),
}));

async function createBullet(x: number, y: number) {
	const bullet = makeTransformable(await sprite({
		name: 'bullet',
		images: [
			{ name: 'bullet', file: playerLaser },
		],
		position: new Vector3(x, y, 0),
		size: new Vector3(0.5, 0.5, 1),
	})).onSetup(({ me }) => {
		me.setPosition(x, y, 0);
		me.setRotationDegreesZ(180);
	}).onUpdate(({ me }) => {
		me.moveY(14);
	}).onCollision(({ entity, other }) => {
		if (other.name === 'enemy') {
			destroy(other);
			destroy(entity);
			shotsFired = 0;
		}
	}).addBehavior(boundary2d({
		boundaries: { top: 10, bottom: -10, left: -10, right: 10 },
		onBoundary: ({ boundary }) => {
			if (boundary.top) {
				destroy(bullet);
				shotsFired = maxShots - 1;
			}
		}
	}));
	return bullet;
}

const speed = 5;
const maxShots = 2;
let shotsFired = 0;
player.onUpdate(({ me, inputs }) => {
	let { Horizontal, Vertical } = inputs.p1.axes;
	const { A, B } = inputs.p1.buttons;
	const horizontal = Horizontal.value * speed;
	const vertical = -(Vertical.value * speed);
	me.moveXY(horizontal, vertical);
	if (A.pressed && shotsFired < maxShots) {
		shotsFired++;
		bulletSpawner.spawnRelative(player, stage1, new Vector2(0, 1));
	}
});
player.addBehavior(boundary2d({ boundaries: { top: 1, bottom: -7, left: -10, right: 10 } }));

const enemies: ZylemSprite[] = [];

for (let i = 0; i < 10; i++) {
	for (let j = 0; j < 4; j++) {
		const enemy = makeMoveable(await sprite({
			name: 'enemy',
			images: [
				{ name: 'enemy', file: enemyShip },
			],
			position: new Vector3(4 + (i * 2 - 10), j + 3, 0),
		}));
		enemy.addBehavior(movementSequence2D({
			sequence: [
				{ name: 'move-left', moveX: -1.5, timeInSeconds: 2 },
				{ name: 'move-down', moveY: -0.5, timeInSeconds: 0.5 },
				{ name: 'move-right', moveX: 1.5, timeInSeconds: 2 },
				{ name: 'move-down', moveY: -0.5, timeInSeconds: 0.5 },
			],
			loop: true,
		}));
		enemy.onDestroy(({ globals }) => {
			globals.score += 10;
		});
		enemy.addBehavior(boundary2d({ boundaries: { top: 10, bottom: -10, left: -20, right: 20 } }));
		enemies.push(enemy);
	}
}

const camera1 = camera({
	position: new Vector3(0, 0, 10),
	target: new Vector3(0, 0, 0),
	zoom: 20,
	perspective: Perspectives.Fixed2D,
});

const stage1 = stage({
	backgroundColor: new Color(Color.NAMES.black),
}, camera1, ...enemies, player);

const bulletSpawner = entitySpawner(createBullet);

const livesText = await text({
	name: 'livesText',
	text: 'Lives: 3',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(0.1, 0.05),
});

const scoreText = await text({
	name: 'scoreText',
	text: 'Score: 0',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(0.9, 0.05),
});

const spaceInvadersGame = game({
	id: 'space-invaders',
	// debug: true,
	globals: {
		score: 0,
		lives: 3,
		enemies: enemies.length,
	},
	// preset: 'SNES',
	// resolution: '512x448',
}, stage1, livesText, scoreText);


spaceInvadersGame.onGlobalChange('score', (score) => {
	scoreText.updateText(`Score: ${score}`);
});

spaceInvadersGame.onGlobalChange('lives', (lives) => {
	livesText.updateText(`Lives: ${lives}`);
});

spaceInvadersGame.start();