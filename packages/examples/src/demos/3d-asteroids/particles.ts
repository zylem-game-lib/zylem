import {
	AdditiveBlending,
	CanvasTexture,
	Color,
	LinearFilter,
	MeshBasicMaterial,
	SRGBColorSpace,
	Texture,
	Vector3,
} from 'three';
import { QUARKS, createParticleSystem } from '@zylem/game-lib';
import type { AlphaStop, ColorStop } from './shared';

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

function toQuarksColor(color: string) {
	const parsed = new Color(color);
	return new QUARKS.Vector3(parsed.r, parsed.g, parsed.b);
}

function gradient(colors: readonly ColorStop[], alpha: readonly AlphaStop[]) {
	return new QUARKS.Gradient(
		colors.map(([color, stop]) => [toQuarksColor(color), stop] as [QUARKS.Vector3, number]),
		alpha.map(([value, stop]) => [value, stop] as [number, number]),
	);
}

function curve(...points: number[]) {
	return new QUARKS.PiecewiseBezier([
		[
			new QUARKS.Bezier(
				points[0] ?? 0,
				points[1] ?? points[0] ?? 0,
				points[2] ?? points[1] ?? points[0] ?? 0,
				points[3] ?? points[2] ?? points[1] ?? points[0] ?? 0,
			),
			0,
		],
	]);
}

