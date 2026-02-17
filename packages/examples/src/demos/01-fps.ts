/// <reference types="@zylem/assets" />

import { Euler, Vector3 } from 'three';
import {
	createGame,
	createStage,
	createCamera,
	createActor,
	gameConfig,
	Perspectives,
	useWASDForAxes,
	useMouseLook,
	FirstPersonPerspective,
	FirstPersonController,
} from '@zylem/game-lib';

import { createFloor, createArenaLevel } from './01-fps/level';

import skybox from '@zylem/assets/3d/skybox/default.png';
import pistolGlb from '../assets/space-age-pistol.glb';

// --- Camera ---

const fpsCamera = createCamera({
	perspective: Perspectives.FirstPerson,
	position: new Vector3(0, 2, 5),
	target: new Vector3(0, 2, 0),
	name: 'fps',
	damping: 0.15,
	skipDebugOrbit: true,
});

const fps = fpsCamera.getPerspective<FirstPersonPerspective>();

// --- Pistol viewmodel (actor with FPS behavior) ---

const pistol = createActor({
	name: 'pistol',
	models: [pistolGlb],
	scale: new Vector3(1, 1, 1),
	collision: {
		static: true,
		size: new Vector3(1, 1, 1),
	},
	position: { x: 0, y: 0, z: 0 },
});

const fpsController = pistol.use(FirstPersonController, {
	perspective: fps,
	walkSpeed: 8,
	runSpeed: 16,
	lookSensitivity: 2,
	viewmodel: {
		entity: pistol,
		offset: new Vector3(-1.4, -0.85, -0.5),
		rotation: new Euler(0, -1.8, -0.1)
	},
});

// --- Stage + input ---

const stage = createStage(
	{
		gravity: new Vector3(0, -20, 0),
		backgroundImage: skybox,
	},
	fpsCamera,
);

stage.setInputConfiguration(
	useWASDForAxes('p1'),
	useMouseLook('p1'),
);

// --- Entities ---

const floor = createFloor();
const walls = createArenaLevel();

// --- Game ---

const myGameConfig = gameConfig({
	id: 'fps-demo',
	debug: true,
	bodyBackground: '#1a1a1a',
});

const game = createGame(
	myGameConfig,
	stage,
	floor,
	...walls,
	pistol,
).onUpdate(({ inputs }) => {
	const { p1 } = inputs;

	// Write input to the behavior's input component.
	// $fps is lazily created by the behavior system on the first frame.
	const fpsInput = (pistol as any).$fps;
	if (!fpsInput) return;

	fpsInput.moveX = p1.axes.Horizontal.value;
	fpsInput.moveZ = p1.axes.Vertical.value;
	fpsInput.lookX = p1.axes.SecondaryHorizontal.value;
	fpsInput.lookY = p1.axes.SecondaryVertical.value;
	fpsInput.sprint = p1.shoulders.LTrigger.held > 0;
});

export default game;
