/**
 * Lava — port of the classic three.js webgl_shader_lava demo (lava shader by
 * TheGameMaker) on rotating meshes, with a procedural noise + color-ramp
 * substitute for the original textures.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createBox, createSphere } from '@zylem/game-lib/entity';
import { createLava } from '@zylem/shaders';
import type { ShowcaseDemo } from '../../demo-types';
import { colorControl, rangeControl } from '../_shared/controls';

export default function createDemo(): ShowcaseDemo {
	const lava = createLava({ fogDensity: 0.04 });
	const u = lava.uniforms;

	const sphere = createSphere({
		radius: 4,
		position: { x: -6, y: 0, z: 0 },
		material: { shader: lava },
	});
	const box = createBox({
		size: { x: 6, y: 6, z: 6 },
		position: { x: 6, y: 0, z: 0 },
		material: { shader: lava },
	});

	let sphereRotation = 0;
	sphere.onUpdate(({ me, delta }) => {
		sphereRotation += delta * 6;
		me.setRotationDegreesY(sphereRotation);
	});
	let boxRotation = 0;
	box.onUpdate(({ me, delta }) => {
		boxRotation += delta * 10;
		me.setRotationDegreesY(boxRotation);
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 3, z: -22 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: '#050302',
		},
		camera,
	);
	stage.add(sphere);
	stage.add(box);

	const game = createGame(
		{
			id: 'shader-showcase-lava',
		},
		stage,
	);

	return {
		game,
		description:
			'Port of the classic three.js lava shader (webgl_shader_lava, by TheGameMaker): noise-warped drifting UV layers with hot-spot channel bleed and depth fog, procedural in place of the original textures.',
		controls: [
			rangeControl('Speed', u.speed, 0, 4, 0.05),
			rangeControl('Fog density', u.fogDensity, 0, 0.12, 0.002),
			colorControl('Dark color', u.darkColor),
			colorControl('Mid color', u.midColor),
			colorControl('Hot color', u.hotColor),
			colorControl('Fog color', u.fogColor),
		],
	};
}
