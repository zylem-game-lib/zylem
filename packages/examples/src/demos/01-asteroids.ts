import { Color, Vector2, Vector3 } from 'three';
import {
	createCamera,
	destroy,
	entitySpawner,
	createGame,
	makeTransformable,
	Perspectives,
	sprite,
	createStage,
	text,
	setGlobal,
	TEXT_TYPE,
} from '@zylem/game-lib';

// Assets
import playerShipImg from '@zylem/assets/2d/space/player-ship.png';
import playerLaserImg from '@zylem/assets/2d/space/player-laser.png';
import meteorBig1 from '@zylem/assets/2d/space/asteroids/meteor-big-1.png';
import meteorBig2 from '@zylem/assets/2d/space/asteroids/meteor-big-2.png';
import meteorBig3 from '@zylem/assets/2d/space/asteroids/meteor-big-3.png';
import meteorBig4 from '@zylem/assets/2d/space/asteroids/meteor-big-4.png';
import meteorMed1 from '@zylem/assets/2d/space/asteroids/meteor-med-1.png';
import meteorMed2 from '@zylem/assets/2d/space/asteroids/meteor-med-2.png';
import meteorSmall1 from '@zylem/assets/2d/space/asteroids/meteor-small-1.png';
import meteorSmall2 from '@zylem/assets/2d/space/asteroids/meteor-small-2.png';
import meteorTiny1 from '@zylem/assets/2d/space/asteroids/meteor-tiny-1.png';
import meteorTiny2 from '@zylem/assets/2d/space/asteroids/meteor-tiny-2.png';

// Game constants
const BOUNDS_X = 12;
const BOUNDS_Y = 9;
const ROTATION_SPEED = 3;
const THRUST_SPEED = 8;
const BULLET_SPEED = 15;
const MAX_BULLETS = 5;
const INVINCIBILITY_FRAMES = 120;

// Asteroid configuration by size
type AsteroidSize = 'big' | 'med' | 'small' | 'tiny';
const asteroidConfig: Record<AsteroidSize, { images: string[]; scale: number; speed: number; points: number; spawns: AsteroidSize | null }> = {
	big: { images: [meteorBig1, meteorBig2, meteorBig3, meteorBig4], scale: 1.5, speed: 1.5, points: 20, spawns: 'med' },
	med: { images: [meteorMed1, meteorMed2], scale: 1.0, speed: 2.0, points: 50, spawns: 'small' },
	small: { images: [meteorSmall1, meteorSmall2], scale: 0.6, speed: 2.5, points: 100, spawns: 'tiny' },
	tiny: { images: [meteorTiny1, meteorTiny2], scale: 0.35, speed: 3.0, points: 200, spawns: null },
};

// Track player rotation angle (in radians)
let playerRotation = 0;
let bulletCount = 0;
let invincibilityTimer = 0;

// Create player ship
const player = makeTransformable(await sprite({
	name: 'player',
	images: [{ name: 'player', file: playerShipImg }],
	position: new Vector3(0, 0, 0),
	size: new Vector3(1, 1, 1),
}));

player.onSetup(({ me }) => {
	me.setPosition(0, 0, 0);
	playerRotation = 0;
	me.setRotationDegreesZ(0);
});

player.onUpdate(({ me, inputs }) => {
	const { Left, Right, Up } = inputs.p1.directions;
	const { Horizontal, Vertical } = inputs.p1.axes;
	const { A } = inputs.p1.buttons;

	// Rotation
	const rotateInput = (Right.held ? 1 : 0) - (Left.held ? 1 : 0) || Horizontal.value;
	playerRotation -= rotateInput * ROTATION_SPEED * 0.016; // ~60fps delta
	me.setRotationZ(playerRotation);

	// Thrust
	const thrustInput = Up.held ? 1 : (Vertical.value < 0 ? -Vertical.value : 0);
	if (thrustInput > 0) {
		me.moveForwardXY(thrustInput * THRUST_SPEED, playerRotation);
	}

	// Screen wrapping
	me.wrapAroundXY(BOUNDS_X, BOUNDS_Y);

	// Handle invincibility
	if (invincibilityTimer > 0) {
		invincibilityTimer--;
	}

	// Shooting
	if (A.pressed && bulletCount < MAX_BULLETS) {
		const pos = me.getPosition();
		if (pos) {
			bulletSpawner.spawn(stage1, pos.x, pos.y);
			bulletCount++;
		}
	}
});

player.onCollision(({ entity, other, globals }) => {
	if (other.name === 'asteroid' && invincibilityTimer <= 0) {
		const newHealth = (globals.health as number) - 1;
		setGlobal('health', newHealth);
		invincibilityTimer = INVINCIBILITY_FRAMES;

		if (newHealth <= 0) {
			// Game over - reset position
			entity.setPosition(0, 0, 0);
			playerRotation = 0;
		}
	}
});

