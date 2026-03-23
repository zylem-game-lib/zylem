import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const gasVaporPreset = defineSemanticParticlePreset({
	family: 'gas',
	variant: 'vapor',
	description: 'visible gaseous release with light buoyancy',
	axes: {
		'opacity feel': 'light',
		toxicity: 'neutral',
		buoyancy: 'high',
		'spread tendency': 'medium',
		thickness: 'thin',
		'staining / contaminating character': 'low',
	},
	system: {
		defaults: {
			duration: 3,
			looping: true,
			color: '#e2e8f0',
			life: [2.2, 3.6],
			size: [0.38, 0.78],
			speed: [0.04, 0.18],
			rotation: [-Math.PI, Math.PI],
			opacity: 0.28,
		},
		emission: { type: 'rate', rate: 18 },
		shape: {
			type: 'cone',
			radius: 0.28,
			thickness: 1,
			angle: 0.36,
			speed: [0.02, 0.08],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#f8fafc', 0],
					['#e2e8f0', 0.36],
					['#cbd5e1', 1],
				],
				alpha: [
					[0.06, 0],
					[0.34, 0.22],
					[0.12, 0.84],
					[0, 1],
				],
			},
			sizeOverLife: [0.42, 0.9, 1.38, 1.98],
			forceOverLife: {
				y: [0.06, 0.18],
			},
			noise: {
				frequency: [1, 2],
				power: [0.04, 0.08],
				positionAmount: [0.1, 0.2],
				rotationAmount: [0.08, 0.14],
			},
		},
	},
});

export function vapor(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(gasVaporPreset, options);
}
