import {
	AdditiveBlending,
	Color,
	MeshBasicMaterial,
	type Blending,
	type ColorRepresentation,
	type MeshBasicMaterialParameters,
	type Texture,
} from 'three';
import {
	Bezier,
	ColorOverLife,
	ConeEmitter,
	ConstantColor,
	ConstantValue,
	ForceOverLife,
	Gradient,
	IntervalValue,
	Noise,
	OrbitOverLife,
	ParticleSystem,
	PiecewiseBezier,
	PointEmitter,
	RenderMode,
	RotationOverLife,
	SizeOverLife,
	SpeedOverLife,
	SphereEmitter,
	Vector3,
	Vector4,
	type Behavior,
	type RendererEmitterSettings,
} from 'three.quarks';

export interface ParticleEffectDefinition {
	create(): ParticleSystem;
}

export interface ParticlePresetMaterialOptions {
	texture?: Texture;
	opacity?: number;
	depthWrite?: boolean;
	alphaTest?: number;
	blending?: Blending;
	uTileCount?: number;
	vTileCount?: number;
	blendTiles?: boolean;
}

export type NumericRange = number | readonly [number, number];
export type CurvePoints = readonly [number, number, number, number];
export type ColorStop = readonly [ColorRepresentation, number];
export type AlphaStop = readonly [number, number];

export interface ParticleColorOverLifeConfig {
	colors: readonly ColorStop[];
	alpha: readonly AlphaStop[];
}

export interface ParticleForceOverLifeConfig {
	x?: NumericRange;
	y?: NumericRange;
	z?: NumericRange;
}

export interface ParticleNoiseConfig {
	frequency: NumericRange;
	power: NumericRange;
	positionAmount?: NumericRange;
	rotationAmount?: NumericRange;
}

export interface ParticleOrbitConfig {
	speed: NumericRange;
	axis?: readonly [number, number, number];
}

export interface ParticleBehaviorConfig {
	colorOverLife?: ParticleColorOverLifeConfig;
	sizeOverLife?: CurvePoints;
	speedOverLife?: CurvePoints;
	rotationOverLife?: NumericRange;
	forceOverLife?: ParticleForceOverLifeConfig;
	noise?: ParticleNoiseConfig;
	orbitOverLife?: ParticleOrbitConfig;
}

export interface ParticleBehaviorOverrides {
	colorOverLife?: ParticleColorOverLifeConfig | null;
	sizeOverLife?: CurvePoints | null;
	speedOverLife?: CurvePoints | null;
	rotationOverLife?: NumericRange | null;
	forceOverLife?: Partial<ParticleForceOverLifeConfig> | null;
	noise?: Partial<ParticleNoiseConfig> | null;
	orbitOverLife?: Partial<ParticleOrbitConfig> | null;
}

export type ParticleShapeConfig =
	| { type: 'point' }
	| {
			type: 'cone';
			radius?: number;
			thickness?: number;
			angle?: number;
			speed?: NumericRange;
	  }
	| {
			type: 'sphere';
			radius?: number;
			thickness?: number;
			speed?: NumericRange;
	  };

type ParticleEmissionConfig =
	| {
			type: 'burst';
			count: number;
	  }
	| {
			type: 'rate';
			rate: number;
	  };

interface SemanticParticleSystemConfig {
	defaults: {
		duration: number;
		looping?: boolean;
		worldSpace?: boolean;
		color: ColorRepresentation;
		life: NumericRange;
		size: NumericRange;
		speed: NumericRange;
		rotation?: NumericRange;
		opacity?: number;
		renderMode?: RenderMode;
	};
	emission: ParticleEmissionConfig;
	shape?: ParticleShapeConfig;
	behaviors?: ParticleBehaviorConfig;
	rendererEmitterSettings?: RendererEmitterSettings;
}

export interface SemanticParticlePresetDefinition<
	Family extends string = string,
	Variant extends string = string,
> {
	family: Family;
	variant: Variant;
	description: string;
	axes: Readonly<Record<string, string>>;
	system: SemanticParticleSystemConfig;
}

