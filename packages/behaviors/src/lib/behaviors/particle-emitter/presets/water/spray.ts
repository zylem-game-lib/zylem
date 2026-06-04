import { RenderMode } from 'three.quarks';

import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const waterSprayPreset = defineSemanticParticlePreset({
	family: 'water',
	variant: 'spray',
	description: 'fine ejected droplets',
	axes: {
		pressure: 'medium-high',
		'surface tension feel': 'light',
		aeration: 'medium',
		coherence: 'broken',
		'gravitational obedience': 'high',
	},
	system: {
		defaults: {
			duration: 1,
			looping: true,
			color: '#93c5fd',
			life: [0.45, 0.9],
			size: [0.08, 0.16],
			speed: [1.1, 2.3],
			rotation: [-Math.PI, Math.PI],
			opacity: 0.72,
			renderMode: RenderMode.StretchedBillBoard,
		},
		emission: { type: 'rate', rate: 38 },
		shape: {
			type: 'cone',
			radius: 0.12,
			thickness: 1,
			angle: 0.24,
			speed: [0.85, 1.8],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#eff6ff', 0],
					['#93c5fd', 0.45],
					['#60a5fa', 1],
				],
				alpha: [
					[0.16, 0],
					[0.82, 0.08],
					[0.52, 0.58],
					[0, 1],
				],
			},
			sizeOverLife: [0.72, 0.96, 0.82, 0.28],
			speedOverLife: [1.04, 0.92, 0.68, 0.38],
			forceOverLife: {
				y: [-5.8, -3.8],
			},
			noise: {
				frequency: [1.2, 2.2],
				power: [0.04, 0.08],
				positionAmount: [0.08, 0.16],
				rotationAmount: [0.04, 0.08],
			},
		},
		rendererEmitterSettings: {
			speedFactor: 0.5,
			lengthFactor: 0.95,
		},
	},
});

export function spray(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(waterSprayPreset, options);
}
