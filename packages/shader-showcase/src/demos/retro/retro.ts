/**
 * Retro — PS1/CRT postprocessing chain from the three.js
 * `webgpu_postprocessing_retro` example: retro scene pass (vertex snapping,
 * affine textures, quarter-res nearest rendering) plus barrel curvature,
 * color bleeding, ordered dithering, posterize, vignette, and scanlines.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createBox, createLight, createSphere } from '@zylem/game-lib/entity';
import { createRetroEffect } from '@zylem/shaders/postprocessing';
import { Color } from 'three';
import type { ShowcaseDemo } from '../../demo-types';
import { rangeControl } from '../_shared/controls';

export default function createDemo(): ShowcaseDemo {
	const retro = createRetroEffect();
	const u = retro.uniforms;

	const ground = createBox({
		size: { x: 26, y: 0.5, z: 26 },
		position: { x: 0, y: -3.25, z: 0 },
		material: { color: new Color('#2c3145') },
	});

	// A small "diorama": rotating pedestal cube, orbiting moons, backdrop slabs.
	const pedestal = createBox({
		size: { x: 4, y: 4, z: 4 },
		position: { x: 0, y: -1, z: 0 },
		material: { color: new Color('#b3552e') },
	});
	let pedestalRot = 0;
	pedestal.onUpdate(({ me, delta }) => {
		pedestalRot += delta * 12;
		me.setRotationDegreesY(pedestalRot);
	});

	const MOONS = [
		{ color: '#8ecae6', radius: 6.5, speed: 0.9, phase: 0, height: 1.5 },
		{ color: '#ffb703', radius: 8, speed: -0.6, phase: 2.4, height: 3 },
	] as const;
	const moons = MOONS.map(({ color, radius, speed, phase, height }) => {
		let elapsed = phase;
		const moon = createSphere({
			radius: 1.1,
			position: { x: Math.cos(phase) * radius, y: height, z: Math.sin(phase) * radius },
			material: { color: new Color(color) },
		});
		moon.onUpdate(({ me, delta }) => {
			elapsed += delta * speed;
			me.setPosition(Math.cos(elapsed) * radius, height, Math.sin(elapsed) * radius);
		});
		return moon;
	});

	const slabs = [-9, -3, 3, 9].map((x, i) =>
		createBox({
			size: { x: 2, y: 5 + (i % 2) * 3, z: 2 },
			position: { x, y: -0.5 + ((i % 2) * 3) / 2, z: 9 },
			material: { color: new Color(i % 2 ? '#4a5d8a' : '#5f4a8a') },
		}),
	);

	const ambient = createLight({ type: 'ambient', intensity: 1.1 });
	const sun = createLight({
		type: 'directional',
		intensity: 2.4,
		position: { x: 8, y: 14, z: -8 },
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 4.5, z: -18 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: '#1a1030',
			postProcessingEffects: [retro.effect],
		},
		camera,
	);
	stage.add(ground);
	stage.add(pedestal);
	for (const moon of moons) {
		stage.add(moon);
	}
	for (const slab of slabs) {
		stage.add(slab);
	}
	stage.add(ambient);
	stage.add(sun);

	const game = createGame(
		{
			id: 'shader-showcase-retro',
		},
		stage,
	);

	return {
		game,
		description:
			'PS1/CRT pipeline from the three.js webgpu_postprocessing_retro example: vertex snapping and affine texture mapping at quarter resolution, then barrel curvature, color bleeding, ordered (Bayer) dithering, posterize, vignette, and scanlines.',
		controls: [
			rangeControl('Curvature', u.curvature, 0, 0.2, 0.01),
			rangeControl('Color depth', u.colorDepthSteps, 4, 32, 1),
			rangeControl('Scanlines', u.scanlineIntensity, 0, 1, 0.01),
			rangeControl('Scanline density', u.scanlineDensity, 0.02, 1, 0.01),
			rangeControl('Scanline speed', u.scanlineSpeed, 0, 0.1, 0.01),
			rangeControl('Vignette', u.vignetteIntensity, 0, 1, 0.01),
			rangeControl('Color bleeding', u.bleeding, 0, 0.005, 0.0005),
			rangeControl('Affine distortion', u.affineDistortion, 0, 1, 0.05),
		],
	};
}