export type ParticleMagicAlignment =
	| 'arcane'
	| 'holy'
	| 'corrupted'
	| 'nature'
	| 'void'
	| 'psychic';

export type ParticleMagicTemperament =
	| 'calm'
	| 'ominous'
	| 'playful'
	| 'regal'
	| 'predatory';

export type ParticleMagicAgency =
	| 'passive'
	| 'reactive'
	| 'seeking'
	| 'sentient-feeling';

export type ParticleMagicOrder = 'geometric' | 'organic' | 'chaotic';

export type ParticleMagicRealityEffect =
	| 'warping'
	| 'illuminating'
	| 'binding'
	| 'decaying'
	| 'healing';

export interface ParticleMagicModifierOptions {
	alignment: ParticleMagicAlignment;
	temperament?: ParticleMagicTemperament;
	agency?: ParticleMagicAgency;
	order?: ParticleMagicOrder;
	realityEffect?: ParticleMagicRealityEffect;
	intensity?: number;
}

export type ParticleMagicModifierInput =
	| ParticleMagicAlignment
	| ParticleMagicModifierOptions;

export interface SemanticParticlePresetOptions
	extends ParticlePresetMaterialOptions {
	behaviors?: ParticleBehaviorOverrides;
	color?: ColorRepresentation;
	count?: number;
	duration?: number;
	emissionRate?: number;
	life?: NumericRange;
	looping?: boolean;
	magic?: ParticleMagicModifierInput;
	renderMode?: RenderMode;
	rendererEmitterSettings?: Partial<RendererEmitterSettings>;
	rotation?: NumericRange;
	shape?: ParticleShapeConfig;
	size?: NumericRange;
	speed?: NumericRange;
	worldSpace?: boolean;
}

interface MagicPalette {
	start: ColorRepresentation;
	mid: ColorRepresentation;
	end: ColorRepresentation;
}

const DEFAULT_MAGIC_BEHAVIOR_BY_ALIGNMENT: Record<
	ParticleMagicAlignment,
	Omit<ParticleMagicModifierOptions, 'alignment'>
> = {
	arcane: {
		temperament: 'regal',
		agency: 'reactive',
		order: 'geometric',
		realityEffect: 'warping',
		intensity: 1,
	},
	holy: {
		temperament: 'calm',
		agency: 'passive',
		order: 'geometric',
		realityEffect: 'illuminating',
		intensity: 1,
	},
	corrupted: {
		temperament: 'ominous',
		agency: 'seeking',
		order: 'chaotic',
		realityEffect: 'decaying',
		intensity: 1.05,
	},
	nature: {
		temperament: 'calm',
		agency: 'reactive',
		order: 'organic',
		realityEffect: 'healing',
		intensity: 0.9,
	},
	void: {
		temperament: 'ominous',
		agency: 'seeking',
		order: 'chaotic',
		realityEffect: 'warping',
		intensity: 1.15,
	},
	psychic: {
		temperament: 'predatory',
		agency: 'sentient-feeling',
		order: 'organic',
		realityEffect: 'binding',
		intensity: 1,
	},
};

const MAGIC_PALETTES: Record<ParticleMagicAlignment, MagicPalette> = {
	arcane: {
		start: '#dbeafe',
		mid: '#60a5fa',
		end: '#1d4ed8',
	},
	holy: {
		start: '#fff7d1',
		mid: '#fde68a',
		end: '#f59e0b',
	},
	corrupted: {
		start: '#bef264',
		mid: '#84cc16',
		end: '#4d7c0f',
	},
	nature: {
		start: '#dcfce7',
		mid: '#4ade80',
		end: '#15803d',
	},
	void: {
		start: '#c4b5fd',
		mid: '#475569',
		end: '#0f172a',
	},
	psychic: {
		start: '#fce7f3',
		mid: '#f472b6',
		end: '#db2777',
	},
};

export function particleEffect(
	create: () => ParticleSystem,
): ParticleEffectDefinition {
	return { create };
}

