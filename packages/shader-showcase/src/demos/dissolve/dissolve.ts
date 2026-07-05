/**
 * Dissolve — noise-thresholded dissolve with a glowing HDR edge, ported from
 * the react-three-fiber dissolve-effect sandbox. Progress ping-pongs
 * automatically so the meshes continuously burn away and re-materialize.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createBox, createSphere } from '@zylem/game-lib/entity';
import { createDissolve } from '@zylem/shaders';
import type { ShowcaseDemo } from '../../demo-types';
import { colorControl, rangeControl } from '../_shared/controls';

export default function createDemo(): ShowcaseDemo {
	const dissolve = createDissolve();
	const u = dissolve.uniforms;
	const animSpeed = { value: 0.3 };

	const sphere = createSphere({
		radius: 3,
		position: { x: -4.5, y: 0, z: 0 },
		material: { shader: dissolve },
	});
	const box = createBox({
		size: { x: 4.5, y: 4.5, z: 4.5 },
		position: { x: 4.5, y: 0, z: 0 },
		material: { shader: dissolve },
	});

	// Ping-pong the dissolve progress; one driver is enough since the
	// shader (and its uniforms) are shared by both meshes.
	let elapsed = 0;
	sphere.onUpdate(({ delta }) => {
		elapsed += delta * animSpeed.value;
		const t = elapsed % 2;
		u.progress.value = t < 1 ? t : 2 - t;
	});

	let rotation = 0;
	box.onUpdate(({ me, delta }) => {
		rotation += delta * 10;
		me.setRotationDegreesY(rotation);
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 2, z: -16 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: '#101318',
		},
		camera,
	);
	stage.add(sphere);
	stage.add(box);

	const game = createGame(
		{
			id: 'shader-showcase-dissolve',
		},
		stage,
	);

	return {
		game,
		description:
			'Dissolve effect ported from the r3f dissolve-effect sandbox: 3D FBM thresholded against an animated progress, discarding dissolved fragments and painting a glowing HDR border along the front.',
		controls: [
			rangeControl('Animation speed', animSpeed, 0, 1.5, 0.01),
			rangeControl('Edge thickness', u.thickness, 0.01, 0.4, 0.01),
			rangeControl('Edge intensity', u.intensity, 1, 12, 0.25),
			rangeControl('Noise scale', u.noiseScale, 0.5, 10, 0.1),
			colorControl('Edge color', u.edgeColor),
			colorControl('Base color', u.baseColor),
		],
	};
}
