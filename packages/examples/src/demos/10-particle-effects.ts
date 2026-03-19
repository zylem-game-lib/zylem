import {
	AdditiveBlending,
	CanvasTexture,
	Color,
	LinearFilter,
	MeshBasicMaterial,
	NormalBlending,
	SRGBColorSpace,
	Texture,
	Vector3,
} from 'three';
import {
	QUARKS,
	createBox,
	createCamera,
	createGame,
	createParticleSystem,
	createStage,
	createText,
} from '@zylem/game-lib';

type ColorStop = readonly [string, number];
type AlphaStop = readonly [number, number];

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
	{
		blending = AdditiveBlending,
		opacity = 1,
	}: {
		blending?: typeof AdditiveBlending | typeof NormalBlending;
		opacity?: number;
	} = {},
) {
	return new MeshBasicMaterial({
		map: texture,
		color,
		transparent: true,
		opacity,
		depthWrite: false,
		alphaTest: 0.01,
		blending,
	});
}

function drawSoftBlob(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	radius: number,
	colorStops: Array<[number, string]>,
) {
	const gradientFill = ctx.createRadialGradient(x, y, radius * 0.14, x, y, radius);
	for (const [stop, color] of colorStops) {
		gradientFill.addColorStop(stop, color);
	}

	ctx.fillStyle = gradientFill;
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.fill();
}

function createSmokeTexture() {
	return createTexture((ctx, size, center) => {
		ctx.clearRect(0, 0, size, size);
		ctx.globalCompositeOperation = 'screen';

		drawSoftBlob(ctx, center - 28, center + 22, 58, [
			[0, 'rgba(255,255,255,0.42)'],
			[0.45, 'rgba(191,203,214,0.28)'],
			[1, 'rgba(91,104,116,0)'],
		]);
		drawSoftBlob(ctx, center + 34, center + 10, 52, [
			[0, 'rgba(240,244,248,0.36)'],
			[0.5, 'rgba(171,184,196,0.26)'],
			[1, 'rgba(82,95,108,0)'],
		]);
		drawSoftBlob(ctx, center, center - 26, 72, [
			[0, 'rgba(255,255,255,0.3)'],
			[0.5, 'rgba(205,214,221,0.21)'],
			[1, 'rgba(83,94,105,0)'],
		]);
	});
}

function createFireTexture() {
	return createTexture((ctx, size, center) => {
		ctx.clearRect(0, 0, size, size);
		ctx.translate(center, center + 34);

		const glow = ctx.createRadialGradient(0, -26, 10, 0, -26, 104);
		glow.addColorStop(0, 'rgba(255, 222, 128, 0.85)');
		glow.addColorStop(0.45, 'rgba(255, 132, 49, 0.45)');
		glow.addColorStop(1, 'rgba(255, 64, 16, 0)');
		ctx.fillStyle = glow;
		ctx.beginPath();
		ctx.arc(0, -18, 92, 0, Math.PI * 2);
		ctx.fill();

		const flame = ctx.createLinearGradient(0, 74, 0, -122);
		flame.addColorStop(0, 'rgba(255, 54, 20, 0)');
		flame.addColorStop(0.18, 'rgba(255, 86, 28, 0.88)');
		flame.addColorStop(0.48, 'rgba(255, 162, 49, 0.98)');
		flame.addColorStop(0.72, 'rgba(255, 224, 116, 0.86)');
		flame.addColorStop(1, 'rgba(255, 252, 219, 0)');
		ctx.fillStyle = flame;
		ctx.beginPath();
		ctx.moveTo(0, -112);
		ctx.bezierCurveTo(60, -72, 72, -8, 14, 84);
		ctx.bezierCurveTo(6, 96, -4, 96, -14, 84);
		ctx.bezierCurveTo(-72, -8, -60, -72, 0, -112);
		ctx.closePath();
		ctx.fill();

		const core = ctx.createLinearGradient(0, 70, 0, -84);
		core.addColorStop(0, 'rgba(255, 210, 84, 0)');
		core.addColorStop(0.25, 'rgba(255, 232, 135, 0.76)');
		core.addColorStop(0.68, 'rgba(255, 250, 225, 0.95)');
		core.addColorStop(1, 'rgba(255, 255, 255, 0)');
		ctx.fillStyle = core;
		ctx.beginPath();
		ctx.moveTo(0, -82);
		ctx.bezierCurveTo(24, -46, 26, 2, 6, 66);
		ctx.bezierCurveTo(2, 74, -2, 74, -6, 66);
		ctx.bezierCurveTo(-26, 2, -24, -46, 0, -82);
		ctx.closePath();
		ctx.fill();
	});
}