export function defineSemanticParticlePreset<
	T extends SemanticParticlePresetDefinition,
>(preset: T): T {
	return preset;
}

export function createMagicModifier(
	alignment: ParticleMagicAlignment,
	overrides: Omit<ParticleMagicModifierOptions, 'alignment'> = {},
): ParticleMagicModifierOptions {
	return {
		alignment,
		...DEFAULT_MAGIC_BEHAVIOR_BY_ALIGNMENT[alignment],
		...overrides,
	};
}

export function createRangeValue(
	value: NumericRange,
	defaultValue: readonly [number, number],
) {
	if (Array.isArray(value)) {
		const min = value[0] ?? defaultValue[0];
		const max = value[1] ?? defaultValue[1];
		return min === max ? new ConstantValue(min) : new IntervalValue(min, max);
	}

	return new ConstantValue(value as number);
}

export function toColorVector(color: ColorRepresentation): Vector4 {
	const parsed = new Color(color);
	return new Vector4(parsed.r, parsed.g, parsed.b, 1);
}

export function createParticleMaterial(
	color: ColorRepresentation,
	options: ParticlePresetMaterialOptions,
	defaultOpacity?: number,
) {
	const materialOptions: MeshBasicMaterialParameters = {
		color,
		transparent: true,
	};

	if (options.texture) {
		materialOptions.map = options.texture;
		materialOptions.depthWrite = options.depthWrite ?? false;
		materialOptions.alphaTest = options.alphaTest ?? 0.01;
	} else {
		if (options.depthWrite !== undefined) {
			materialOptions.depthWrite = options.depthWrite;
		}

		if (options.alphaTest !== undefined) {
			materialOptions.alphaTest = options.alphaTest;
		}
	}

	const opacity = options.opacity ?? defaultOpacity;
	if (opacity !== undefined) {
		materialOptions.opacity = opacity;
	}

	if (options.blending !== undefined) {
		materialOptions.blending = options.blending;
	}

	return new MeshBasicMaterial(materialOptions);
}

export function createTextureSystemOptions(options: ParticlePresetMaterialOptions) {
	const systemOptions: {
		uTileCount?: number;
		vTileCount?: number;
		blendTiles?: boolean;
	} = {};

	if (options.uTileCount !== undefined) {
		systemOptions.uTileCount = options.uTileCount;
	}

	if (options.vTileCount !== undefined) {
		systemOptions.vTileCount = options.vTileCount;
	}

	if (options.blendTiles !== undefined) {
		systemOptions.blendTiles = options.blendTiles;
	}

	return systemOptions;
}

