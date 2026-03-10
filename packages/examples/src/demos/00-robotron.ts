import { Color, Vector2, Vector3 } from 'three';
import {
	createCamera,
	createGame,
	createSprite,
	createStage,
	createText,
	destroy,
	mergeInputConfigs,
	Perspectives,
	ScreenWrapBehavior,
	Shooter2DBehavior,
	setGlobal,
	TEXT_TYPE,
	TopDownMovementBehavior,
	TopDownShooterCoordinator,
	useArrowsForSecondaryAxes,
	useBehavior,
	useWASDForAxes,
} from '@zylem/game-lib';
import playerShipImg from '@zylem/assets/2d/space/player-ship.png';
import enemyShipImg from '@zylem/assets/2d/space/enemy-ship.png';
import playerLaserImg from '@zylem/assets/2d/space/player-laser.png';

const PLAYFIELD_WIDTH = 28;
const PLAYFIELD_HEIGHT = 18;
const BULLET_BOUNDS_X = PLAYFIELD_WIDTH * 0.5 + 2;
const BULLET_BOUNDS_Y = PLAYFIELD_HEIGHT * 0.5 + 2;
const ENEMY_SPEED = 2.4;
const PLAYER_SPEED = 8.5;

let playerInvulnerabilityMs = 0;

function createRobotronBullet() {
	const bullet = createSprite({
		name: 'robotron-bullet',
		images: [{ name: 'robotron-bullet', file: playerLaserImg }],
		size: new Vector3(0.35, 0.75, 1),
	});

	bullet.onUpdate(({ me }) => {
		const position = me.getPosition();
		if (!position) return;

		if (
			Math.abs(position.x) > BULLET_BOUNDS_X
			|| Math.abs(position.y) > BULLET_BOUNDS_Y
		) {
			destroy(me);
		}
	});

	bullet.onCollision(({ entity, other, globals }) => {
		if (other.name !== 'robotron-enemy') {
			return;
		}

		destroy(entity);
		destroy(other);
		setGlobal('score', (globals.score as number) + 25);
	});

	return bullet;
}

function createEnemy(index: number, player: any) {
	const enemy = createSprite({
		name: 'robotron-enemy',
		images: [{ name: `robotron-enemy-${index}`, file: enemyShipImg }],
		size: new Vector3(1, 1, 1),
		position: new Vector3(
			index < 4 ? -10 + index * 3 : -10 + (index - 4) * 3,
			index < 4 ? 6 : -6,
			0,
		),
	});

	enemy.use(ScreenWrapBehavior, {
		width: PLAYFIELD_WIDTH,
		height: PLAYFIELD_HEIGHT,
	});

	enemy.onUpdate(({ me }) => {
		const playerPosition = player.getPosition();
		const enemyPosition = me.getPosition();
		if (!playerPosition || !enemyPosition) {
			return;
		}

		const dx = playerPosition.x - enemyPosition.x;
		const dy = playerPosition.y - enemyPosition.y;
		const distance = Math.hypot(dx, dy);
		if (distance <= 1e-6) {
			return;
		}

		const moveX = (dx / distance) * ENEMY_SPEED;
		const moveY = (dy / distance) * ENEMY_SPEED;
		me.moveXY(moveX, moveY);
		me.setRotationZ(Math.atan2(-(dx / distance), dy / distance));
	});

	return enemy;
}

const basePlayer = createSprite({
	name: 'robotron-player',
	images: [{ name: 'robotron-player', file: playerShipImg }],
	size: new Vector3(1, 1, 1),
	position: new Vector3(0, 0, 0),
});

const player = useBehavior(basePlayer, TopDownMovementBehavior, {
	moveSpeed: PLAYER_SPEED,
});

player.use(ScreenWrapBehavior, {
	width: PLAYFIELD_WIDTH,
	height: PLAYFIELD_HEIGHT,
});

const playerShooter = player.use(Shooter2DBehavior, {
	projectileFactory: createRobotronBullet,
	projectileSpeed: 22,
	cooldownMs: 110,
	spawnOffset: { x: 0, y: 0.9 },
	rotateProjectile: true,
});

const enemies = Array.from({ length: 8 }, (_, index) => createEnemy(index, player));

const camera = createCamera({
	position: new Vector3(0, 0, 12),
	target: new Vector3(0, 0, 0),
	zoom: 18,
	perspective: Perspectives.Fixed2D,
});

const stage = createStage({
	backgroundColor: new Color('#090d14'),
}, camera);

const playerCoordinator = new TopDownShooterCoordinator(
	player,
	playerShooter,
	stage,
);

player.onUpdate(({ delta, inputs }) => {
	playerInvulnerabilityMs = Math.max(0, playerInvulnerabilityMs - delta * 1000);

	const { Horizontal, Vertical, SecondaryHorizontal, SecondaryVertical } = inputs.p1.axes;
	const aimX = SecondaryHorizontal.value;
	const aimY = -SecondaryVertical.value;
	playerCoordinator.update({
		moveX: Horizontal.value,
		moveY: -Vertical.value,
		aimX,
		aimY,
		shootPressed: false,
		shootHeld: Math.hypot(aimX, aimY) > 0.2,
	});
});

player.onCollision(({ entity, other, globals }) => {
	if (other.name !== 'robotron-enemy' || playerInvulnerabilityMs > 0) {
		return;
	}

	playerInvulnerabilityMs = 900;
	setGlobal('lives', Math.max(0, (globals.lives as number) - 1));
	entity.setPosition(0, 0, 0);
});

const scoreText = createText({
	name: 'robotronScore',
	text: 'Score: 0',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(0.87, 0.05),
});

const livesText = createText({
	name: 'robotronLives',
	text: 'Lives: 3',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(0.12, 0.05),
});

stage.add(player, ...enemies);
stage.setInputConfiguration(
	mergeInputConfigs(
		useWASDForAxes('p1'),
		useArrowsForSecondaryAxes('p1'),
	),
);

const game = createGame({
	id: 'robotron',
	globals: {
		score: 0,
		lives: 3,
	},
}, stage, scoreText, livesText)
	.onGlobalChange<number>('score', (score, currentStage) => {
		currentStage?.getEntityByName('robotronScore', TEXT_TYPE)?.updateText(`Score: ${score}`);
	})
	.onGlobalChange<number>('lives', (lives, currentStage) => {
		currentStage?.getEntityByName('robotronLives', TEXT_TYPE)?.updateText(`Lives: ${lives}`);
	});

export default game;
