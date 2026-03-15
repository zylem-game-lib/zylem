/// <reference types="@zylem/assets" />
import { Color, Vector2, Vector3 } from 'three';
import {
	createGame,
	createStage,
	createCamera,
	createBox,
	createText,
	Perspectives,
	type PerspectiveType,
} from '@zylem/game-lib';
import { playgroundPlane, playgroundActor } from '../utils';

import woodPath from '@zylem/assets/3d/textures/wood-box.jpg';
import { Vec3Input } from '@zylem/game-lib';

export default function createDemo() {
	// ─── Scene entities ──────────────────────────────────────────────────────

	const ground = playgroundPlane('grass');

	const boxes = [
		createBox({
			position: { x: -6, y: 4, z: 0 },
			size: { x: 2, y: 2, z: 2 },
			collision: { static: false },
			material: { color: new Color(Color.NAMES.tomato) },
		}),
		createBox({
			position: { x: 0, y: 4, z: -4 },
			size: { x: 3, y: 3, z: 3 },
			collision: { static: false },
			material: { path: woodPath },
		}),
		createBox({
			position: { x: 6, y: 4, z: 2 },
			size: { x: 2, y: 4, z: 2 },
			collision: { static: false },
			material: { color: new Color(Color.NAMES.royalblue) },
		}),
		createBox({
			position: { x: -3, y: 4, z: 6 },
			size: { x: 2, y: 2, z: 2 },
			collision: { static: false },
			material: { color: new Color(Color.NAMES.gold) },
		}),
	];

	const actor = playgroundActor('mascot');

	// ─── Perspective definitions ─────────────────────────────────────────────

	interface PerspectiveDef {
		type: PerspectiveType;
		label: string;
		options: { initialPosition: Vec3Input; initialLookAt: Vec3Input };
	}

	const perspectiveDefs: PerspectiveDef[] = [
		{
			type: Perspectives.ThirdPerson,
			label: 'Third Person',
			options: {
				initialPosition: { x: 0, y: 10, z: 30 },
				initialLookAt: { x: 0, y: 0, z: 0 },
			},
		},
		{
			type: Perspectives.Isometric,
			label: 'Isometric',
			options: {
				initialPosition: { x: 25, y: 25, z: 25 },
				initialLookAt: { x: 0, y: 0, z: 0 },
			},
		},
		{
			type: Perspectives.FirstPerson,
			label: 'First Person',
			options: {
				initialPosition: { x: 0, y: 2, z: 15 },
				initialLookAt: { x: 0, y: 2, z: 0 },
			},
		},
		{
			type: Perspectives.Fixed2D,
			label: 'Fixed 2D',
			options: {
				initialPosition: { x: 0, y: 0, z: 30 },
				initialLookAt: { x: 0, y: 0, z: 0 },
			},
		},
	];

	let perspIdx = 0;

	// ─── Cameras ─────────────────────────────────────────────────────────────

	const firstPersp = perspectiveDefs[0]!;
	const mainCamera = createCamera({
		position: firstPersp.options.initialPosition,
		target: firstPersp.options.initialLookAt,
		perspective: Perspectives.ThirdPerson,
		name: 'main',
	});

	const pipCamera = createCamera({
		position: { x: 0, y: 8, z: 20 },
		target: { x: 0, y: 0, z: 0 },
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
		screenPosition: { x: 0.5, y: 0.05 },
	});

	const controlsLabel = createText({
		name: 'controlsLabel',
		text: '[A] Next  [B] Prev',
		fontSize: 14,
		stickToViewport: true,
		screenPosition: { x: 0.5, y: 0.1 },
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

	const game = createGame({ id: 'camera-test', debug: true }, stage);

	game.onUpdate(({ inputs }: any) => {
		const { p1 } = inputs;

		if (p1.buttons.A.pressed) {
			perspIdx = (perspIdx + 1) % perspectiveDefs.length;
			applyPerspective();
		}
		if (p1.buttons.B.pressed) {
			perspIdx =
				(perspIdx - 1 + perspectiveDefs.length) % perspectiveDefs.length;
			applyPerspective();
		}
	});

	function applyPerspective() {
		const def = perspectiveDefs[perspIdx]!;
		mainCamera.setPerspective(def.type, def.options);
		perspLabel.updateText(def.label);
	}

	return game;
}
