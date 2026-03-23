import { RenderMode } from 'three.quarks';

import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const electricitySparkPreset = defineSemanticParticlePreset({
	family: 'electricity',
	variant: 'spark',
	description: 'tiny discontinuous discharge',
	axes: {
		'continuity vs discontinuity': 'highly discontinuous',
		'branching tendency': 'low',
		'snap/crackle quality': 'high',
		'seeking behavior': 'low',
		'charge buildup': 'low',
		'rhythmic pulsing': 'low',
	},
	system: {
		defaults: {
			duration: 0.2,
			color: '#7dd3fc',
			life: [0.08, 0.18],
			size: [0.08, 0.16],
			speed: [2.2, 4.2],
			rotation: [-Math.PI, Math.PI],
			opacity: 0.92,
			renderMode: RenderMode.StretchedBillBoard,
		},
		emission: { type: 'burst', count: 12 },
		shape: {
			type: 'sphere',
			radius: 0.06,
			thickness: 0.95,
			speed: [0.8, 1.6],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#ffffff', 0],
					['#bae6fd', 0.3],
					['#38bdf8', 1],
				],
				alpha: [
					[0.22, 0],
					[1, 0.06],
					[0.48, 0.4],
					[0, 1],
				],
			},
			sizeOverLife: [0.44, 0.98, 0.7, 0.04],
			speedOverLife: [1.24, 0.9, 0.36, 0.04],
		},
		rendererEmitterSettings: {
			speedFactor: 0.46,
			lengthFactor: 1.02,
		},
	},
});

export function spark(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(electricitySparkPreset, options);
}
