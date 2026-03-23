import { RenderMode } from 'three.quarks';

import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const waterTorrentPreset = defineSemanticParticlePreset({
	family: 'water',
	variant: 'torrent',
	description: 'strong, forceful, dense flow',
	axes: {
		pressure: 'high',
		'surface tension feel': 'driven',
		aeration: 'medium',
		coherence: 'strong',
		'gravitational obedience': 'high',
	},
	system: {
		defaults: {
			duration: 1,
			looping: true,
			color: '#38bdf8',
			life: [0.35, 0.75],
			size: [0.1, 0.22],
			speed: [2.6, 4.9],
			rotation: [-0.3, 0.3],
			opacity: 0.84,
			renderMode: RenderMode.StretchedBillBoard,
		},
		emission: { type: 'rate', rate: 60 },
		shape: {
			type: 'cone',
			radius: 0.18,
			thickness: 1,
			angle: 0.12,
			speed: [1.8, 3.1],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#f0f9ff', 0],
					['#7dd3fc', 0.35],
					['#0ea5e9', 1],
				],
				alpha: [
					[0.18, 0],
					[0.92, 0.08],
					[0.56, 0.52],
					[0, 1],
				],
			},
			sizeOverLife: [0.72, 0.94, 0.84, 0.28],
			speedOverLife: [1.04, 0.92, 0.68, 0.34],
			forceOverLife: {
				y: [-6.8, -4.8],
			},
			noise: {
				frequency: [1.4, 2.6],
				power: [0.04, 0.09],
				positionAmount: [0.08, 0.14],
				rotationAmount: [0.06, 0.1],
			},
		},
		rendererEmitterSettings: {
			speedFactor: 0.56,
			lengthFactor: 1.08,
		},
	},
});

export function torrent(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(waterTorrentPreset, options);
}
