import { RenderMode } from 'three.quarks';

import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const fireFlameletPreset = defineSemanticParticlePreset({
	family: 'fire',
	variant: 'flamelet',
	description: 'small coherent tongue of flame',
	axes: {
		'heat feel': 'hot',
		'hunger/spread tendency': 'medium',
		'smoke affinity': 'low',
		turbulence: 'medium',
		residuality: 'low',
	},
	system: {
		defaults: {
			duration: 1.2,
			looping: true,
			color: '#fb923c',
			life: [0.48, 0.9],
			size: [0.2, 0.38],
			speed: [0.35, 0.9],
			rotation: [-0.18, 0.18],
			opacity: 0.94,
			renderMode: RenderMode.VerticalBillBoard,
		},
		emission: { type: 'rate', rate: 22 },
		shape: {
			type: 'cone',
			radius: 0.1,
			thickness: 1,
			angle: 0.18,
			speed: [0.3, 0.72],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#fff7d1', 0],
					['#fbbf24', 0.24],
					['#fb923c', 0.62],
					['#ef4444', 1],
				],
				alpha: [
					[0.16, 0],
					[0.94, 0.1],
					[0.48, 0.58],
					[0, 1],
				],
			},
			sizeOverLife: [0.44, 0.92, 1.08, 0.16],
			speedOverLife: [1.08, 0.95, 0.62, 0.18],
			forceOverLife: {
				y: [0.3, 0.55],
			},
			noise: {
				frequency: [3, 5],
				power: [0.08, 0.14],
				positionAmount: [0.24, 0.42],
				rotationAmount: [0.16, 0.24],
			},
		},
	},
});

export function flamelet(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(fireFlameletPreset, options);
}
