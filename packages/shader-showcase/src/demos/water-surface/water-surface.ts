/**
 * Water Surface — procedural animated water material on an XZ plane, with
 * bobbing spheres for depth reference and a gradient sky.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createPlane, createSphere } from '@zylem/game-lib/entity';
import { createGradientSky } from '@zylem/game-lib/graphics';
import { createWaterSurface } from '@zylem/shaders';
import { Color } from 'three';
import type { ShowcaseDemo } from '../../demo-types';
import { colorControl, rangeControl } from '../_shared/controls';

const FLOATERS = [
	{ x: -6, z: 4, color: '#f97316', phase: 0.0 },
	{ x: 5, z: -3, color: '#facc15', phase: 2.1 },
	{ x: 10, z: 8, color: '#ef4444', phase: 4.2 },
] as const;

// Static spheres resting under the surface, visible through the water.
const SUBMERGED = [
	{ x: -2, y: -2.2, z: 10, radius: 1.6, color: '#22c55e' },
	{ x: 7, y: -3.5, z: 2, radius: 2.2, color: '#a855f7' },
	{ x: -9, y: -1.6, z: -2, radius: 1.2, color: '#f43f5e' },
] as const;

export default function createDemo(): ShowcaseDemo {
	const water = createWaterSurface({ opacity: 0.5 });
	const u = water.uniforms;

	// Subdivided so the shader's positionNode has vertices to displace.
	const waterPlane = createPlane({
		tile: { x: 120, y: 120 },
		subdivisions: 160,
		position: { x: 0, y: 0, z: 0 },
		collision: { static: true },
		material: { shader: water },
	});

	// Sandy seafloor under the transparent water.
	const seafloor = createPlane({
		tile: { x: 120, y: 120 },
		subdivisions: 1,
		position: { x: 0, y: -6, z: 0 },
		collision: { static: true },
		material: { color: new Color('#3d4a45') },
	});

	const submerged = SUBMERGED.map(({ x, y, z, radius, color }) =>
		createSphere({
			radius,
			position: { x, y, z },
			collision: { static: true },
			material: { color: new Color(color) },
		}),
	);

	const floaters = FLOATERS.map(({ x, z, color, phase }) => {
		let elapsed = phase;
		const sphere = createSphere({
			radius: 1.1,
			position: { x, y: 0.7, z },
			material: { color: new Color(color) },
		});
		sphere.onUpdate(({ me, delta }) => {
			elapsed += delta;
			me.setPosition(x, 0.55 + Math.sin(elapsed * 1.3) * 0.35, z);
		});
		return sphere;
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 10, z: -26 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundShader: createGradientSky(
				[0.05, 0.09, 0.16],
				[0.55, 0.65, 0.8],
				[0.08, 0.2, 0.42],
			),
		},
		camera,
	);

	stage.add(seafloor);
	for (const sphere of submerged) {
		stage.add(sphere);
	}
	stage.add(waterPlane);
	for (const floater of floaters) {
		stage.add(floater);
	}

	const game = createGame(
		{
			id: 'shader-showcase-water-surface',
		},
		stage,
	);

	return {
		game,
		description:
			'TSL water surface inspired by the threejs-water surface shaders: displaced wave geometry, procedural normals, Schlick fresnel against a sky gradient, and an HDR sun spot.',
		controls: [
			rangeControl('Wave scale', u.waveScale, 0.05, 1.5, 0.01),
			rangeControl('Wave speed', u.waveSpeed, 0, 3, 0.05),
			rangeControl('Wave strength', u.waveStrength, 0, 4, 0.05),
			rangeControl('Wave amplitude', u.waveAmplitude, 0, 2.5, 0.05),
			rangeControl('Opacity', u.opacity, 0, 1, 0.05),
			rangeControl('Sun intensity', u.sunIntensity, 0, 3, 0.05),
			rangeControl('Sun sharpness', u.sunSharpness, 50, 5000, 50),
			colorControl('Shallow color', u.shallowColor),
			colorControl('Deep color', u.deepColor),
			colorControl('Horizon color', u.skyColor),
			colorControl('Zenith color', u.zenithColor),
		],
	};
}
