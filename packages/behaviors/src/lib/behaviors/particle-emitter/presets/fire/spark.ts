import { RenderMode } from 'three.quarks';

import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const fireSparkPreset = defineSemanticParticlePreset({
	family: 'fire',
	variant: 'spark',
	description: 'tiny, sudden, energetic, fleeting',
	axes: {
		'heat feel': 'sharp-hot',
		'hunger/spread tendency': 'low',
		'smoke affinity': 'low',
		turbulence: 'high',
		residuality: 'low',
	},
	system: {
		defaults: {
			duration: 0.24,
			color: '#ffd166',
			life: [0.12, 0.24],
			size: [0.08, 0.16],
			speed: [1.8, 4.6],
			rotation: [-Math.PI, Math.PI],
			renderMode: RenderMode.StretchedBillBoard,
		},
		emission: { type: 'burst', count: 10 },
		shape: {
			type: 'sphere',
			radius: 0.05,
			thickness: 0.92,
			speed: [0.45, 1.2],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#ffffff', 0],
					['#fde68a', 0.2],
					['#fb923c', 0.62],
					['#ef4444', 1],
				],
				alpha: [
					[0.18, 0],
					[1, 0.08],
					[0.52, 0.5],
					[0, 1],
				],
			},
			sizeOverLife: [0.48, 1.08, 0.88, 0.06],
			speedOverLife: [1.18, 0.88, 0.42, 0.04],
		},
		rendererEmitterSettings: {
			speedFactor: 0.55,
			lengthFactor: 1.08,
		},
	},
});

export function spark(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(fireSparkPreset, options);
}
