import { Color, Vector2, Vector3 } from 'three';
import {
	createGame, createStage, createCamera, createBox, createSphere, createText,
	entitySpawner, destroy, setGlobal, getGlobal,
	useArrowsForAxes,
} from '@zylem/game-lib';

const SPAWN_INTERVAL = 0.1;
const MAX_ENTITIES = 150;
const FLOOR_Y = -6;
const ARENA_WIDTH = 16;
const ARENA_HEIGHT = 12;

const colors = [
	new Color(0xff4444),
	new Color(0x44aaff),
	new Color(0x44ff88),
	new Color(0xffaa22),
	new Color(0xdd44ff),
	new Color(0xffff44),
	new Color(0xff66aa),
];

function randomColor(): Color {
	return colors[Math.floor(Math.random() * colors.length)]!;
}

// ─── Ground and walls ──────────────────────────────────────────────────────

const ground = createBox({
	name: 'ground',
	position: { x: 0, y: FLOOR_Y + 0.5, z: 0 },
	size: { x: ARENA_WIDTH + 2, y: 2, z: 10 },
	material: { color: new Color(0x333333) },
	collision: { static: true },
});

const wallLeft = createBox({
	name: 'wall-left',
	position: { x: -(ARENA_WIDTH / 2) - 0.5, y: 0, z: 0 },
	size: { x: 1, y: ARENA_HEIGHT * 2, z: 2 },
	material: { color: new Color(0x222222) },
	collision: { static: true },
});

const wallRight = createBox({
	name: 'wall-right',
	position: { x: (ARENA_WIDTH / 2) + 0.5, y: 0, z: 0 },
	size: { x: 1, y: ARENA_HEIGHT * 2, z: 2 },
	material: { color: new Color(0x222222) },
	collision: { static: true },
});

// ─── Entity spawners ───────────────────────────────────────────────────────

const boxSpawner = entitySpawner((x: number, y: number) => {
	const size = 0.4 + Math.random() * 0.6;
	const box = createBox({
		name: 'falling-box',
		position: { x, y, z: 0 },
		size: { x: size, y: size, z: size },
		material: { color: randomColor() },
	});

	box.onCollision(({ entity, other }) => {
		if (other.name === 'paddle') {
			const bounces = (getGlobal<number>('bounces') ?? 0) + 1;
			setGlobal('bounces', bounces);
		}
	});

	box.onUpdate(({ me }) => {
		const pos = me.getPosition();
		if (pos && pos.y < FLOOR_Y - 3) {
			destroy(me);
			setGlobal('active', Math.max(0, (getGlobal<number>('active') ?? 1) - 1));
		}
	});

	return box;
});

const sphereSpawner = entitySpawner((x: number, y: number) => {
	const radius = 0.2 + Math.random() * 0.4;
	const sphere = createSphere({
		name: 'falling-sphere',
		position: { x, y, z: 0 },
		radius,
		color: randomColor(),
	});

	sphere.onCollision(({ entity, other }) => {
		if (other.name === 'paddle') {
			const bounces = (getGlobal<number>('bounces') ?? 0) + 1;
			setGlobal('bounces', bounces);
		}
	});

	sphere.onUpdate(({ me }) => {
		const pos = me.getPosition();
		if (pos && pos.y < FLOOR_Y - 3) {
			destroy(me);
			setGlobal('active', Math.max(0, (getGlobal<number>('active') ?? 1) - 1));
		}
	});

	return sphere;
});

// ─── HUD ───────────────────────────────────────────────────────────────────


const activeText = createText({
	name: 'activeText',
	text: 'Bodies: 0',
	fontSize: 18,
	screenPosition: new Vector2(0.85, 0.05),
});

const titleText = createText({
	name: 'titleText',
	text: 'Physics Worker Demo',
	fontSize: 14,
	screenPosition: new Vector2(0.5, 0.05),
});

// ─── Camera ────────────────────────────────────────────────────────────────

const camera = createCamera({
	position: new Vector3(0, 0, 0),
	perspective: 'fixed-2d',
	zoom: 10,
});

// ─── Stage ─────────────────────────────────────────────────────────────────

const physicsWorkerUrl = new URL(
	'../../../game-lib/src/lib/physics/physics-worker.ts',
	import.meta.url,
);

const stage = createStage({
	backgroundColor: new Color(0x111122),
	gravity: new Vector3(0, -9.82, 0),
	usePhysicsWorker: true,
	physicsWorkerUrl,
}, camera);

stage.add(ground, wallLeft, wallRight, activeText, titleText);

// ─── Game ──────────────────────────────────────────────────────────────────

const game = createGame({
	id: 'physics-worker-demo',
	debug: true,
	globals: {
		active: 0,
		spawnTimer: 0,
	},
}, stage);

game.setInputConfiguration(useArrowsForAxes('p1'));

game.onGlobalChange<number>('active', (value) => {
	activeText.updateText(`Bodies: ${value}`);
});

// ─── Spawn loop (runs every frame via game update) ─────────────────────────

game.onUpdate(({ delta }) => {
	const timer = (getGlobal<number>('spawnTimer') ?? 0) + delta;
	setGlobal('spawnTimer', timer);

	if (timer >= SPAWN_INTERVAL) {
		setGlobal('spawnTimer', 0);

		const active = getGlobal<number>('active') ?? 0;
		if (active < MAX_ENTITIES) {
			const x = (Math.random() - 0.5) * (ARENA_WIDTH - 2);
			const y = ARENA_HEIGHT / 2 + Math.random() * 2;
			const useBox = Math.random() > 0.5;

			if (useBox) {
				boxSpawner.spawn(stage, x, y);
			} else {
				sphereSpawner.spawn(stage, x, y);
			}

			setGlobal('active', active + 1);
		}
	}
});

export default game;
