import type { ColorRepresentation } from 'three';
import {
	ConstantColor,
	ConstantValue,
	ParticleSystem,
	PointEmitter,
	RenderMode,
} from 'three.quarks';

import {
	createParticleMaterial,
	createRangeValue,
	createTextureSystemOptions,
	particleEffect,
	toColorVector,
	type ParticleEffectDefinition,
	type ParticlePresetMaterialOptions,
} from './preset-builder';
import { electricityPresets, firePresets, gasPresets, magicPresets, waterPresets } from './presets';

export type {
	ParticleEffectDefinition,
	ParticleMagicAgency,
	ParticleMagicAlignment,
	ParticleMagicModifierInput,
	ParticleMagicModifierOptions,
	ParticleMagicOrder,
	ParticleMagicRealityEffect,
	ParticleMagicTemperament,
	ParticlePresetMaterialOptions,
	SemanticParticlePresetOptions,
} from './preset-builder';

export interface BurstParticlePresetOptions extends ParticlePresetMaterialOptions {
	color?: ColorRepresentation;
	count?: number;
	duration?: number;
	life?: number | readonly [number, number];
	size?: number | readonly [number, number];
	speed?: number | readonly [number, number];
	worldSpace?: boolean;
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
	fire: firePresets,
	water: waterPresets,
	gas: gasPresets,
	electricity: electricityPresets,
	magic: magicPresets,
} as const;

export { particleEffect } from './preset-builder';