export function createSemanticParticleEffect(
	preset: SemanticParticlePresetDefinition,
	options: SemanticParticlePresetOptions = {},
): ParticleEffectDefinition {
	return particleEffect(() => {
		const magic = normalizeMagicModifier(options.magic);
		const resolvedShape = mergeShapeConfig(preset.system.shape, options.shape);
		const baseBehaviors = mergeBehaviorConfig(
			preset.system.behaviors,
			options.behaviors,
		);
		const baseColor = options.color ?? preset.system.defaults.color;
		const resolvedColor = magic
			? mixColors(baseColor, MAGIC_PALETTES[magic.alignment].start, 0.2)
			: baseColor;
		const resolvedBehaviors = magic
			? applyMagicBehaviors(baseBehaviors, resolvedColor, magic)
			: baseBehaviors;
		const resolvedBlending =
			options.blending ?? (magic ? AdditiveBlending : undefined);
		const materialOptions: ParticlePresetMaterialOptions = {
			...options,
			blending: resolvedBlending,
		};
		const resolvedRendererEmitterSettings = {
			...preset.system.rendererEmitterSettings,
			...options.rendererEmitterSettings,
		};

		return new ParticleSystem({
			duration: options.duration ?? preset.system.defaults.duration,
			looping:
				options.looping
				?? preset.system.defaults.looping
				?? preset.system.emission.type === 'rate',
			worldSpace: options.worldSpace ?? preset.system.defaults.worldSpace ?? false,
			startLife: createRangeValue(
				options.life ?? preset.system.defaults.life,
				toRange(preset.system.defaults.life),
			),
			startSpeed: createRangeValue(
				options.speed ?? preset.system.defaults.speed,
				toRange(preset.system.defaults.speed),
			),
			startSize: createRangeValue(
				options.size ?? preset.system.defaults.size,
				toRange(preset.system.defaults.size),
			),
			startRotation:
				options.rotation !== undefined
				|| preset.system.defaults.rotation !== undefined
					? createRangeValue(
							options.rotation ?? preset.system.defaults.rotation ?? 0,
							toRange(preset.system.defaults.rotation ?? 0),
						)
					: undefined,
			startColor: new ConstantColor(toColorVector(resolvedColor)),
			emissionOverTime:
				preset.system.emission.type === 'rate'
					? new ConstantValue(
							options.emissionRate ?? preset.system.emission.rate,
						)
					: new ConstantValue(0),
			emissionBursts:
				preset.system.emission.type === 'burst'
					? [
							{
								time: 0,
								count: new ConstantValue(
									options.count ?? preset.system.emission.count,
								),
								cycle: 1,
								interval: 0,
								probability: 1,
					},
						]
					: undefined,
			shape: createEmitterShape(resolvedShape),
			material: createParticleMaterial(
				resolvedColor,
				materialOptions,
				preset.system.defaults.opacity,
			),
			behaviors: createBehaviors(resolvedBehaviors),
			...createTextureSystemOptions(materialOptions),
			renderMode:
				options.renderMode
				?? (magic && magic.agency === 'seeking'
					? RenderMode.StretchedBillBoard
					: undefined)
				?? preset.system.defaults.renderMode
				?? RenderMode.BillBoard,
			rendererEmitterSettings: resolvedRendererEmitterSettings,
		});
	});
}

function normalizeMagicModifier(
	input?: ParticleMagicModifierInput,
): ParticleMagicModifierOptions | null {
	if (!input) {
		return null;
	}

	if (typeof input === 'string') {
		return createMagicModifier(input);
	}

	return createMagicModifier(input.alignment, input);
}

function applyMagicBehaviors(
	base: ParticleBehaviorConfig | undefined,
	baseColor: ColorRepresentation,
	magic: ParticleMagicModifierOptions,
): ParticleBehaviorConfig {
	const intensity = clamp(magic.intensity ?? 1, 0.25, 1.5);
	const palette = MAGIC_PALETTES[magic.alignment];

	return {
		...base,
		colorOverLife: tintColorOverLife(
			base?.colorOverLife,
			baseColor,
			palette,
			intensity,
		),
		rotationOverLife: addRanges(
			base?.rotationOverLife,
			resolveMagicRotation(magic, intensity),
		),
		forceOverLife: mergeForce(
			base?.forceOverLife,
			resolveMagicForce(magic, intensity),
		),
		noise: mergeNoise(base?.noise, resolveMagicNoise(magic, intensity)),
		orbitOverLife:
			resolveMagicOrbit(magic, intensity) ?? base?.orbitOverLife,
	};
}

function resolveMagicRotation(
	magic: ParticleMagicModifierOptions,
	intensity: number,
): NumericRange | undefined {
	const amount = 0.7 + intensity * 1.4;

	switch (magic.order) {
		case 'geometric':
			return [amount * 0.45, amount];
		case 'organic':
			return [-amount * 0.55, amount * 0.55];
		case 'chaotic':
			return [-amount * 2.4, amount * 2.4];
		default:
			return undefined;
	}
}

function resolveMagicForce(
	magic: ParticleMagicModifierOptions,
	intensity: number,
): ParticleForceOverLifeConfig | undefined {
	const amount = 0.2 + intensity * 0.55;

	switch (magic.realityEffect) {
		case 'illuminating':
		case 'healing':
			return { y: [amount * 0.6, amount] };
		case 'decaying':
			return { y: [-amount, -amount * 0.5] };
		case 'binding':
			return { y: [-amount * 0.35, amount * 0.15] };
		case 'warping':
			return { x: [-amount * 0.35, amount * 0.35], z: [-amount * 0.35, amount * 0.35] };
		default:
			return undefined;
	}
}

