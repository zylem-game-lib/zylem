import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const gasMiasmaPreset = defineSemanticParticlePreset({
	family: 'gas',
	variant: 'miasma',
	description: 'thick, toxic, contaminating exhalation',
	axes: {
		'opacity feel': 'medium',
		toxicity: 'high',
		buoyancy: 'low-medium',
		'spread tendency': 'high',
		thickness: 'sticky',
		'staining / contaminating character': 'high',
	},
	system: {
		defaults: {
			duration: 3.8,
			looping: true,
			color: '#84cc16',
			life: [2.8, 4.6],
			size: [0.52, 1.08],
			speed: [0.03, 0.16],
			rotation: [-Math.PI, Math.PI],
			opacity: 0.5,
		},
		emission: { type: 'rate', rate: 16 },
		shape: {
			type: 'cone',
			radius: 0.3,
			thickness: 1,
			angle: 0.3,
			speed: [0.02, 0.08],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#ecfccb', 0],
					['#84cc16', 0.4],
					['#3f6212', 1],
				],
				alpha: [
					[0.08, 0],
					[0.58, 0.14],
					[0.24, 0.8],
					[0, 1],
				],
			},
			sizeOverLife: [0.4, 0.92, 1.3, 1.9],
			noise: {
				frequency: [1.8, 3.8],
				power: [0.08, 0.18],
				positionAmount: [0.16, 0.34],
				rotationAmount: [0.08, 0.18],
			},
		},
	},
});

export function miasma(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(gasMiasmaPreset, options);
}
