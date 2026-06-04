import { RenderMode } from 'three.quarks';

import {
	createSemanticParticleEffect,
	defineSemanticParticlePreset,
	type SemanticParticlePresetOptions,
} from '../../preset-builder';

export const fireBlazePreset = defineSemanticParticlePreset({
	family: 'fire',
	variant: 'blaze',
	description: 'sustained, strong open burning',
	axes: {
		'heat feel': 'intense',
		'hunger/spread tendency': 'high',
		'smoke affinity': 'medium',
		turbulence: 'high',
		residuality: 'medium',
	},
	system: {
		defaults: {
			duration: 1.8,
			looping: true,
			color: '#f97316',
			life: [0.55, 1.1],
			size: [0.32, 0.62],
			speed: [0.55, 1.4],
			rotation: [-0.24, 0.24],
			opacity: 0.96,
			renderMode: RenderMode.VerticalBillBoard,
		},
		emission: { type: 'rate', rate: 42 },
		shape: {
			type: 'cone',
			radius: 0.18,
			thickness: 1,
			angle: 0.28,
			speed: [0.35, 0.95],
		},
		behaviors: {
			colorOverLife: {
				colors: [
					['#ffffff', 0],
					['#fde68a', 0.18],
					['#fb923c', 0.5],
					['#ef4444', 1],
				],
				alpha: [
					[0.18, 0],
					[1, 0.08],
					[0.56, 0.54],
					[0, 1],
				],
			},
			sizeOverLife: [0.45, 0.92, 1.14, 0.22],
			speedOverLife: [1.08, 0.96, 0.62, 0.16],
			forceOverLife: {
				y: [0.38, 0.72],
			},
			noise: {
				frequency: [4.5, 6.5],
				power: [0.1, 0.18],
				positionAmount: [0.32, 0.55],
				rotationAmount: [0.18, 0.3],
			},
		},
	},
});

export function blaze(
	options: SemanticParticlePresetOptions = {},
) {
	return createSemanticParticleEffect(fireBlazePreset, options);
}
