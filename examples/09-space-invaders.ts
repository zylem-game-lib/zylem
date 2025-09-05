import { Color, Vector2, Vector3 } from 'three';
import { camera, destroy, game, makeMoveable, makeRotatable, makeSpawnable, Perspectives, sprite, stage, text } from '../src/main';
import { boundary } from '../src/lib/actions/behaviors/boundaries/boundary';
import { movementSequence2D } from '../src/lib/actions/behaviors/movement/movement-sequence-2d';
import { ZylemSprite } from '../src/lib/entities/sprite';

const directory = 'playground/space-2d/';

const player = makeMoveable(await sprite({
	name: 'player',
	images: [
		{ name: 'player', file: `${directory}/player-ship.png` },
	],
	position: new Vector3(0, -5, 0),
}));

async function createBullet(x: number, y: number) {
	const bullet = makeRotatable(makeMoveable(await sprite({
		name: 'bullet',
		images: [
			{ name: 'bullet', file: `${directory}/player-laser.png` },
		],
	}))).onSetup(({ me }) => {
		me.setPosition(x, y, 0);
		me.setRotationDegreesZ(180);
	}).onUpdate(({ me }) => {
		me.moveY(12);
	}).onCollision(({ entity, other, globals }) => {
		if (other.name === 'enemy') {
			destroy(other);
			destroy(entity);
			ableToShoot = true;
		}
	}).addBehavior(boundary({
		boundaries: { top: 10, bottom: -10, left: -10, right: 10 },
		onBoundary: ({ boundary }) => {
			if (boundary.top) {
				destroy(bullet);
				ableToShoot = true;
			}
		}
	}));
	return bullet;
}

const speed = 5;
let ableToShoot = true;
player.onUpdate(({ me, inputs }) => {
	let { Horizontal, Vertical } = inputs.p1.axes;
	const { A } = inputs.p1.buttons;
	const horizontal = Horizontal.value * speed;
	const vertical = -(Vertical.value * speed);
	me.moveXY(horizontal, vertical);
	if (A.pressed && ableToShoot) {
		ableToShoot = false;
		stage1.add(createBullet(me.getPosition()?.x ?? 0, me.getPosition()?.y ?? 0 + 1));
	}
});
player.addBehavior(boundary({ boundaries: { top: 1, bottom: -10, left: -10, right: 10 } }));

const enemies: ZylemSprite[] = [];

for (let i = 0; i < 10; i++) {
	for (let j = 0; j < 4; j++) {
		const enemy = makeMoveable(await sprite({
			name: 'enemy',
			images: [
				{ name: 'enemy', file: `${directory}/enemy-ship.png` },
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
		enemy.addBehavior(boundary({ boundaries: { top: 10, bottom: -10, left: -20, right: 20 } }));
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

const livesText = await text({
	name: 'livesText',
	text: 'Lives: 3',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(window.innerWidth - 120, 24),
});

const scoreText = await text({
	name: 'scoreText',
	text: 'Score: 0',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(120, 24),
});

const spaceInvadersGame = game({
	id: 'space-invaders',
	debug: true,
	globals: {
		score: 0,
		lives: 3,
		enemies: enemies.length,
	}
}, stage1, livesText, scoreText);


spaceInvadersGame.onGlobalChange('score', (score) => {
	scoreText.updateText(`Score: ${score}`);
});

spaceInvadersGame.onGlobalChange('lives', (lives) => {
	livesText.updateText(`Lives: ${lives}`);
});

spaceInvadersGame.start();