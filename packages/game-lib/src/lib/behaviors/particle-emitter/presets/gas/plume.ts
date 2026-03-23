import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const gasPlumePreset = defineSemanticParticlePreset({
	family: 'gas',
	variant: 'plume',
	description: 'columnar rising release with strong lift',
	axes: {
		'opacity feel': 'medium',
		toxicity: 'medium',
		buoyancy: 'very-high',
		'spread tendency': 'medium',
		thickness: 'medium',
		'staining / contaminating character': 'medium',
	},
	system: {
		defaults: {
			duration: 2.8,
			looping: true,
			color: '#94a3b8',
			life: [1.8, 3.2],
			size: [0.32, 0.72],
			speed: [0.16, 0.52],
			rotation: [-Math.PI, Math.PI],
			opacity: 0.48,
		},
		emission: { type: 'rate', rate: 22 },
		shape: {
			type: 'cone',
			radius: 0.18,
			thickness: 1,
			angle: 0.18,
			speed: [0.08, 0.24],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#e2e8f0', 0],
					['#94a3b8', 0.36],
					['#475569', 1],
				],
				alpha: [
					[0.06, 0],
					[0.54, 0.14],
					[0.2, 0.84],
					[0, 1],
				],
			},
			sizeOverLife: [0.42, 0.92, 1.36, 1.84],
			forceOverLife: {
				y: [0.28, 0.6],
			},
			noise: {
				frequency: [1.6, 3.4],
				power: [0.08, 0.14],
				positionAmount: [0.14, 0.28],
				rotationAmount: [0.08, 0.16],
			},
		},
	},
});

export function plume(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(gasPlumePreset, options);
}
