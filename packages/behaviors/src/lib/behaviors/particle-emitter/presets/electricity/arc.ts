import { RenderMode } from 'three.quarks';

import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const electricityArcPreset = defineSemanticParticlePreset({
	family: 'electricity',
	variant: 'arc',
	description: 'directed snapping bridge of charge',
	axes: {
		'continuity vs discontinuity': 'semi-continuous',
		'branching tendency': 'medium',
		'snap/crackle quality': 'high',
		'seeking behavior': 'medium',
		'charge buildup': 'medium',
		'rhythmic pulsing': 'low',
	},
	system: {
		defaults: {
			duration: 0.7,
			looping: true,
			color: '#60a5fa',
			life: [0.12, 0.26],
			size: [0.06, 0.14],
			speed: [2.4, 4],
			rotation: [-0.3, 0.3],
			opacity: 0.96,
			renderMode: RenderMode.StretchedBillBoard,
		},
		emission: { type: 'rate', rate: 28 },
		shape: {
			type: 'cone',
			radius: 0.06,
			thickness: 1,
			angle: 0.05,
			speed: [1.2, 2.4],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#ffffff', 0],
					['#7dd3fc', 0.3],
					['#2563eb', 1],
				],
				alpha: [
					[0.2, 0],
					[1, 0.05],
					[0.46, 0.5],
					[0, 1],
				],
			},
			sizeOverLife: [0.7, 0.96, 0.82, 0.26],
			speedOverLife: [1.08, 0.94, 0.7, 0.38],
			noise: {
				frequency: [2.4, 4.8],
				power: [0.05, 0.12],
				positionAmount: [0.14, 0.28],
				rotationAmount: [0.04, 0.12],
			},
		},
		rendererEmitterSettings: {
			speedFactor: 0.62,
			lengthFactor: 1.16,
		},
	},
});

export function arc(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(electricityArcPreset, options);
}
