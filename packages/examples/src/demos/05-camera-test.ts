/// <reference types="@zylem/assets" />
import { Color, Vector2, Vector3 } from 'three';
import {
	createGame, createStage, createCamera, createBox, createText,
	Perspectives, type PerspectiveType,
} from '@zylem/game-lib';
import { playgroundPlane, playgroundActor } from '../utils';

import woodPath from '@zylem/assets/3d/textures/wood-box.jpg';

// ─── Scene entities ──────────────────────────────────────────────────────

const ground = playgroundPlane('grass');

const boxes = [
	createBox({
		position: { x: -6, y: 4, z: 0 },
		size: new Vector3(2, 2, 2),
		collision: { static: false },
		material: { color: new Color(Color.NAMES.tomato) },
	}),
	createBox({
		position: { x: 0, y: 4, z: -4 },
		size: new Vector3(3, 3, 3),
		collision: { static: false },
		material: { path: woodPath },
	}),
	createBox({
		position: { x: 6, y: 4, z: 2 },
		size: new Vector3(2, 4, 2),
		collision: { static: false },
		material: { color: new Color(Color.NAMES.royalblue) },
	}),
	createBox({
		position: { x: -3, y: 4, z: 6 },
		size: new Vector3(2, 2, 2),
		collision: { static: false },
		material: { color: new Color(Color.NAMES.gold) },
	}),
];

const actor = playgroundActor('mascot');

// ─── Perspective definitions ─────────────────────────────────────────────

interface PerspectiveDef {
	type: PerspectiveType;
	label: string;
	options: { initialPosition: Vector3; initialLookAt: Vector3 };
}

const perspectiveDefs: PerspectiveDef[] = [
	{
		type: Perspectives.ThirdPerson,
		label: 'Third Person',
		options: {
			initialPosition: new Vector3(0, 10, 30),
			initialLookAt: new Vector3(0, 0, 0),
		},
	},
	{
		type: Perspectives.Isometric,
		label: 'Isometric',
		options: {
			initialPosition: new Vector3(25, 25, 25),
			initialLookAt: new Vector3(0, 0, 0),
		},
	},
	{
		type: Perspectives.FirstPerson,
		label: 'First Person',
		options: {
			initialPosition: new Vector3(0, 2, 15),
			initialLookAt: new Vector3(0, 2, 0),
		},
	},
	{
		type: Perspectives.Fixed2D,
		label: 'Fixed 2D',
		options: {
			initialPosition: new Vector3(0, 0, 30),
			initialLookAt: new Vector3(0, 0, 0),
		},
	},
];

let perspIdx = 0;

// ─── Cameras ─────────────────────────────────────────────────────────────

const firstPersp = perspectiveDefs[0]!;
const mainCamera = createCamera({
	position: firstPersp.options.initialPosition.clone(),
	target: firstPersp.options.initialLookAt.clone(),
	perspective: Perspectives.ThirdPerson,
	name: 'main',
});

const pipCamera = createCamera({
	position: new Vector3(0, 8, 20),
	target: new Vector3(0, 0, 0),
	perspective: Perspectives.ThirdPerson,
	name: 'pip',
	viewport: { x: 0.68, y: 0.02, width: 0.3, height: 0.3 },
});

// ─── HUD text ────────────────────────────────────────────────────────────

const perspLabel = createText({
	name: 'perspLabel',
	text: 'Third Person',
	fontSize: 22,
	stickToViewport: true,
	screenPosition: new Vector2(0.5, 0.05),
});

const controlsLabel = createText({
	name: 'controlsLabel',
	text: '[A] Next  [B] Prev',
	fontSize: 14,
	stickToViewport: true,
	screenPosition: new Vector2(0.5, 0.1),
});

// ─── Stage ───────────────────────────────────────────────────────────────

const stage = createStage(
	{ gravity: new Vector3(0, -9.82, 0) },
	mainCamera,
	pipCamera,
);

stage.add(ground);
stage.add(...boxes);
stage.add(actor);
stage.add(perspLabel);
stage.add(controlsLabel);

// Assign actor as the PiP camera's target once the entity is ready
actor.onSetup(({ me }: any) => {
	pipCamera.addTarget(me);
});

// ─── Game ────────────────────────────────────────────────────────────────

const game = createGame(
	{ id: 'camera-test', debug: true },
	stage,
);

game.onUpdate(({ inputs }: any) => {
	const { p1 } = inputs;

	if (p1.buttons.A.pressed) {
		perspIdx = (perspIdx + 1) % perspectiveDefs.length;
		applyPerspective();
	}
	if (p1.buttons.B.pressed) {
		perspIdx = (perspIdx - 1 + perspectiveDefs.length) % perspectiveDefs.length;
		applyPerspective();
	}
});

function applyPerspective() {
	const def = perspectiveDefs[perspIdx]!;
	mainCamera.setPerspective(def.type, def.options);
	perspLabel.updateText(def.label);
}

export default game;
