import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const waterMistPreset = defineSemanticParticlePreset({
	family: 'water',
	variant: 'mist',
	description: 'diffuse suspended moisture',
	axes: {
		pressure: 'low',
		'surface tension feel': 'soft',
		aeration: 'low',
		coherence: 'diffuse',
		'gravitational obedience': 'low',
	},
	system: {
		defaults: {
			duration: 3.2,
			looping: true,
			color: '#dbeafe',
			life: [2.4, 3.8],
			size: [0.4, 0.82],
			speed: [0.05, 0.2],
			rotation: [-Math.PI, Math.PI],
			opacity: 0.36,
		},
		emission: { type: 'rate', rate: 16 },
		shape: {
			type: 'cone',
			radius: 0.32,
			thickness: 1,
			angle: 0.42,
			speed: [0.02, 0.08],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#f8fafc', 0],
					['#dbeafe', 0.35],
					['#bfdbfe', 1],
				],
				alpha: [
					[0.08, 0],
					[0.44, 0.2],
					[0.18, 0.82],
					[0, 1],
				],
			},
			sizeOverLife: [0.38, 0.86, 1.42, 2.02],
			forceOverLife: {
				y: [0.02, 0.12],
			},
			noise: {
				frequency: [0.8, 1.8],
				power: [0.04, 0.1],
				positionAmount: [0.1, 0.18],
				rotationAmount: [0.08, 0.14],
			},
		},
	},
});

export function mist(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(waterMistPreset, options);
}
