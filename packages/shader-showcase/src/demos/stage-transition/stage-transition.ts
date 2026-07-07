/**
 * Stage Transition — blends between two stages using
 * `game.nextStage({ transition })`, cycling through the procedural patterns
 * (fade, wipe, radial, noise, cells). The "night" stage uses the starry-night
 * skybox with an orbiting sphere; the "day" stage is a warm scene with a
 * spinning box. Auto-advances on a timer so every pattern gets shown.
 */
import { Color } from 'three';
import { createCamera, createGame, createStage } from '@zylem/game-lib/core';
import { createBox, createSphere } from '@zylem/game-lib/entity';
import {
	createStageTransition,
	createStarryNight,
	type StageTransitionPattern,
	type ZylemStageTransition,
} from '@zylem/shaders';
import type { ShowcaseDemo } from '../../demo-types';

const PATTERNS: StageTransitionPattern[] = [
	'fade',
	'wipe',
	'radial',
	'noise',
	'cells',
];

export default function createDemo(): ShowcaseDemo {
	const transitions = new Map<StageTransitionPattern, ZylemStageTransition>(
		PATTERNS.map(pattern => [
			pattern,
			createStageTransition({ pattern, scale: 8 }),
		]),
	);

	const settings = {
		duration: 1.2,
		hold: 2.0,
	};

	// Night stage: starry skybox + orbiting sphere.
	let orbit = 0;
	const moon = createSphere({
		radius: 3,
		position: { x: 0, y: 0, z: 0 },
		material: { color: new Color('#b8c4d9') },
	});
	moon.onUpdate(({ me, delta }) => {
		orbit += delta * 0.4;
		me.setPosition(Math.sin(orbit) * 8, Math.sin(orbit * 0.6) * 2, Math.cos(orbit) * 8);
	});
	const nightStage = createStage(
		{ backgroundShader: createStarryNight() },
		createCamera({ position: { x: 0, y: 0, z: -20 }, target: { x: 0, y: 0, z: 0 } }),
		() => moon,
	);

	// Day stage: warm background + spinning box.
	let spin = 0;
	const crate = createBox({
		size: { x: 6, y: 6, z: 6 },
		material: { color: new Color('#c0392b') },
	});
	crate.onUpdate(({ me, delta }) => {
		spin += delta;
		me.setRotation(spin * 0.5, spin, 0);
	});
	const dayStage = createStage(
		{ backgroundColor: new Color('#e8a33d') },
		createCamera({ position: { x: 0, y: 4, z: 18 } }),
		() => crate,
	);

	let patternIndex = 0;
	let onNight = true;
	let elapsed = 0;

	const game = createGame(
		{ id: 'shader-showcase-stage-transition' },
		nightStage,
		dayStage,
	).onUpdate(({ delta }) => {
		elapsed += delta;
		if (elapsed < settings.hold + settings.duration) return;
		elapsed = 0;

		const pattern = PATTERNS[patternIndex % PATTERNS.length];
		patternIndex += 1;
		const transition = {
			duration: settings.duration,
			shader: transitions.get(pattern),
		};
		if (onNight) {
			game.nextStage({ transition });
		} else {
			game.previousStage({ transition });
		}
		onNight = !onNight;
	});

	return {
		game,
		description:
			'Stage transitions via game.nextStage({ transition }): the demo auto-advances between a starry night stage and a warm day stage, cycling the procedural patterns — fade, wipe, radial, noise, cells. Each blend starts from the outgoing stage\'s frozen last frame.',
		controls: [
			{
				type: 'range',
				label: 'Duration (s)',
				min: 0.2,
				max: 3,
				step: 0.1,
				value: settings.duration,
				onChange: value => {
					settings.duration = value;
				},
			},
			{
				type: 'range',
				label: 'Hold time (s)',
				min: 0.5,
				max: 6,
				step: 0.5,
				value: settings.hold,
				onChange: value => {
					settings.hold = value;
				},
			},
			{
				type: 'range',
				label: 'Edge softness',
				min: 0.01,
				max: 0.5,
				step: 0.01,
				value: 0.1,
				onChange: value => {
					for (const transition of transitions.values()) {
						transition.uniforms.threshold.value = value;
					}
				},
			},
			{
				type: 'range',
				label: 'Pattern scale',
				min: 2,
				max: 32,
				step: 1,
				value: 8,
				onChange: value => {
					for (const transition of transitions.values()) {
						transition.uniforms.scale.value = value;
					}
				},
			},
		],
	};
}
