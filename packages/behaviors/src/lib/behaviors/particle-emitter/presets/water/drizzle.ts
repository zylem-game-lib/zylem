import { RenderMode } from 'three.quarks';

import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const waterDrizzlePreset = defineSemanticParticlePreset({
	family: 'water',
	variant: 'drizzle',
	description: 'soft, continuous, light fall',
	axes: {
		pressure: 'low',
		'surface tension feel': 'light',
		aeration: 'low',
		coherence: 'discrete',
		'gravitational obedience': 'very-high',
	},
	system: {
		defaults: {
			duration: 1.4,
			looping: true,
			color: '#e0f2fe',
			life: [0.6, 1.05],
			size: [0.05, 0.1],
			speed: [2.8, 4.4],
			opacity: 0.62,
			renderMode: RenderMode.StretchedBillBoard,
		},
		emission: { type: 'rate', rate: 26 },
		shape: {
			type: 'cone',
			radius: 0.46,
			thickness: 1,
			angle: 0.04,
			speed: [1.8, 2.6],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#f8fafc', 0],
					['#e0f2fe', 0.45],
					['#7dd3fc', 1],
				],
				alpha: [
					[0.12, 0],
					[0.78, 0.08],
					[0.52, 0.58],
					[0, 1],
				],
			},
			speedOverLife: [1.02, 1, 0.94, 0.88],
			forceOverLife: {
				y: [-8.2, -6.4],
			},
		},
		rendererEmitterSettings: {
			speedFactor: 0.42,
			lengthFactor: 1.24,
		},
	},
});

export function drizzle(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(waterDrizzlePreset, options);
}
