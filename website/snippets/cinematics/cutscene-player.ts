import {
	createCutscenePlayer,
	createStageCutsceneHost,
	type CutsceneDefinition,
} from '@zylem/game-lib/cinematics';
import { createStage } from '@zylem/game-lib/core';

const intro: CutsceneDefinition = {
	id: 'intro',
	name: 'Intro',
	duration: 5,
	stage: null,
	skippable: true,
	scenes: [
		{
			id: 'main',
			name: 'Main',
			start: 0,
			end: 5,
			transitionIn: { type: 'cut', duration: 0, easing: 'linear' },
		},
	],
	cameras: [
		{
			id: 'wide',
			name: 'Wide',
			kind: 'static',
			fov: 60,
			pose: {
				position: { x: 0, y: 5, z: 12 },
				lookAt: { x: 0, y: 0, z: 0 },
			},
			dollyEasing: 'linear',
			damping: 0.15,
			keyframes: [],
		},
	],
	dollies: [],
	tracks: [
		{
			kind: 'camera',
			id: 'cam-track',
			name: 'Camera',
			items: [
				{
					id: 'shot1',
					cameraId: 'wide',
					start: 0,
					end: 5,
					blend: { duration: 0, easing: 'linear' },
				},
			],
		},
	],
};

export function playIntroCutscene() {
	const stage = createStage({});
	const player = createCutscenePlayer(intro, {
		host: createStageCutsceneHost(stage),
		tick: 'manual',
	});
	player.on('complete', () => player.dispose());
	player.play();
	return player;
}
