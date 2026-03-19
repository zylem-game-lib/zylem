import {
	MeshBasicMaterial,
	type Blending,
	type ColorRepresentation,
	type MeshBasicMaterialParameters,
	type Texture,
} from 'three';
import {
	ConstantColor,
	ConstantValue,
	IntervalValue,
	ParticleSystem,
	PointEmitter,
	RenderMode,
	Vector4,
} from 'three.quarks';

export interface ParticleEffectDefinition {
	create(): ParticleSystem;
}

interface ParticlePresetMaterialOptions {
	texture?: Texture;
	opacity?: number;
	depthWrite?: boolean;
	alphaTest?: number;
	blending?: Blending;
	uTileCount?: number;
	vTileCount?: number;
	blendTiles?: boolean;
}

export interface BurstParticlePresetOptions extends ParticlePresetMaterialOptions {
	color?: ColorRepresentation;
	count?: number;
	duration?: number;
	life?: number | readonly [number, number];
	size?: number | readonly [number, number];
	speed?: number | readonly [number, number];
	worldSpace?: boolean;
}

function createRangeValue(
	value: number | readonly [number, number],
	defaultValue: readonly [number, number],
) {
	if (Array.isArray(value)) {
		const min = value[0] ?? defaultValue[0];
		const max = value[1] ?? defaultValue[1];
		return min === max ? new ConstantValue(min) : new IntervalValue(min, max);
	}

	return new ConstantValue(value as number);
}

function toColorVector(color: ColorRepresentation): Vector4 {
	const material = new MeshBasicMaterial({ color });
	const { r, g, b } = material.color;
	material.dispose();
	return new Vector4(r, g, b, 1);
}

function createParticleMaterial(
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

function createTextureSystemOptions(options: ParticlePresetMaterialOptions) {
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

export function particleEffect(
	create: () => ParticleSystem,
): ParticleEffectDefinition {
	return { create };
}

export const particlePresets = {
	burst(
		options: BurstParticlePresetOptions = {},
	): ParticleEffectDefinition {
		return particleEffect(
			() =>
				new ParticleSystem({
					duration: options.duration ?? 0.25,
					looping: false,
					worldSpace: options.worldSpace ?? false,
					startLife: createRangeValue(options.life ?? [0.3, 0.7], [0.3, 0.7]),
					startSpeed: createRangeValue(options.speed ?? [1.5, 4], [1.5, 4]),
					startSize: createRangeValue(options.size ?? [0.08, 0.18], [0.08, 0.18]),
					startColor: new ConstantColor(
						toColorVector(options.color ?? '#ffffff'),
					),
					emissionOverTime: new ConstantValue(0),
					emissionBursts: [
						{
							time: 0,
							count: new ConstantValue(options.count ?? 18),
							cycle: 1,
							interval: 0,
							probability: 1,
						},
					],
					shape: new PointEmitter(),
					material: createParticleMaterial(
						options.color ?? '#ffffff',
						options,
					),
					...createTextureSystemOptions(options),
					renderMode: RenderMode.BillBoard,
				}),
		);
	},
	smoke(
		options: BurstParticlePresetOptions = {},
	): ParticleEffectDefinition {
		return particleEffect(
			() =>
				new ParticleSystem({
					duration: options.duration ?? 1.1,
					looping: false,
					worldSpace: options.worldSpace ?? false,
					startLife: createRangeValue(options.life ?? [0.8, 1.6], [0.8, 1.6]),
					startSpeed: createRangeValue(options.speed ?? [0.2, 0.8], [0.2, 0.8]),
					startSize: createRangeValue(options.size ?? [0.2, 0.5], [0.2, 0.5]),
					startColor: new ConstantColor(
						toColorVector(options.color ?? '#999999'),
					),
					emissionOverTime: new ConstantValue(0),
					emissionBursts: [
						{
							time: 0,
							count: new ConstantValue(options.count ?? 10),
							cycle: 1,
							interval: 0,
							probability: 1,
						},
					],
					shape: new PointEmitter(),
					material: createParticleMaterial(
						options.color ?? '#999999',
						options,
						0.85,
					),
					...createTextureSystemOptions(options),
					renderMode: RenderMode.BillBoard,
				}),
		);
	},
} as const;
