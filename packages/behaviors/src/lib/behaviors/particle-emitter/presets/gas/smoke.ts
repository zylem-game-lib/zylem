import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const gasSmokePreset = defineSemanticParticlePreset({
	family: 'gas',
	variant: 'smoke',
	description: 'opaque, buoyant, lingering combustion residue',
	axes: {
		'opacity feel': 'medium-high',
		toxicity: 'medium',
		buoyancy: 'high',
		'spread tendency': 'medium',
		thickness: 'medium',
		'staining / contaminating character': 'medium',
	},
	system: {
		defaults: {
			duration: 3.2,
			looping: true,
			color: '#737373',
			life: [2.4, 4.2],
			size: [0.45, 0.92],
			speed: [0.08, 0.3],
			rotation: [-Math.PI, Math.PI],
			opacity: 0.58,
		},
		emission: { type: 'rate', rate: 14 },
		shape: {
			type: 'cone',
			radius: 0.24,
			thickness: 1,
			angle: 0.28,
			speed: [0.04, 0.14],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#d4d4d8', 0],
					['#737373', 0.4],
					['#404040', 1],
				],
				alpha: [
					[0.08, 0],
					[0.68, 0.14],
					[0.24, 0.84],
					[0, 1],
				],
			},
			sizeOverLife: [0.38, 0.88, 1.4, 2.08],
			forceOverLife: {
				y: [0.12, 0.28],
			},
			noise: {
				frequency: [1.2, 2.8],
				power: [0.08, 0.16],
				positionAmount: [0.12, 0.26],
				rotationAmount: [0.08, 0.18],
			},
		},
	},
});

export function smoke(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(gasSmokePreset, options);
}