function resolveMagicNoise(
	magic: ParticleMagicModifierOptions,
	intensity: number,
): ParticleNoiseConfig {
	const calmMultiplier = magic.temperament === 'calm' ? 0.6 : 1;
	const ominousBoost = magic.temperament === 'ominous' ? 1.25 : 1;
	const basePower =
		(0.08 + intensity * 0.1) * calmMultiplier * ominousBoost;

	switch (magic.order) {
		case 'geometric':
			return {
				frequency: [1.5, 3.5],
				power: [basePower * 0.4, basePower * 0.8],
				positionAmount: [0.08, 0.2],
				rotationAmount: [0.1, 0.2],
			};
		case 'organic':
			return {
				frequency: [2.5, 5.5],
				power: [basePower * 0.7, basePower * 1.2],
				positionAmount: [0.12, 0.3],
				rotationAmount: [0.14, 0.26],
			};
		case 'chaotic':
		default:
			return {
				frequency: [4, 8],
				power: [basePower, basePower * 1.7],
				positionAmount: [0.18, 0.38],
				rotationAmount: [0.18, 0.34],
			};
	}
}

function resolveMagicOrbit(
	magic: ParticleMagicModifierOptions,
	intensity: number,
): ParticleOrbitConfig | undefined {
	if (magic.order === 'geometric') {
		return {
			speed: [3 + intensity * 2, 6 + intensity * 3],
			axis: [0, 1, 0],
		};
	}

	if (magic.agency === 'sentient-feeling') {
		return {
			speed: [1 + intensity, 2.5 + intensity * 1.2],
			axis: [0, 1, 0],
		};
	}

	return undefined;
}

function tintColorOverLife(
	base: ParticleColorOverLifeConfig | undefined,
	baseColor: ColorRepresentation,
	palette: MagicPalette,
	intensity: number,
): ParticleColorOverLifeConfig {
	if (!base) {
		return {
			colors: [
				[mixColors(baseColor, palette.start, 0.25), 0],
				[mixColors(baseColor, palette.mid, 0.55), 0.45],
				[mixColors(baseColor, palette.end, 0.75), 1],
			],
			alpha: [
				[0.22, 0],
				[1, 0.12],
				[0.52 + intensity * 0.08, 0.64],
				[0, 1],
			],
		};
	}

	return {
		colors: base.colors.map(([color, stop], index) => {
			const target =
				index === 0
					? palette.start
					: index === base.colors.length - 1
						? palette.end
						: palette.mid;
			const amount = index === 0 ? 0.18 : 0.3 + intensity * 0.15;
			return [mixColors(color, target, amount), stop] as const;
		}),
		alpha: base.alpha,
	};
}

function mergeNoise(
	base: ParticleNoiseConfig | undefined,
	overlay: ParticleNoiseConfig | undefined,
): ParticleNoiseConfig | undefined {
	if (!base) {
		return overlay;
	}

	if (!overlay) {
		return base;
	}

	return {
		frequency: addRanges(base.frequency, overlay.frequency) ?? base.frequency,
		power: addRanges(base.power, overlay.power) ?? base.power,
		positionAmount: addRanges(base.positionAmount, overlay.positionAmount),
		rotationAmount: addRanges(base.rotationAmount, overlay.rotationAmount),
	};
}

function mergeForce(
	base: ParticleForceOverLifeConfig | undefined,
	overlay: ParticleForceOverLifeConfig | undefined,
): ParticleForceOverLifeConfig | undefined {
	if (!base) {
		return overlay;
	}

	if (!overlay) {
		return base;
	}

	return {
		x: addRanges(base.x, overlay.x),
		y: addRanges(base.y, overlay.y),
		z: addRanges(base.z, overlay.z),
	};
}