// Bullet factory
async function createBullet(x: number, y: number, rotation: number) {
	const bullet = makeTransformable(await sprite({
		name: 'bullet',
		images: [{ name: 'bullet', file: playerLaserImg }],
		position: new Vector3(x, y, 0),
		size: new Vector3(0.4, 0.4, 1),
	}));

	bullet.onSetup(({ me }) => {
		me.setPosition(x, y, 0);
		me.setRotationZ(rotation);
		me.moveForwardXY(BULLET_SPEED, rotation);
	});

	bullet.onUpdate(({ me }) => {
		// Check if bullet is out of bounds
		const pos = me.getPosition();
		if (pos && (Math.abs(pos.x) > BOUNDS_X + 1 || Math.abs(pos.y) > BOUNDS_Y + 1)) {
			destroy(bullet);
			bulletCount = Math.max(0, bulletCount - 1);
		}
	});

	bullet.onCollision(({ entity, other, globals }) => {
		if (other.name === 'asteroid') {
			// Get asteroid data before destroying
			const asteroidData = (other as any)._asteroidData as { size: AsteroidSize } | undefined;
			const pos = other.getPosition?.() ?? entity.getPosition?.();

			destroy(entity);
			destroy(other);
			bulletCount = Math.max(0, bulletCount - 1);

			if (asteroidData) {
				const config = asteroidConfig[asteroidData.size];
				setGlobal('score', (globals.score as number) + config.points);

				// Spawn smaller asteroids
				if (config.spawns && pos) {
					for (let i = 0; i < 2; i++) {
						const angle = Math.random() * Math.PI * 2;
						spawnAsteroid(pos.x, pos.y, config.spawns, angle);
					}
				}
			}
		}
	});

	return bullet;
}

// Asteroid factory - creates and adds to stage directly (bypasses entitySpawner which only supports x,y)
async function spawnAsteroid(x: number, y: number, size: AsteroidSize, angle: number) {
	const config = asteroidConfig[size];
	const imageFile = config.images[Math.floor(Math.random() * config.images.length)] as string;

	const asteroid = makeTransformable(await sprite({
		name: 'asteroid',
		images: [{ name: 'asteroid', file: imageFile }],
		position: new Vector3(x, y, 0),
		size: new Vector3(config.scale, config.scale, 1),
	}));

	// Store size data for collision handling
	(asteroid as any)._asteroidData = { size };

	asteroid.onSetup(({ me }) => {
		me.setPosition(x, y, 0);
		// Set random rotation
		me.setRotationDegreesZ(Math.random() * 360);
		// Move in specified direction
		const speed = config.speed * (0.8 + Math.random() * 0.4);
		const vx = Math.sin(-angle) * speed;
		const vy = Math.cos(-angle) * speed;
		me.moveXY(vx, vy);
	});

	asteroid.onUpdate(({ me }) => {
		me.wrapAroundXY(BOUNDS_X, BOUNDS_Y);
	});

	// Add directly to stage
	stage1.add(asteroid);
	return asteroid;
}

// Entity spawner for bullets only
const bulletSpawner = entitySpawner(createBullet);

// Camera setup
const camera1 = createCamera({
	position: new Vector3(0, 0, 10),
	target: new Vector3(0, 0, 0),
	zoom: 22,
	perspective: Perspectives.Fixed2D,
});

// HUD Text
const healthText = await text({
	name: 'healthText',
	text: 'Health: 3',
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

// Stage setup
const stage1 = createStage({
	backgroundColor: new Color(Color.NAMES.black),
}, camera1, player);

// Create initial asteroids
const initialAsteroids: Promise<void>[] = [];
for (let i = 0; i < 6; i++) {
	// Spawn asteroids away from center (where player starts)
	const angle = (i / 6) * Math.PI * 2;
	const distance = 6 + Math.random() * 3;
	const x = Math.cos(angle) * distance;
	const y = Math.sin(angle) * distance;
	const moveAngle = Math.random() * Math.PI * 2;
	initialAsteroids.push(
		spawnAsteroid(x, y, 'big', moveAngle).then(() => { })
	);
}
await Promise.all(initialAsteroids);

// Game configuration
const game = createGame({
	id: 'asteroids',
	globals: {
		health: 3,
		score: 0,
	},
	input: {
		p1: {
			key: {
				ArrowLeft: ['directions.left'],
				ArrowRight: ['directions.right'],
				ArrowUp: ['directions.up'],
				a: ['directions.left'],
				d: ['directions.right'],
				w: ['directions.up'],
				' ': ['buttons.a'],
			},
		},
	},
}, stage1, healthText, scoreText)
	.onGlobalChange<number>('health', (health, stage) => {
		stage?.getEntityByName('healthText', TEXT_TYPE)?.updateText(`Health: ${health}`);
	})
	.onGlobalChange<number>('score', (score, stage) => {
		stage?.getEntityByName('scoreText', TEXT_TYPE)?.updateText(`Score: ${score}`);
	});

export default game;