function createParticleMaterial(
	texture: Texture,
	color: string,
	opacity = 1,
) {
	return new MeshBasicMaterial({
		map: texture,
		color,
		transparent: true,
		opacity,
		depthWrite: false,
		alphaTest: 0.01,
		blending: AdditiveBlending,
	});
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

const thrusterEffect = {
	create: () =>
		new QUARKS.ParticleSystem({
			duration: 2,
			looping: true,
			worldSpace: false,
			startLife: new QUARKS.IntervalValue(0.22, 0.42),
			startSpeed: new QUARKS.IntervalValue(0.65, 1.1),
			startSize: new QUARKS.IntervalValue(0.24, 0.42),
			startRotation: new QUARKS.IntervalValue(-0.18, 0.18),
			startColor: new QUARKS.ConstantColor(new QUARKS.Vector4(1, 0.8, 0.38, 1)),
			emissionOverTime: new QUARKS.ConstantValue(30),
			shape: new QUARKS.ConeEmitter({
				radius: 0.05,
				thickness: 1,
				angle: 0.18,
				speed: new QUARKS.IntervalValue(0.45, 0.9),
			}),
			material: createParticleMaterial(thrusterTexture, '#ffb14d', 0.94),
			behaviors: [
				new QUARKS.ColorOverLife(
					gradient(
						[
							['#fff7d1', 0],
							['#fbbf24', 0.25],
							['#fb923c', 0.65],
							['#ef4444', 1],
						],
						[
							[0.14, 0],
							[0.92, 0.12],
							[0.46, 0.55],
							[0, 1],
						],
					),
				),
				new QUARKS.SizeOverLife(curve(0.32, 0.85, 1.1, 0.08)),
				new QUARKS.SpeedOverLife(curve(1.1, 0.92, 0.58, 0.08)),
				new QUARKS.Noise(
					new QUARKS.ConstantValue(3),
					new QUARKS.ConstantValue(0.08),
					new QUARKS.ConstantValue(0.35),
					new QUARKS.ConstantValue(0.18),
				),
			],
			renderMode: QUARKS.RenderMode.VerticalBillBoard,
		}),
};

const burstEffect = {
	create: () =>
		new QUARKS.ParticleSystem({
			duration: 0.32,
			looping: false,
			worldSpace: false,
			startLife: new QUARKS.IntervalValue(0.12, 0.25),
			startSpeed: new QUARKS.IntervalValue(1.6, 4.2),
			startSize: new QUARKS.IntervalValue(0.12, 0.28),
			startRotation: new QUARKS.IntervalValue(-Math.PI, Math.PI),
			startColor: new QUARKS.ConstantColor(new QUARKS.Vector4(1, 0.9, 0.6, 1)),
			emissionOverTime: new QUARKS.ConstantValue(0),
			emissionBursts: [
				{
					time: 0,
					count: new QUARKS.ConstantValue(12),
					cycle: 1,
					interval: 0,
					probability: 1,
				},
			],
			shape: new QUARKS.SphereEmitter({
				radius: 0.06,
				thickness: 0.95,
				speed: new QUARKS.IntervalValue(0.55, 1.2),
			}),
			material: createParticleMaterial(sparkTexture, '#ffd166', 1),
			behaviors: [
				new QUARKS.ColorOverLife(
					gradient(
						[
							['#ffffff', 0],
							['#fde68a', 0.28],
							['#fb923c', 1],
						],
						[
							[0.2, 0],
							[1, 0.15],
							[0.35, 0.6],
							[0, 1],
						],
					),
				),
				new QUARKS.SizeOverLife(curve(0.45, 0.94, 0.72, 0.04)),
				new QUARKS.SpeedOverLife(curve(1.2, 0.84, 0.42, 0.05)),
			],
			renderMode: QUARKS.RenderMode.StretchedBillBoard,
			rendererEmitterSettings: {
				speedFactor: 0.35,
				lengthFactor: 0.95,
			},
		}),
};

const shipDeathEffect = {
	create: () =>
		new QUARKS.ParticleSystem({
			duration: 0.55,
			looping: false,
			worldSpace: false,
			startLife: new QUARKS.IntervalValue(0.3, 0.65),
			startSpeed: new QUARKS.IntervalValue(2.8, 6.4),
			startSize: new QUARKS.IntervalValue(0.2, 0.5),
			startRotation: new QUARKS.IntervalValue(-Math.PI, Math.PI),
			startColor: new QUARKS.ConstantColor(new QUARKS.Vector4(1, 0.8, 0.45, 1)),
			emissionOverTime: new QUARKS.ConstantValue(0),
			emissionBursts: [
				{
					time: 0,
					count: new QUARKS.ConstantValue(28),
					cycle: 1,
					interval: 0,
					probability: 1,
				},
			],
			shape: new QUARKS.SphereEmitter({
				radius: 0.18,
				thickness: 1,
				speed: new QUARKS.IntervalValue(0.9, 1.8),
			}),
			material: createParticleMaterial(sparkTexture, '#ffb347', 1),
			behaviors: [
				new QUARKS.ColorOverLife(
					gradient(
						[
							['#ffffff', 0],
							['#fde68a', 0.18],
							['#fb923c', 0.58],
							['#ef4444', 1],
						],
						[
							[0.18, 0],
							[1, 0.08],
							[0.55, 0.55],
							[0, 1],
						],
					),
				),
				new QUARKS.SizeOverLife(curve(0.5, 1.1, 0.95, 0.08)),
				new QUARKS.SpeedOverLife(curve(1.25, 0.95, 0.45, 0.06)),
			],
			renderMode: QUARKS.RenderMode.StretchedBillBoard,
			rendererEmitterSettings: {
				speedFactor: 0.55,
				lengthFactor: 1.1,
			},
		}),
};

export function createAsteroidParticles() {
	return {
		thrusterParticles: createParticleSystem({
			name: '3d-asteroids-thruster',
			effect: thrusterEffect,
			autoplay: false,
		}),
		muzzleFlash: createParticleSystem({
			name: '3d-asteroids-muzzle',
			effect: burstEffect,
			autoplay: false,
		}),
		impactBurst: createParticleSystem({
			name: '3d-asteroids-impact',
			effect: burstEffect,
			autoplay: false,
		}),
		shipDeathBurst: createParticleSystem({
			name: '3d-asteroids-ship-death',
			effect: shipDeathEffect,
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