function mergeBehaviorConfig(
	base: ParticleBehaviorConfig | undefined,
	overrides: ParticleBehaviorOverrides | undefined,
): ParticleBehaviorConfig | undefined {
	if (!base && !overrides) {
		return undefined;
	}

	const merged: ParticleBehaviorConfig = {};

	assignIfDefined(
		merged,
		'colorOverLife',
		resolveOverrideValue(base?.colorOverLife, overrides?.colorOverLife),
	);
	assignIfDefined(
		merged,
		'sizeOverLife',
		resolveOverrideValue(base?.sizeOverLife, overrides?.sizeOverLife),
	);
	assignIfDefined(
		merged,
		'speedOverLife',
		resolveOverrideValue(base?.speedOverLife, overrides?.speedOverLife),
	);
	assignIfDefined(
		merged,
		'rotationOverLife',
		resolveOverrideValue(base?.rotationOverLife, overrides?.rotationOverLife),
	);
	assignIfDefined(
		merged,
		'forceOverLife',
		resolvePartialOverride(base?.forceOverLife, overrides?.forceOverLife),
	);
	assignIfDefined(
		merged,
		'noise',
		resolveNoiseOverride(base?.noise, overrides?.noise),
	);
	assignIfDefined(
		merged,
		'orbitOverLife',
		resolveOrbitOverride(base?.orbitOverLife, overrides?.orbitOverLife),
	);

	return Object.keys(merged).length > 0 ? merged : undefined;
}

function mergeShapeConfig(
	base: ParticleShapeConfig | undefined,
	override: ParticleShapeConfig | undefined,
): ParticleShapeConfig | undefined {
	if (!override) {
		return base;
	}

	if (!base || override.type !== base.type) {
		return override;
	}

	if (override.type === 'point') {
		return override;
	}

	if (override.type === 'cone' && base.type === 'cone') {
		return {
			...base,
			...override,
		};
	}

	if (override.type === 'sphere' && base.type === 'sphere') {
		return {
			...base,
			...override,
		};
	}

	return override;
}

function addRanges(
	base: NumericRange | undefined,
	overlay: NumericRange | undefined,
): NumericRange | undefined {
	if (base === undefined) {
		return overlay;
	}

	if (overlay === undefined) {
		return base;
	}

	const [baseMin, baseMax] = toRange(base);
	const [overlayMin, overlayMax] = toRange(overlay);
	return [baseMin + overlayMin, baseMax + overlayMax];
}

function resolveOverrideValue<T>(
	base: T | undefined,
	override: T | null | undefined,
): T | undefined {
	if (override === null) {
		return undefined;
	}

	return override ?? base;
}

function resolvePartialOverride<T extends object>(
	base: T | undefined,
	override: Partial<T> | null | undefined,
): T | undefined {
	if (override === null) {
		return undefined;
	}

	if (!override) {
		return base;
	}

	const resolved = {
		...base,
		...override,
	};

	return Object.keys(resolved).length > 0 ? (resolved as T) : undefined;
}

function resolveNoiseOverride(
	base: ParticleNoiseConfig | undefined,
	override: Partial<ParticleNoiseConfig> | null | undefined,
): ParticleNoiseConfig | undefined {
	if (override === null) {
		return undefined;
	}

	if (!override) {
		return base;
	}

	const frequency = override.frequency ?? base?.frequency;
	const power = override.power ?? base?.power;
	if (frequency === undefined || power === undefined) {
		return undefined;
	}

	return {
		...base,
		...override,
		frequency,
		power,
	};
}

function resolveOrbitOverride(
	base: ParticleOrbitConfig | undefined,
	override: Partial<ParticleOrbitConfig> | null | undefined,
): ParticleOrbitConfig | undefined {
	if (override === null) {
		return undefined;
	}

	if (!override) {
		return base;
	}

	const speed = override.speed ?? base?.speed;
	if (speed === undefined) {
		return undefined;
	}

	return {
		...base,
		...override,
		speed,
	};
}

function assignIfDefined<
	T extends object,
	K extends keyof T,
