import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const fireEmberPreset = defineSemanticParticlePreset({
	family: 'fire',
	variant: 'ember',
	description: 'lingering, warm, residual, drifting',
	axes: {
		'heat feel': 'warm',
		'hunger/spread tendency': 'low',
		'smoke affinity': 'medium',
		turbulence: 'low',
		residuality: 'high',
	},
	system: {
		defaults: {
			duration: 2.2,
			looping: true,
			color: '#fb923c',
			life: [1.1, 2.2],
			size: [0.05, 0.14],
			speed: [0.08, 0.32],
			rotation: [-0.45, 0.45],
			opacity: 0.9,
		},
		emission: { type: 'rate', rate: 8 },
		shape: {
			type: 'cone',
			radius: 0.12,
			thickness: 1,
			angle: 0.22,
			speed: [0.08, 0.26],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#fff7d1', 0],
					['#fb923c', 0.35],
					['#b45309', 1],
				],
				alpha: [
					[0.12, 0],
					[0.9, 0.12],
					[0.42, 0.7],
					[0, 1],
				],
			},
			sizeOverLife: [0.42, 0.9, 0.72, 0.18],
			forceOverLife: {
				y: [0.18, 0.42],
			},
			noise: {
				frequency: [1.2, 2.6],
				power: [0.02, 0.08],
				positionAmount: [0.06, 0.14],
				rotationAmount: [0.04, 0.1],
			},
		},
	},
});

export function ember(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(fireEmberPreset, options);
}
