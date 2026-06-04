import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const fireSmolderPreset = defineSemanticParticlePreset({
	family: 'fire',
	variant: 'smolder',
	description: 'low-oxygen, persistent, smoky heat',
	axes: {
		'heat feel': 'buried-hot',
		'hunger/spread tendency': 'low',
		'smoke affinity': 'high',
		turbulence: 'low',
		residuality: 'high',
	},
	system: {
		defaults: {
			duration: 2.6,
			looping: true,
			color: '#c2410c',
			life: [1.4, 2.8],
			size: [0.28, 0.58],
			speed: [0.06, 0.22],
			rotation: [-0.35, 0.35],
			opacity: 0.76,
		},
		emission: { type: 'rate', rate: 14 },
		shape: {
			type: 'cone',
			radius: 0.16,
			thickness: 1,
			angle: 0.12,
			speed: [0.04, 0.16],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#fed7aa', 0],
					['#c2410c', 0.28],
					['#525252', 1],
				],
				alpha: [
					[0.14, 0],
					[0.76, 0.12],
					[0.4, 0.68],
					[0, 1],
				],
			},
			sizeOverLife: [0.34, 0.86, 1.08, 0.46],
			forceOverLife: {
				y: [0.08, 0.2],
			},
			noise: {
				frequency: [1.6, 3.1],
				power: [0.04, 0.12],
				positionAmount: [0.12, 0.26],
				rotationAmount: [0.06, 0.14],
			},
		},
	},
});

export function smolder(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(fireSmolderPreset, options);
}
