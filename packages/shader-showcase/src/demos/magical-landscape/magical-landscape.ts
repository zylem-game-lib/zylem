/**
 * Magical Landscape — volumetric raymarched fractal terrain rendered as a
 * fullscreen stage background shader.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createMagicalLandscape } from '@zylem/shaders';
import type { ShowcaseDemo } from '../../demo-types';
import { colorControl, rangeControl } from '../_shared/controls';

export default function createDemo(): ShowcaseDemo {
	const landscape = createMagicalLandscape();
	const u = landscape.uniforms;

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 0, z: -10 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundShader: landscape,
			defaultLighting: false,
		},
		camera,
	);

	const game = createGame(
		{
			id: 'shader-showcase-magical-landscape',
		},
		stage,
	);

	return {
		game,
		description:
			'Volumetric raymarched terrain flythrough ported from the "Magical Landscape" CodePen by Sabo Sugi. All parameters are live shader uniforms.',
		controls: [
			rangeControl('Flight speed', u.speed, 0, 10, 0.1),
			rangeControl('Step base', u.fractalStep, 0.001, 0.05, 0.0005),
			rangeControl('Step amplitude', u.fractalAmp, 0.01, 0.2, 0.001),
			rangeControl('Terrain scale', u.terrainScale, 0.1, 2, 0.01),
			rangeControl('Terrain base height', u.terrainBaseHeight, 0, 3, 0.1),
			rangeControl('Terrain amplitude', u.terrainAmp, 0.1, 3, 0.1),
			rangeControl('Ground offset', u.groundOffset, 0, 5, 0.1),
			colorControl('Color 1', u.color1),
			colorControl('Color 2', u.color2),
			colorControl('Color 3', u.color3),
			colorControl('Color 4', u.color4),
		],
	};
}
