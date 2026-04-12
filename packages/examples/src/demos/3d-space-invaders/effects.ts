import {
	AdditiveBlending,
	CanvasTexture,
	LinearFilter,
	SRGBColorSpace,
	Vector3,
} from 'three';
import { createParticleSystem, particlePresets } from '@zylem/game-lib';
import {
	type EnemyKind,
	ENEMY_COLORS,
	PLAYER_COLOR,
} from './shared';

type ParticleSystemEntity = ReturnType<typeof createParticleSystem>;

type ParticlePool = {
	entities: ParticleSystemEntity[];
	play: (position: Vector3, angle?: number) => void;
	stop: () => void;
};

function createTexture(
	draw: (
		ctx: CanvasRenderingContext2D,
		size: number,
		center: number,
	) => void,
	size = 256,
) {
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;

	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Unable to create particle texture canvas context.');
	}

	const center = size / 2;
	draw(ctx, size, center);

	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	texture.minFilter = LinearFilter;
	texture.magFilter = LinearFilter;
	texture.needsUpdate = true;
	return texture;
}

function createSparkTexture() {
	return createTexture((ctx, size, center) => {
		ctx.clearRect(0, 0, size, size);
		const radial = ctx.createRadialGradient(center, center, 8, center, center, 104);
		radial.addColorStop(0, 'rgba(255,255,255,0.98)');
		radial.addColorStop(0.22, 'rgba(255,255,255,0.88)');
		radial.addColorStop(0.58, 'rgba(255,184,77,0.42)');
		radial.addColorStop(1, 'rgba(255,184,77,0)');
		ctx.fillStyle = radial;
		ctx.beginPath();
		ctx.arc(center, center, 104, 0, Math.PI * 2);
		ctx.fill();
	});
}

const sparkTexture = createSparkTexture();

const texturedParticleOptions = {
	blending: AdditiveBlending,
	depthWrite: false,
	alphaTest: 0.01,
	texture: sparkTexture,
};

function createSparkPreset(
	color: string,
	{
		count,
		duration,
		life,
		speed,
		size,
		shapeRadius,
		speedFactor,
		lengthFactor,
	}: {
		count: number;
		duration: number;
		life: [number, number];
		speed: [number, number];
		size: [number, number];
		shapeRadius: number;
		speedFactor: number;
		lengthFactor: number;
	},
) {
	return particlePresets.fire.spark({
		...texturedParticleOptions,
		color,
		opacity: 1,
		count,
		duration,
		life,
		speed,
		size,
		rotation: [-Math.PI, Math.PI],
		shape: {
			type: 'sphere',
			radius: shapeRadius,
			thickness: 1,
			speed: [0.45, 1.15],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#ffffff', 0],
					[color, 0.25],
					[color, 1],
				],
				alpha: [
					[0.14, 0],
					[1, 0.12],
					[0.45, 0.58],
					[0, 1],
				],
			},
			sizeOverLife: [0.42, 1, 0.7, 0.06],
			speedOverLife: [1.16, 0.88, 0.4, 0.06],
		},
		rendererEmitterSettings: {
			speedFactor,
			lengthFactor,
		},
	});
}

function createParticlePool(
	name: string,
	count: number,
	preset: ReturnType<typeof particlePresets.fire.spark>,
) {
	const systems = Array.from({ length: count }, (_, index) =>
		createParticleSystem({
			name: `${name}-${index + 1}`,
			preset,
			autoplay: false,
		}),
	);
	let nextIndex = 0;

	return {
		entities: systems,
		play(position: Vector3, angle = 0) {
			const system = systems[nextIndex % systems.length]!;
			nextIndex += 1;
			alignParticleSystem(system, position, angle);
			system.restart();
		},
		stop() {
			for (const system of systems) {
				system.stop();
			}
		},
	} satisfies ParticlePool;
}

export function alignParticleSystem(
	system: ParticleSystemEntity,
	position: Vector3,
	angle: number,
) {
	system.setPosition(position.x, position.y, position.z);
	system.setRotation(0, 0, angle);
}

