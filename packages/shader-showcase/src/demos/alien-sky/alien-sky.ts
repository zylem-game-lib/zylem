/**
 * Alien Sky — full 360° skybox from the arena demo's Mars scene: night sky
 * with stars, a Milky Way band, a spiral galaxy, a shaded moon, a warm
 * horizon glow, and mountain silhouettes over a desert floor.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { createAlienSky } from '@zylem/shaders';
import { Color } from 'three';
import type { ShowcaseDemo } from '../../demo-types';
import { colorControl, rangeControl } from '../_shared/controls';

export default function createDemo(): ShowcaseDemo {
	const sky = createAlienSky();
	const u = sky.uniforms;

	// A slowly drifting foreground sphere for scale/parallax reference.
	let orbit = 0;
	const probe = createSphere({
		radius: 1.2,
		position: { x: 0, y: 1, z: 8 },
		material: { color: new Color('#c2b8a8') },
	});
	probe.onUpdate(({ me, delta }) => {
		orbit += delta * 0.2;
		me.setPosition(Math.sin(orbit) * 7, 1 + Math.sin(orbit * 0.6), Math.cos(orbit) * 7);
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 1.5, z: -14 },
		target: { x: 0, y: 2, z: 0 },
	});

	const stage = createStage(
		{
			backgroundShader: sky,
		},
		camera,
	);
	stage.add(probe);

	const game = createGame(
		{
			id: 'shader-showcase-alien-sky',
		},
		stage,
	);

	return {
		game,
		description:
			'Alien planet skybox generalized from the arena Mars background: gradient night sky, twinkling stars, Milky Way band, spiral galaxy, shaded moon, horizon glow, and layered mountain silhouettes over a desert floor.',
		controls: [
			rangeControl('Speed', u.speed, 0, 4, 0.05),
			rangeControl('Star intensity', u.starIntensity, 0, 3, 0.05),
			rangeControl('Band intensity', u.bandIntensity, 0, 3, 0.05),
			rangeControl('Galaxy intensity', u.galaxyIntensity, 0, 3, 0.05),
			rangeControl('Glow intensity', u.glowIntensity, 0, 3, 0.05),
			colorControl('Horizon', u.horizonColor),
			colorControl('Glow', u.glowColor),
			colorControl('Galaxy', u.galaxyColor),
			colorControl('Moon', u.moonColor),
			colorControl('Ground near', u.groundNearColor),
			colorControl('Ground mid', u.groundMidColor),
			colorControl('Mountains', u.mountainColor),
		],
	};
}
