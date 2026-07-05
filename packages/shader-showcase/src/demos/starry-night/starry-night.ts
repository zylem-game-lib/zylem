/**
 * Starry Night — procedural space skybox: twinkling star layers, a tilted
 * Milky Way dust band with a bright core, and a nebula tint. A slowly
 * orbiting sphere gives the camera scene a foreground reference.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { createStarryNight } from '@zylem/shaders';
import { Color } from 'three';
import type { ShowcaseDemo } from '../../demo-types';
import { colorControl, rangeControl } from '../_shared/controls';

export default function createDemo(): ShowcaseDemo {
	const sky = createStarryNight();
	const u = sky.uniforms;

	let orbit = 0;
	const planet = createSphere({
		radius: 2.5,
		position: { x: 0, y: 0, z: 6 },
		material: { color: new Color('#7b6a58') },
	});
	planet.onUpdate(({ me, delta }) => {
		orbit += delta * 0.15;
		me.setPosition(Math.sin(orbit) * 9, Math.sin(orbit * 0.7) * 2, Math.cos(orbit) * 9);
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 0, z: -18 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundShader: sky,
		},
		camera,
	);
	stage.add(planet);

	const game = createGame(
		{
			id: 'shader-showcase-starry-night',
		},
		stage,
	);

	return {
		game,
		description:
			'Procedural space skybox rendered from the world-space view direction: three twinkling star layers, a tiltable Milky Way dust band with a bright core ridge, and a low-frequency nebula tint.',
		controls: [
			rangeControl('Star density', u.starDensity, 0, 0.6, 0.01),
			rangeControl('Star brightness', u.starBrightness, 0, 3, 0.05),
			rangeControl('Twinkle speed', u.twinkleSpeed, 0, 4, 0.05),
			rangeControl('Band intensity', u.bandIntensity, 0, 2.5, 0.05),
			rangeControl('Band width', u.bandWidth, 0.02, 0.6, 0.01),
			rangeControl('Nebula intensity', u.nebulaIntensity, 0, 4, 0.05),
			colorControl('Background', u.backgroundColor),
			colorControl('Dust edge', u.dustColorA),
			colorControl('Dust core', u.dustColorB),
			colorControl('Core ridge', u.coreColor),
			colorControl('Nebula', u.nebulaColor),
		],
	};
}