function createWaterTexture() {
	return createTexture((ctx, size, center) => {
		ctx.clearRect(0, 0, size, size);
		ctx.translate(center, center + 10);

		const body = ctx.createLinearGradient(0, 90, 0, -112);
		body.addColorStop(0, 'rgba(13, 148, 221, 0)');
		body.addColorStop(0.22, 'rgba(56, 189, 248, 0.82)');
		body.addColorStop(0.58, 'rgba(125, 211, 252, 0.92)');
		body.addColorStop(1, 'rgba(239, 249, 255, 0)');
		ctx.fillStyle = body;
		ctx.beginPath();
		ctx.moveTo(0, -104);
		ctx.bezierCurveTo(58, -42, 70, 8, 0, 100);
		ctx.bezierCurveTo(-70, 8, -58, -42, 0, -104);
		ctx.closePath();
		ctx.fill();

		const highlight = ctx.createLinearGradient(-10, 58, -26, -84);
		highlight.addColorStop(0, 'rgba(255,255,255,0)');
		highlight.addColorStop(0.45, 'rgba(255,255,255,0.4)');
		highlight.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = highlight;
		ctx.beginPath();
		ctx.moveTo(-10, -62);
		ctx.bezierCurveTo(-44, -16, -34, 22, -8, 58);
		ctx.bezierCurveTo(2, 42, 4, 2, -10, -62);
		ctx.closePath();
		ctx.fill();
	});
}

function createElectricTexture() {
	return createTexture((ctx, size, center) => {
		ctx.clearRect(0, 0, size, size);
		ctx.translate(center, center);

		const segments = [
			[-36, -96],
			[12, -28],
			[-14, -28],
			[42, 34],
			[10, 34],
			[-28, 96],
		] as const;

		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.shadowColor = 'rgba(129, 230, 255, 0.9)';
		ctx.shadowBlur = 28;
		ctx.strokeStyle = 'rgba(153, 246, 255, 0.92)';
		ctx.lineWidth = 26;
		ctx.beginPath();
		ctx.moveTo(segments[0][0], segments[0][1]);
		for (const [x, y] of segments.slice(1)) {
			ctx.lineTo(x, y);
		}
		ctx.stroke();

		ctx.shadowBlur = 12;
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.98)';
		ctx.lineWidth = 10;
		ctx.beginPath();
		ctx.moveTo(segments[0][0], segments[0][1]);
		for (const [x, y] of segments.slice(1)) {
			ctx.lineTo(x, y);
		}
		ctx.stroke();
	});
}

const smokeTexture = createSmokeTexture();
const fireTexture = createFireTexture();
const waterTexture = createWaterTexture();
const electricTexture = createElectricTexture();