export function createSpaceInvadersEffects() {
	const playerMuzzle = createParticlePool(
		'3d-space-invaders-player-muzzle',
		3,
		createSparkPreset('#fde68a', {
			count: 10,
			duration: 0.18,
			life: [0.08, 0.18],
			speed: [0.8, 1.9],
			size: [0.1, 0.24],
			shapeRadius: 0.05,
			speedFactor: 0.34,
			lengthFactor: 0.98,
		}),
	);
	const enemyMuzzles: Record<EnemyKind, ParticlePool> = {
		sine: createParticlePool(
			'3d-space-invaders-sine-muzzle',
			5,
			createSparkPreset(ENEMY_COLORS.sine, {
				count: 10,
				duration: 0.18,
				life: [0.08, 0.17],
				speed: [0.75, 1.85],
				size: [0.1, 0.22],
				shapeRadius: 0.05,
				speedFactor: 0.34,
				lengthFactor: 0.98,
			}),
		),
		circle: createParticlePool(
			'3d-space-invaders-circle-muzzle',
			5,
			createSparkPreset(ENEMY_COLORS.circle, {
				count: 10,
				duration: 0.18,
				life: [0.08, 0.17],
				speed: [0.75, 1.85],
				size: [0.1, 0.22],
				shapeRadius: 0.05,
				speedFactor: 0.34,
				lengthFactor: 0.98,
			}),
		),
		charge: createParticlePool(
			'3d-space-invaders-charge-muzzle',
			5,
			createSparkPreset(ENEMY_COLORS.charge, {
				count: 10,
				duration: 0.18,
				life: [0.08, 0.17],
				speed: [0.75, 1.85],
				size: [0.1, 0.22],
				shapeRadius: 0.05,
				speedFactor: 0.34,
				lengthFactor: 0.98,
			}),
		),
	};
	const impactBurst = createParticlePool(
		'3d-space-invaders-impact',
		6,
		createSparkPreset('#fbbf24', {
			count: 14,
			duration: 0.28,
			life: [0.12, 0.24],
			speed: [1.5, 3.8],
			size: [0.11, 0.28],
			shapeRadius: 0.06,
			speedFactor: 0.38,
			lengthFactor: 1,
		}),
	);
	const enemyDeaths: Record<EnemyKind, ParticlePool> = {
		sine: createParticlePool(
			'3d-space-invaders-sine-death',
			4,
			createSparkPreset(ENEMY_COLORS.sine, {
				count: 22,
				duration: 0.48,
				life: [0.24, 0.52],
				speed: [2.4, 5.6],
				size: [0.18, 0.48],
				shapeRadius: 0.16,
				speedFactor: 0.48,
				lengthFactor: 1.08,
			}),
		),
		circle: createParticlePool(
			'3d-space-invaders-circle-death',
			4,
			createSparkPreset(ENEMY_COLORS.circle, {
				count: 22,
				duration: 0.48,
				life: [0.24, 0.52],
				speed: [2.4, 5.6],
				size: [0.18, 0.48],
				shapeRadius: 0.16,
				speedFactor: 0.48,
				lengthFactor: 1.08,
			}),
		),
		charge: createParticlePool(
			'3d-space-invaders-charge-death',
			4,
			createSparkPreset(ENEMY_COLORS.charge, {
				count: 22,
				duration: 0.48,
				life: [0.24, 0.52],
				speed: [2.4, 5.6],
				size: [0.18, 0.48],
				shapeRadius: 0.16,
				speedFactor: 0.48,
				lengthFactor: 1.08,
			}),
		),
	};
	const playerDeath = createParticlePool(
		'3d-space-invaders-player-death',
		2,
		createSparkPreset(PLAYER_COLOR, {
			count: 28,
			duration: 0.56,
			life: [0.28, 0.62],
			speed: [2.7, 6.2],
			size: [0.2, 0.54],
			shapeRadius: 0.18,
			speedFactor: 0.56,
			lengthFactor: 1.12,
		}),
	);

	const allPools = [
		playerMuzzle,
		impactBurst,
		playerDeath,
		...Object.values(enemyMuzzles),
		...Object.values(enemyDeaths),
	];

	return {
		entities: allPools.flatMap((pool) => pool.entities),
		playPlayerMuzzle(position: Vector3, angle = 0) {
			playerMuzzle.play(position, angle);
		},
		playEnemyMuzzle(kind: EnemyKind, position: Vector3, angle = Math.PI) {
			enemyMuzzles[kind].play(position, angle);
		},
		playImpact(position: Vector3, angle = 0) {
			impactBurst.play(position, angle);
		},
		playEnemyDeath(kind: EnemyKind, position: Vector3) {
			enemyDeaths[kind].play(position, 0);
		},
		playPlayerDeath(position: Vector3) {
			playerDeath.play(position, 0);
		},
		stopAll() {
			for (const pool of allPools) {
				pool.stop();
			}
		},
	};
}
