import { RenderMode } from 'three.quarks';

import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const electricityStormPreset = defineSemanticParticlePreset({
	family: 'electricity',
	variant: 'storm',
	description: 'restless volume of crackling atmospheric charge',
	axes: {
		'continuity vs discontinuity': 'mixed',
		'branching tendency': 'high',
		'snap/crackle quality': 'high',
		'seeking behavior': 'medium-high',
		'charge buildup': 'high',
		'rhythmic pulsing': 'medium',
	},
	system: {
		defaults: {
			duration: 1.2,
			looping: true,
			color: '#38bdf8',
			life: [0.32, 0.82],
			size: [0.08, 0.2],
			speed: [2.2, 4.8],
			rotation: [-Math.PI, Math.PI],
			opacity: 0.94,
			renderMode: RenderMode.StretchedBillBoard,
		},
		emission: { type: 'rate', rate: 34 },
		shape: {
			type: 'sphere',
			radius: 0.16,
			thickness: 0.98,
			speed: [1, 2],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#ffffff', 0],
					['#67e8f9', 0.25],
					['#2563eb', 1],
				],
				alpha: [
					[0.18, 0],
					[0.98, 0.06],
					[0.5, 0.5],
					[0, 1],
				],
			},
			sizeOverLife: [0.62, 0.96, 0.84, 0.26],
			speedOverLife: [1.18, 0.94, 0.66, 0.32],
			noise: {
				frequency: [4.8, 8.4],
				power: [0.08, 0.18],
				positionAmount: [0.18, 0.38],
				rotationAmount: [0.08, 0.18],
			},
		},
		rendererEmitterSettings: {
			speedFactor: 0.66,
			lengthFactor: 1.18,
		},
	},
});

export function storm(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(electricityStormPreset, options);
}