const smokeEffect = {
	create: () =>
		new QUARKS.ParticleSystem({
			duration: 4,
			looping: true,
			worldSpace: false,
			startLife: new QUARKS.IntervalValue(2.6, 3.8),
			startSpeed: new QUARKS.IntervalValue(0.12, 0.32),
			startSize: new QUARKS.IntervalValue(0.45, 0.82),
			startRotation: new QUARKS.IntervalValue(-Math.PI, Math.PI),
			startColor: new QUARKS.ConstantColor(
				new QUARKS.Vector4(0.9, 0.94, 0.97, 0.22),
			),
			emissionOverTime: new QUARKS.ConstantValue(16),
			shape: new QUARKS.ConeEmitter({
				radius: 0.18,
				thickness: 0.85,
				angle: 0.45,
				speed: new QUARKS.IntervalValue(0.02, 0.08),
			}),
			material: createParticleMaterial(smokeTexture, '#d6dde3', {
				blending: NormalBlending,
				opacity: 0.9,
			}),
			behaviors: [
				new QUARKS.ColorOverLife(
					gradient(
						[
							['#e2e8f0', 0],
							['#b8c1ca', 0.35],
							['#6b7280', 1],
						],
						[
							[0.06, 0],
							[0.26, 0.14],
							[0.22, 0.55],
							[0, 1],
						],
					),
				),
				new QUARKS.SizeOverLife(curve(0.35, 0.88, 1.45, 2.1)),
				new QUARKS.ForceOverLife(
					new QUARKS.ConstantValue(0),
					curve(0.1, 0.2, 0.28, 0.42),
					new QUARKS.ConstantValue(0),
				),
				new QUARKS.Noise(
					new QUARKS.ConstantValue(0.8),
					new QUARKS.ConstantValue(0.18),
					new QUARKS.ConstantValue(1.15),
					new QUARKS.ConstantValue(0.18),
				),
				new QUARKS.RotationOverLife(
					new QUARKS.IntervalValue(-0.28, 0.28),
				),
			],
			renderMode: QUARKS.RenderMode.BillBoard,
		}),
};

const fireEffect = {
	create: () =>
		new QUARKS.ParticleSystem({
			duration: 2,
			looping: true,
			worldSpace: false,
			startLife: new QUARKS.IntervalValue(0.5, 0.95),
			startSpeed: new QUARKS.IntervalValue(0.55, 1.25),
			startSize: new QUARKS.IntervalValue(0.32, 0.58),
			startRotation: new QUARKS.IntervalValue(-0.22, 0.22),
			startColor: new QUARKS.ConstantColor(
				new QUARKS.Vector4(1, 0.72, 0.3, 1),
			),
			emissionOverTime: new QUARKS.ConstantValue(34),
			shape: new QUARKS.ConeEmitter({
				radius: 0.14,
				thickness: 1,
				angle: 0.28,
				speed: new QUARKS.IntervalValue(0.45, 0.95),
			}),
			material: createParticleMaterial(fireTexture, '#ffb14d', {
				opacity: 0.96,
			}),
			behaviors: [
				new QUARKS.ColorOverLife(
					gradient(
						[
							['#fff7d1', 0],
							['#fbbf24', 0.18],
							['#fb923c', 0.52],
							['#ef4444', 1],
						],
						[
							[0.12, 0],
							[0.95, 0.18],
							[0.72, 0.6],
							[0, 1],
						],
					),
				),
				new QUARKS.SizeOverLife(curve(0.45, 0.9, 1.12, 0.18)),
				new QUARKS.SpeedOverLife(curve(1.1, 0.95, 0.62, 0.15)),
				new QUARKS.ForceOverLife(
					new QUARKS.ConstantValue(0),
					new QUARKS.ConstantValue(0.48),
					new QUARKS.ConstantValue(0),
				),
				new QUARKS.Noise(
					new QUARKS.ConstantValue(5),
					new QUARKS.ConstantValue(0.12),
					new QUARKS.ConstantValue(0.55),
					new QUARKS.ConstantValue(0.4),
				),
				new QUARKS.RotationOverLife(
					new QUARKS.IntervalValue(-0.6, 0.6),
				),
			],
			renderMode: QUARKS.RenderMode.VerticalBillBoard,
		}),
};

