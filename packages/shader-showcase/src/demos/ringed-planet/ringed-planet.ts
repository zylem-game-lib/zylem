/**
 * Ringed Planet — procedural planet surface and ring system from the
 * zylem-planet-demo, set against the starry night skybox.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createDisk, createSphere } from '@zylem/game-lib/entity';
import { createPlanetRing, createPlanetSurface, createStarryNight } from '@zylem/shaders';
import type { ShowcaseDemo } from '../../demo-types';
import { colorControl, rangeControl } from '../_shared/controls';

export default function createDemo(): ShowcaseDemo {
	const surface = createPlanetSurface();
	const ring = createPlanetRing();
	const su = surface.uniforms;
	const ru = ring.uniforms;

	const planet = createSphere({
		radius: 20,
		material: { shader: surface },
	});
	let rotation = 180;
	planet.onUpdate(({ me, delta }) => {
		rotation += delta * 5;
		me.setRotationDegreesY(rotation);
	});

	const ringDisk = createDisk({
		innerRadius: 25,
		outerRadius: 36,
		thetaSegments: 64,
		material: { shader: ring },
	}).onSetup(({ me }: any) => {
		me.setRotationDegreesZ(-23);
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 30, z: -80 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundShader: createStarryNight(),
		},
		camera,
	);
	stage.add(planet);
	stage.add(ringDisk);

	const game = createGame(
		{
			id: 'shader-showcase-ringed-planet',
		},
		stage,
	);

	return {
		game,
		description:
			'Procedural planet (3D FBM through a three-stop ramp) and a semi-transparent ring system (noisy bands, orbital dust, sparse rocks), from the zylem-planet-demo.',
		controls: [
			rangeControl('Planet speed', su.speed, 0, 2, 0.05),
			rangeControl('Planet noise scale', su.noiseScale, 0.25, 4, 0.05),
			rangeControl('Planet contrast', su.contrast, 0, 1, 0.02),
			colorControl('Planet color A', su.colorA),
			colorControl('Planet color B', su.colorB),
			colorControl('Planet color C', su.colorC),
			rangeControl('Ring band frequency', ru.bandFrequency, 4, 64, 1),
			rangeControl('Ring rock density', ru.rockDensity, 0, 1, 0.02),
			rangeControl('Ring max alpha', ru.maxAlpha, 0, 1, 0.02),
			colorControl('Ring color A', ru.colorA),
			colorControl('Ring color B', ru.colorB),
			colorControl('Ring rock color', ru.rockColor),
		],
	};
}