>(target: T, key: K, value: T[K] | undefined) {
	if (value !== undefined) {
		target[key] = value;
	}
}

function createBehaviors(
	config?: ParticleBehaviorConfig,
): Behavior[] | undefined {
	if (!config) {
		return undefined;
	}

	const behaviors: Behavior[] = [];

	if (config.colorOverLife) {
		behaviors.push(
			new ColorOverLife(
				new Gradient(
					config.colorOverLife.colors.map(
						([color, stop]) =>
							[toColorVector3(color), stop] as [Vector3, number],
					),
					config.colorOverLife.alpha.map(
						([value, stop]) => [value, stop] as [number, number],
					),
				),
			),
		);
	}

	if (config.sizeOverLife) {
		behaviors.push(new SizeOverLife(createCurve(config.sizeOverLife)));
	}

	if (config.speedOverLife) {
		behaviors.push(new SpeedOverLife(createCurve(config.speedOverLife)));
	}

	if (config.rotationOverLife !== undefined) {
		behaviors.push(
			new RotationOverLife(
				createRangeValue(config.rotationOverLife, toRange(config.rotationOverLife)),
			),
		);
	}

	if (config.forceOverLife) {
		behaviors.push(
			new ForceOverLife(
				createRangeValue(config.forceOverLife.x ?? 0, toRange(config.forceOverLife.x ?? 0)),
				createRangeValue(config.forceOverLife.y ?? 0, toRange(config.forceOverLife.y ?? 0)),
				createRangeValue(config.forceOverLife.z ?? 0, toRange(config.forceOverLife.z ?? 0)),
			),
		);
	}

	if (config.noise) {
		behaviors.push(
			new Noise(
				createRangeValue(config.noise.frequency, toRange(config.noise.frequency)),
				createRangeValue(config.noise.power, toRange(config.noise.power)),
				createRangeValue(
					config.noise.positionAmount ?? 0,
					toRange(config.noise.positionAmount ?? 0),
				),
				createRangeValue(
					config.noise.rotationAmount ?? 0,
					toRange(config.noise.rotationAmount ?? 0),
				),
			),
		);
	}

	if (config.orbitOverLife) {
		const axis = config.orbitOverLife.axis ?? [0, 1, 0];
		behaviors.push(
			new OrbitOverLife(
				createRangeValue(
					config.orbitOverLife.speed,
					toRange(config.orbitOverLife.speed),
				),
				new Vector3(axis[0], axis[1], axis[2]),
			),
		);
	}

	return behaviors.length > 0 ? behaviors : undefined;
}

function createEmitterShape(shape?: ParticleShapeConfig) {
	if (!shape || shape.type === 'point') {
		return new PointEmitter();
	}

	if (shape.type === 'cone') {
		return new ConeEmitter({
			radius: shape.radius,
			thickness: shape.thickness,
			angle: shape.angle,
			speed:
				shape.speed !== undefined
					? createRangeValue(shape.speed, toRange(shape.speed))
					: undefined,
		});
	}

	return new SphereEmitter({
		radius: shape.radius,
		thickness: shape.thickness,
		speed:
			shape.speed !== undefined
				? createRangeValue(shape.speed, toRange(shape.speed))
				: undefined,
	});
}

function createCurve(points: CurvePoints) {
	return new PiecewiseBezier([[new Bezier(...points), 0]]);
}

function toColorVector3(color: ColorRepresentation): Vector3 {
	const parsed = new Color(color);
	return new Vector3(parsed.r, parsed.g, parsed.b);
}

function toRange(value: NumericRange): readonly [number, number] {
	if (Array.isArray(value)) {
		return [value[0] ?? 0, value[1] ?? value[0] ?? 0];
	}

	return [value as number, value as number];
}

function mixColors(
	base: ColorRepresentation,
	overlay: ColorRepresentation,
	amount: number,
): string {
	const color = new Color(base);
	color.lerp(new Color(overlay), clamp(amount, 0, 1));
	return `#${color.getHexString()}`;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
