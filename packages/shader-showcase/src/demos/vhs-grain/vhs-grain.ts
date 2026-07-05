/**
 * VHS Grain — analog-tape postprocessing: film grain, a rolling tracking
 * band with per-line wobble, RGB color fringing, and scanlines, registered
 * through game-lib's post-effect chain.
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { createVhsGrainEffect } from '@zylem/shaders/postprocessing';
import { Color } from 'three';
import type { ShowcaseDemo } from '../../demo-types';
import { rangeControl } from '../_shared/controls';

const ORBITERS = [
	{ color: '#f87171', radius: 6, speed: 1.2, phase: 0, tilt: 0.3 },
	{ color: '#4ade80', radius: 8, speed: -0.9, phase: 2.1, tilt: -0.2 },
	{ color: '#60a5fa', radius: 4.5, speed: 1.7, phase: 4.2, tilt: 0.45 },
	{ color: '#facc15', radius: 9.5, speed: 0.7, phase: 1.0, tilt: -0.4 },
] as const;

export default function createDemo(): ShowcaseDemo {
	const vhs = createVhsGrainEffect();
	const u = vhs.uniforms;

	const orbiters = ORBITERS.map(({ color, radius, speed, phase, tilt }) => {
		let elapsed = phase;
		const sphere = createSphere({
			radius: 1.4,
			position: { x: Math.cos(phase) * radius, y: 0, z: Math.sin(phase) * radius },
			material: { color: new Color(color) },
		});
		sphere.onUpdate(({ me, delta }) => {
			elapsed += delta * speed;
			me.setPosition(
				Math.cos(elapsed) * radius,
				Math.sin(elapsed * 1.3) * radius * tilt,
				Math.sin(elapsed) * radius,
			);
		});
		return sphere;
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 5, z: -20 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: '#101418',
			postProcessingEffects: [vhs.effect],
		},
		camera,
	);
	for (const orbiter of orbiters) {
		stage.add(orbiter);
	}

	const game = createGame(
		{
			id: 'shader-showcase-vhs-grain',
		},
		stage,
	);

	return {
		game,
		description:
			'VHS tape look composed in TSL: FilmNode-style grain, a tracking-noise band that slowly rolls down the screen with per-line horizontal wobble, analog RGB color fringing, and CRT scanlines.',
		controls: [
			rangeControl('Grain intensity', u.grainIntensity, 0, 1, 0.02),
			rangeControl('Tracking intensity', u.trackingIntensity, 0, 1, 0.02),
			rangeControl('Color shift', u.colorShift, 0, 0.01, 0.0002),
			rangeControl('Scanline intensity', u.scanlineIntensity, 0, 1, 0.02),
			rangeControl('Scanline count', u.scanlineCount, 50, 1000, 10),
		],
	};
}