const waterEffect = {
	create: () =>
		new QUARKS.ParticleSystem({
			duration: 2.2,
			looping: true,
			worldSpace: false,
			startLife: new QUARKS.IntervalValue(0.85, 1.15),
			startSpeed: new QUARKS.IntervalValue(2.4, 3.2),
			startSize: new QUARKS.IntervalValue(0.13, 0.2),
			startColor: new QUARKS.ConstantColor(
				new QUARKS.Vector4(0.75, 0.94, 1, 1),
			),
			emissionOverTime: new QUARKS.ConstantValue(44),
			shape: new QUARKS.ConeEmitter({
				radius: 0.08,
				thickness: 0.65,
				angle: 0.22,
				speed: new QUARKS.IntervalValue(1.3, 2.2),
			}),
			material: createParticleMaterial(waterTexture, '#7dd3fc', {
				opacity: 0.9,
			}),
			behaviors: [
				new QUARKS.ColorOverLife(
					gradient(
						[
							['#effcff', 0],
							['#a5f3fc', 0.35],
							['#38bdf8', 1],
						],
						[
							[0, 0],
							[0.72, 0.08],
							[0.55, 0.58],
							[0, 1],
						],
					),
				),
				new QUARKS.SizeOverLife(curve(0.72, 0.94, 0.82, 0.3)),
				new QUARKS.SpeedOverLife(curve(1.04, 0.92, 0.68, 0.38)),
				new QUARKS.ForceOverLife(
					new QUARKS.ConstantValue(0),
					new QUARKS.ConstantValue(-5.8),
					new QUARKS.ConstantValue(0),
				),
				new QUARKS.Noise(
					new QUARKS.ConstantValue(1.5),
					new QUARKS.ConstantValue(0.06),
					new QUARKS.ConstantValue(0.18),
					new QUARKS.ConstantValue(0.05),
				),
			],
			renderMode: QUARKS.RenderMode.StretchedBillBoard,
			rendererEmitterSettings: {
				speedFactor: 0.38,
				lengthFactor: 0.65,
			},
		}),
};

const electricityEffect = {
	create: () =>
		new QUARKS.ParticleSystem({
			duration: 0.9,
			looping: true,
			worldSpace: false,
			startLife: new QUARKS.IntervalValue(0.16, 0.34),
			startSpeed: new QUARKS.IntervalValue(0.45, 1.1),
			startSize: new QUARKS.IntervalValue(0.2, 0.38),
			startRotation: new QUARKS.IntervalValue(-Math.PI, Math.PI),
			startColor: new QUARKS.ConstantColor(
				new QUARKS.Vector4(0.84, 0.98, 1, 1),
			),
			emissionOverTime: new QUARKS.ConstantValue(0),
			emissionBursts: [
				{
					time: 0,
					count: new QUARKS.ConstantValue(7),
					cycle: 1,
					interval: 0,
					probability: 1,
				},
				{
					time: 0.12,
					count: new QUARKS.ConstantValue(5),
					cycle: 1,
					interval: 0,
					probability: 1,
				},
				{
					time: 0.28,
					count: new QUARKS.ConstantValue(8),
					cycle: 1,
					interval: 0,
					probability: 1,
				},
			],
			shape: new QUARKS.SphereEmitter({
				radius: 0.28,
				thickness: 0.95,
				speed: new QUARKS.IntervalValue(0.18, 0.52),
			}),
			material: createParticleMaterial(electricTexture, '#a5f3fc', {
				opacity: 0.98,
			}),
			behaviors: [
				new QUARKS.ColorOverLife(
					gradient(
						[
							['#ffffff', 0],
							['#a5f3fc', 0.35],
							['#60a5fa', 1],
						],
						[
							[0, 0],
							[1, 0.18],
							[0.75, 0.55],
							[0, 1],
						],
					),
				),
				new QUARKS.SizeOverLife(curve(0.25, 0.88, 0.95, 0.05)),
				new QUARKS.Noise(
					new QUARKS.ConstantValue(13),
					new QUARKS.ConstantValue(0.22),
					new QUARKS.ConstantValue(1.1),
					new QUARKS.ConstantValue(0.2),
				),
				new QUARKS.OrbitOverLife(
					new QUARKS.ConstantValue(13),
					new QUARKS.Vector3(0, 1, 0),
				),
				new QUARKS.RotationOverLife(
					new QUARKS.IntervalValue(-8, 8),
				),
			],
			renderMode: QUARKS.RenderMode.StretchedBillBoard,
			rendererEmitterSettings: {
				speedFactor: 0.24,
				lengthFactor: 1.15,
			},
		}),
};

