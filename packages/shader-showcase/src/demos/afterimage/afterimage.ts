/**
 * Afterimage — motion-trail postprocessing effect registered through
 * game-lib's post-effect chain (`postProcessingEffects` stage option).
 */
import { createCamera, createGame, createStage, Perspectives } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { createAfterimageEffect } from '@zylem/shaders/postprocessing';
import { Color } from 'three';
import type { ShowcaseDemo } from '../../demo-types';
import { rangeControl } from '../_shared/controls';

const ORBITERS = [
	{ color: '#38bdf8', radius: 7, speed: 1.6, phase: 0, tilt: 0.0 },
	{ color: '#f472b6', radius: 5, speed: -2.2, phase: 2.0, tilt: 0.5 },
	{ color: '#facc15', radius: 9, speed: 1.1, phase: 4.0, tilt: -0.35 },
] as const;

export default function createDemo(): ShowcaseDemo {
	const trails = createAfterimageEffect({ damp: 0.92 });

	const orbiters = ORBITERS.map(({ color, radius, speed, phase, tilt }) => {
		let elapsed = phase;
		const sphere = createSphere({
			radius: 0.9,
			position: { x: Math.cos(phase) * radius, y: 0, z: Math.sin(phase) * radius },
			material: { color: new Color(color) },
		});
		sphere.onUpdate(({ me, delta }) => {
			elapsed += delta * speed;
			me.setPosition(
				Math.cos(elapsed) * radius,
				Math.sin(elapsed * 1.7) * radius * tilt,
				Math.sin(elapsed) * radius,
			);
		});
		return sphere;
	});

	const camera = createCamera({
		perspective: Perspectives.ThirdPerson,
		position: { x: 0, y: 6, z: -22 },
		target: { x: 0, y: 0, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: '#05070c',
			postProcessingEffects: [trails.effect],
		},
		camera,
	);
	for (const orbiter of orbiters) {
		stage.add(orbiter);
	}

	const game = createGame(
		{
			id: 'shader-showcase-afterimage',
		},
		stage,
	);

	return {
		game,
		description:
			"Three.js's node-based afterimage effect (the TSL port of AfterimageShader.js), plugged into game-lib's render pipeline via the postProcessingEffects stage option.",
		controls: [rangeControl('Damp (trail length)', trails.uniforms.damp, 0.5, 0.995, 0.005)],
	};
}
