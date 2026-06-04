import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const gasHazePreset = defineSemanticParticlePreset({
	family: 'gas',
	variant: 'haze',
	description: 'broad, thin atmospheric contamination',
	axes: {
		'opacity feel': 'low',
		toxicity: 'low-medium',
		buoyancy: 'neutral',
		'spread tendency': 'high',
		thickness: 'thin',
		'staining / contaminating character': 'low',
	},
	system: {
		defaults: {
			duration: 4.4,
			looping: true,
			color: '#cbd5e1',
			life: [3.4, 5.4],
			size: [0.9, 1.7],
			speed: [0.02, 0.08],
			rotation: [-Math.PI, Math.PI],
			opacity: 0.18,
		},
		emission: { type: 'rate', rate: 10 },
		shape: {
			type: 'cone',
			radius: 0.64,
			thickness: 1,
			angle: 0.5,
			speed: [0.01, 0.04],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#f8fafc', 0],
					['#cbd5e1', 0.4],
					['#94a3b8', 1],
				],
				alpha: [
					[0.04, 0],
					[0.2, 0.24],
					[0.08, 0.88],
					[0, 1],
				],
			},
			sizeOverLife: [0.88, 1.08, 1.28, 1.42],
			noise: {
				frequency: [0.6, 1.4],
				power: [0.02, 0.06],
				positionAmount: [0.08, 0.16],
				rotationAmount: [0.06, 0.1],
			},
		},
	},
});

export function haze(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(gasHazePreset, options);
}
