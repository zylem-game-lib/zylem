import {
	AdditiveBlending,
	CanvasTexture,
	LinearFilter,
	SRGBColorSpace,
	Vector3,
} from 'three';
import { createParticleSystem, particlePresets } from '@zylem/game-lib';

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

function createThrusterTexture() {
	return createTexture((ctx, size, center) => {
		ctx.clearRect(0, 0, size, size);
		ctx.translate(center, center + 28);

		const glow = ctx.createRadialGradient(0, -18, 12, 0, -18, 96);
		glow.addColorStop(0, 'rgba(255, 232, 168, 0.95)');
		glow.addColorStop(0.42, 'rgba(255, 143, 55, 0.58)');
		glow.addColorStop(1, 'rgba(255, 64, 10, 0)');
		ctx.fillStyle = glow;
		ctx.beginPath();
		ctx.arc(0, -8, 82, 0, Math.PI * 2);
		ctx.fill();

		const flame = ctx.createLinearGradient(0, 76, 0, -120);
		flame.addColorStop(0, 'rgba(255, 51, 13, 0)');
		flame.addColorStop(0.18, 'rgba(255, 118, 31, 0.88)');
		flame.addColorStop(0.55, 'rgba(255, 210, 84, 0.95)');
		flame.addColorStop(1, 'rgba(255, 255, 255, 0)');
		ctx.fillStyle = flame;
		ctx.beginPath();
		ctx.moveTo(0, -116);
		ctx.bezierCurveTo(46, -70, 58, -12, 10, 84);
		ctx.bezierCurveTo(2, 96, -2, 96, -10, 84);
		ctx.bezierCurveTo(-58, -12, -46, -70, 0, -116);
		ctx.closePath();
		ctx.fill();
	});
}

function createSparkTexture() {
	return createTexture((ctx, size, center) => {
		ctx.clearRect(0, 0, size, size);
		const radial = ctx.createRadialGradient(center, center, 6, center, center, 104);
		radial.addColorStop(0, 'rgba(255,255,255,0.95)');
		radial.addColorStop(0.25, 'rgba(255,241,181,0.82)');
		radial.addColorStop(0.55, 'rgba(251,146,60,0.44)');
		radial.addColorStop(1, 'rgba(251,146,60,0)');
		ctx.fillStyle = radial;
		ctx.beginPath();
		ctx.arc(center, center, 104, 0, Math.PI * 2);
		ctx.fill();
	});
}

const thrusterTexture = createThrusterTexture();
const sparkTexture = createSparkTexture();

const texturedParticleOptions = {
	blending: AdditiveBlending,
	depthWrite: false,
	alphaTest: 0.01,
};

const thrusterPreset = particlePresets.fire.flamelet({
	...texturedParticleOptions,
	texture: thrusterTexture,
	color: '#ffb14d',
	opacity: 0.94,
	duration: 2,
	life: [0.22, 0.42],
	speed: [0.65, 1.1],
	size: [0.24, 0.42],
	rotation: [-0.18, 0.18],
	emissionRate: 30,
	shape: {
		type: 'cone',
		radius: 0.05,
		thickness: 1,
		angle: 0.18,
		speed: [0.45, 0.9],
	},
	behaviors: {
		colorOverLife: {
			colors: [
				['#fff7d1', 0],
				['#fbbf24', 0.25],
				['#fb923c', 0.65],
				['#ef4444', 1],
			],
			alpha: [
				[0.14, 0],
				[0.92, 0.12],
				[0.46, 0.55],
				[0, 1],
			],
		},
		sizeOverLife: [0.32, 0.85, 1.1, 0.08],
		speedOverLife: [1.1, 0.92, 0.58, 0.08],
		forceOverLife: null,
		noise: {
			frequency: 3,
			power: 0.08,
			positionAmount: 0.35,
			rotationAmount: 0.18,
		},
	},
});

const burstPreset = particlePresets.fire.spark({
	...texturedParticleOptions,
	texture: sparkTexture,
	color: '#ffd166',
	opacity: 1,
	count: 12,
	duration: 0.32,
	life: [0.12, 0.25],
	speed: [1.6, 4.2],
	size: [0.12, 0.28],
	rotation: [-Math.PI, Math.PI],
	shape: {
		type: 'sphere',
		radius: 0.06,
		thickness: 0.95,
		speed: [0.55, 1.2],
	},
	behaviors: {
		colorOverLife: {
			colors: [
				['#ffffff', 0],
				['#fde68a', 0.28],
				['#fb923c', 1],
			],
			alpha: [
				[0.2, 0],
				[1, 0.15],
				[0.35, 0.6],
				[0, 1],
			],
		},
		sizeOverLife: [0.45, 0.94, 0.72, 0.04],
		speedOverLife: [1.2, 0.84, 0.42, 0.05],
	},
	rendererEmitterSettings: {
		speedFactor: 0.35,
		lengthFactor: 0.95,
	},
});

const shipDeathPreset = particlePresets.fire.spark({
	...texturedParticleOptions,
	texture: sparkTexture,
	color: '#ffb347',
	opacity: 1,
	count: 28,
	duration: 0.55,
	life: [0.3, 0.65],
	speed: [2.8, 6.4],
	size: [0.2, 0.5],
	rotation: [-Math.PI, Math.PI],
	shape: {
		type: 'sphere',
		radius: 0.18,
		thickness: 1,
		speed: [0.9, 1.8],
	},
	behaviors: {
		colorOverLife: {
			colors: [
				['#ffffff', 0],
				['#fde68a', 0.18],
				['#fb923c', 0.58],
				['#ef4444', 1],
			],
			alpha: [
				[0.18, 0],
				[1, 0.08],
				[0.55, 0.55],
				[0, 1],
			],
		},
		sizeOverLife: [0.5, 1.1, 0.95, 0.08],
		speedOverLife: [1.25, 0.95, 0.45, 0.06],
	},
	rendererEmitterSettings: {
		speedFactor: 0.55,
		lengthFactor: 1.1,
	},
});

export function createAsteroidParticles() {
	return {
		thrusterParticles: createParticleSystem({
			name: '3d-asteroids-thruster',
			preset: thrusterPreset,
			autoplay: false,
		}),
		muzzleFlash: createParticleSystem({
			name: '3d-asteroids-muzzle',
			preset: burstPreset,
			autoplay: false,
		}),
		impactBurst: createParticleSystem({
			name: '3d-asteroids-impact',
			preset: burstPreset,
			autoplay: false,
		}),
		shipDeathBurst: createParticleSystem({
			name: '3d-asteroids-ship-death',
			preset: shipDeathPreset,
			autoplay: false,
		}),
	};
}

export function alignParticleSystem(
	system: ReturnType<typeof createParticleSystem>,
	position: Vector3,
	angle: number,
) {
	system.setPosition(position.x, position.y, position.z);
	system.setRotation(0, 0, angle);
}
