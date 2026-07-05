/**
 * Foliage — stylized wind-swaying bushes ported from the vanilla-three
 * "stylized bush" sandbox: collapsed leaf quads expanded toward the camera
 * in the vertex stage, cut out by a leaf mask, with a color ramp and
 * fresnel rim.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createBox, createPlane } from '@zylem/game-lib/entity';
import { createFoliage, createFoliageClusterGeometry } from '@zylem/shaders';
import { Color, Mesh } from 'three';
import type { ShowcaseDemo } from '../../demo-types';
import { colorControl, rangeControl } from '../_shared/controls';

const BUSHES = [
	{ x: 0, z: 0, scale: 1.6, seed: 1 },
	{ x: -6, z: 3, scale: 1.1, seed: 7 },
	{ x: 5.5, z: -2, scale: 1.3, seed: 13 },
	{ x: 3, z: 5, scale: 0.9, seed: 21 },
] as const;

export default function createDemo(): ShowcaseDemo {
	const foliage = createFoliage();
	const u = foliage.uniforms;

	const bushes = BUSHES.map(({ x, z, scale, seed }) => {
		const geometry = createFoliageClusterGeometry({
			leafCount: 420,
			radius: { x: scale, y: scale * 0.8, z: scale },
			seed,
		});
		const bush = createBox({
			size: { x: 1, y: 1, z: 1 },
			position: { x, y: 0, z },
			collision: { static: true },
			material: { shader: foliage },
		});
		// Swap the box geometry for the collapsed leaf-quad cluster; the
		// foliage positionNode expands the quads at render time.
		bush.onSetup(({ me }: any) => {
			const target = me.mesh ?? me.group;
			target?.traverse?.((child: unknown) => {
				if (child instanceof Mesh) {
					child.geometry = geometry;
					child.frustumCulled = false;
				}
			});
			if (target instanceof Mesh) {
				target.geometry = geometry;
				target.frustumCulled = false;
			}
		});
		return bush;
	});

	const ground = createPlane({
		tile: { x: 60, y: 60 },
		subdivisions: 1,
		position: { x: 0, y: 0, z: 0 },
		collision: { static: true },
		material: { color: new Color('#334b61') },
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 3.5, z: -10 },
		target: { x: 0, y: 1.2, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: '#1a2230',
		},
		camera,
	);
	stage.add(ground);
	for (const bush of bushes) {
		stage.add(bush);
	}

	const game = createGame(
		{
			id: 'shader-showcase-foliage',
		},
		stage,
	);

	return {
		game,
		description:
			'Stylized foliage from the vanilla-three bush sandbox: leaf quads collapsed to points in the geometry, billboarded toward the camera in the vertex stage, swayed by wind, and shaded with a color ramp plus fresnel rim.',
		controls: [
			rangeControl('Wind strength', u.windStrength, 0, 20, 0.25),
			rangeControl('Wind scale', u.windScale, 0.25, 20, 0.25),
			rangeControl('Wind density', u.windDensity, 0.25, 20, 0.25),
			rangeControl('Leaf scale', u.leafScale, 0.05, 1.2, 0.01),
			rangeControl('Color ramp', u.colorRamp, 0.05, 1.5, 0.01),
			rangeControl('Rotation variation', u.faceRotationVariation, -3, 3, 0.05),
			rangeControl('Fresnel strength', u.fresnelStrength, -2, 2, 0.05),
			rangeControl('Speed', u.speed, 0, 4, 0.05),
			colorControl('Top color', u.topColor),
			colorControl('Bottom color', u.bottomColor),
			colorControl('Fresnel color', u.fresnelColor),
		],
	};
}
