import { RenderMode } from 'three.quarks';

import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const electricitySurgePreset = defineSemanticParticlePreset({
	family: 'electricity',
	variant: 'surge',
	description: 'charge-rich spike that overwhelms the space',
	axes: {
		'continuity vs discontinuity': 'bursting',
		'branching tendency': 'medium',
		'snap/crackle quality': 'high',
		'seeking behavior': 'medium',
		'charge buildup': 'high',
		'rhythmic pulsing': 'medium',
	},
	system: {
		defaults: {
			duration: 0.34,
			color: '#38bdf8',
			life: [0.18, 0.36],
			size: [0.12, 0.26],
			speed: [2.8, 5.2],
			rotation: [-Math.PI, Math.PI],
			opacity: 0.98,
			renderMode: RenderMode.StretchedBillBoard,
		},
		emission: { type: 'burst', count: 24 },
		shape: {
			type: 'sphere',
			radius: 0.08,
			thickness: 0.98,
			speed: [1.1, 2.2],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#ffffff', 0],
					['#67e8f9', 0.22],
					['#0ea5e9', 1],
				],
				alpha: [
					[0.22, 0],
					[1, 0.04],
					[0.52, 0.44],
					[0, 1],
				],
			},
			sizeOverLife: [0.32, 0.9, 0.84, 0.08],
			speedOverLife: [1.22, 0.88, 0.42, 0.06],
			noise: {
				frequency: [4.5, 8],
				power: [0.08, 0.18],
				positionAmount: [0.22, 0.42],
				rotationAmount: [0.08, 0.16],
			},
		},
		rendererEmitterSettings: {
			speedFactor: 0.68,
			lengthFactor: 1.2,
		},
	},
});

export function surge(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(electricitySurgePreset, options);
}