const stations = [
	{
		name: 'Smoke',
		description: 'soft billboard plume with noise and upward drift',
		position: { x: -4.3, y: 0.68, z: -4.2 },
		labelColor: '#cbd5e1',
		padColor: '#334155',
		columnColor: '#475569',
		effect: smokeEffect,
	},
	{
		name: 'Fire',
		description: 'vertical flame texture with hot core and flicker',
		position: { x: 4.3, y: 0.68, z: -4.2 },
		labelColor: '#fb923c',
		padColor: '#4a2315',
		columnColor: '#7c2d12',
		effect: fireEffect,
	},
	{
		name: 'Water',
		description: 'stretched droplets pushed up then pulled down',
		position: { x: -4.3, y: 0.68, z: 4.2 },
		labelColor: '#67e8f9',
		padColor: '#123247',
		columnColor: '#0ea5e9',
		effect: waterEffect,
	},
	{
		name: 'Electricity',
		description: 'bursting bolts with orbit, noise, and glow',
		position: { x: 4.3, y: 0.68, z: 4.2 },
		labelColor: '#a5f3fc',
		padColor: '#1f2c4f',
		columnColor: '#60a5fa',
		effect: electricityEffect,
	},
] as const;

export default function createDemo() {
	const camera = createCamera({
		position: { x: 0, y: 6.8, z: 11.5 },
		target: { x: 0, y: 1.4, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: new Color('#061018'),
			gravity: new Vector3(0, 0, 0),
		},
		camera,
	);

	const floor = createBox({
		name: 'particle-floor',
		position: { x: 0, y: -0.4, z: 0 },
		size: { x: 22, y: 0.8, z: 22 },
		collision: { static: true },
		material: {
			color: new Color('#0e2232'),
		},
	});

	const centerStage = createBox({
		name: 'particle-center-stage',
		position: { x: 0, y: 0.04, z: 0 },
		size: { x: 4.6, y: 0.08, z: 4.6 },
		collision: { static: true },
		material: {
			color: new Color('#123347'),
		},
	});

	const titleText = createText({
		name: 'particle-title',
		text: 'QUARKS textured particles: smoke, fire, water, and electricity.',
		fontSize: 18,
		fontColor: '#f8fafc',
		backgroundColor: '#102434',
		padding: 8,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.07 },
	});

	const statusText = createText({
		name: 'particle-status',
		text: 'Each station uses a custom CanvasTexture plus different emitter and behavior tuning.',
		fontSize: 15,
		fontColor: '#cbd5e1',
		backgroundColor: '#102c3d',
		padding: 8,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.12 },
	});

	stage.add(floor, centerStage, titleText, statusText);

	for (const station of stations) {
		const pad = createBox({
			name: `${station.name.toLowerCase()}-pad`,
			position: { x: station.position.x, y: 0.12, z: station.position.z },
			size: { x: 3.5, y: 0.24, z: 3.5 },
			collision: { static: true },
			material: {
				color: new Color(station.padColor),
			},
		});

		const column = createBox({
			name: `${station.name.toLowerCase()}-column`,
			position: { x: station.position.x, y: 0.54, z: station.position.z },
			size: { x: 0.42, y: 0.84, z: 0.42 },
			collision: { static: true },
			material: {
				color: new Color(station.columnColor),
			},
		});

		const emitter = createParticleSystem({
			name: `${station.name.toLowerCase()}-effect`,
			position: station.position,
			effect: station.effect,
			autoplay: true,
		});

		const label = createText({
			name: `${station.name.toLowerCase()}-label`,
			text: `${station.name}\n${station.description}`,
			position: {
				x: station.position.x,
				y: station.position.y + 2.3,
				z: station.position.z,
			},
			fontSize: 18,
			fontColor: station.labelColor,
			backgroundColor: '#091723',
			padding: 10,
			stickToViewport: false,
		});

		stage.add(pad, column, emitter, label);
	}

	return createGame(
		{
			id: 'particle-effects',
			debug: true,
		},
		stage,
	);
}
