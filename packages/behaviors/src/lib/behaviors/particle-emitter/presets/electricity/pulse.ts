import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const electricityPulsePreset = defineSemanticParticlePreset({
	family: 'electricity',
	variant: 'pulse',
	description: 'rhythmic swelling packet of charge',
	axes: {
		'continuity vs discontinuity': 'discrete rhythmic',
		'branching tendency': 'low',
		'snap/crackle quality': 'medium',
		'seeking behavior': 'low',
		'charge buildup': 'medium',
		'rhythmic pulsing': 'high',
	},
	system: {
		defaults: {
			duration: 0.28,
			color: '#a5f3fc',
			life: [0.14, 0.3],
			size: [0.18, 0.34],
			speed: [0.18, 0.42],
			opacity: 0.88,
		},
		emission: { type: 'burst', count: 10 },
		shape: {
			type: 'sphere',
			radius: 0.04,
			thickness: 0.5,
			speed: [0.02, 0.08],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#ffffff', 0],
					['#a5f3fc', 0.4],
					['#0891b2', 1],
				],
				alpha: [
					[0.14, 0],
					[0.92, 0.08],
					[0.42, 0.54],
					[0, 1],
				],
			},
			sizeOverLife: [0.2, 0.92, 1.26, 0.18],
		},
	},
});

export function pulse(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(electricityPulsePreset, options);
}
