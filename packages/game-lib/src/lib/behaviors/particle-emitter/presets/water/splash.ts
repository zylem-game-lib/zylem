import { RenderMode } from 'three.quarks';

import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const waterSplashPreset = defineSemanticParticlePreset({
	family: 'water',
	variant: 'splash',
	description: 'sudden impact-driven burst',
	axes: {
		pressure: 'impact-driven',
		'surface tension feel': 'beaded',
		aeration: 'medium',
		coherence: 'shattering',
		'gravitational obedience': 'high',
	},
	system: {
		defaults: {
			duration: 0.34,
			color: '#7dd3fc',
			life: [0.26, 0.55],
			size: [0.1, 0.22],
			speed: [1.4, 3.1],
			rotation: [-Math.PI, Math.PI],
			opacity: 0.82,
			renderMode: RenderMode.StretchedBillBoard,
		},
		emission: { type: 'burst', count: 18 },
		shape: {
			type: 'sphere',
			radius: 0.08,
			thickness: 0.96,
			speed: [0.7, 1.4],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#ffffff', 0],
					['#bae6fd', 0.4],
					['#38bdf8', 1],
				],
				alpha: [
					[0.18, 0],
					[0.88, 0.08],
					[0.42, 0.54],
					[0, 1],
				],
			},
			sizeOverLife: [0.32, 0.86, 0.92, 0.08],
			speedOverLife: [1.12, 0.88, 0.46, 0.08],
			forceOverLife: {
				y: [-4.4, -2.6],
			},
		},
		rendererEmitterSettings: {
			speedFactor: 0.36,
			lengthFactor: 0.88,
		},
	},
});

export function splash(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(waterSplashPreset, options);
}
