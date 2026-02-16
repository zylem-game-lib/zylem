/// <reference types="@zylem/assets" />
import { Color, Vector3 } from 'three';
import {
	createGame, createStage, createCamera, createBox,
	Perspectives, setCameraFeed,
} from '@zylem/game-lib';
import { playgroundPlane, playgroundActor } from '../utils';

// ─── Scene entities ──────────────────────────────────────────────────────

const ground = playgroundPlane('grass');

const boxes = [
	createBox({
		position: { x: -6, y: 1, z: 0 },
		size: new Vector3(2, 2, 2),
		collision: { static: false },
		material: { color: new Color(Color.NAMES.tomato) },
	}),
	createBox({
		position: { x: 6, y: 1, z: 2 },
		size: new Vector3(2, 4, 2),
		collision: { static: false },
		material: { color: new Color(Color.NAMES.royalblue) },
	}),
	createBox({
		position: { x: 0, y: 1, z: -5 },
		size: new Vector3(3, 3, 3),
		collision: { static: false },
		material: { color: new Color(Color.NAMES.gold) },
	}),
];

const actor = playgroundActor('mascot');

// ─── Jumbotron screen (the mesh that shows the camera feed) ──────────────

const screenWidth = 24;
const screenHeight = screenWidth * (9 / 16);
const screenDepth = 0.3;

const jumbotronScreen = createBox({
	name: 'jumbotron',
	position: { x: 0, y: 12, z: -20 },
	size: new Vector3(screenWidth, screenHeight, screenDepth),
	collision: { static: true },
	material: { color: new Color(0x111111) },
});

const jumbotronFrame = createBox({
	name: 'jumbotron-frame',
	position: { x: 0, y: 12, z: -20.3 },
	size: new Vector3(screenWidth + 0.6, screenHeight + 0.6, screenDepth + 0.1),
	collision: { static: true },
	material: { color: new Color(0x333333) },
});

const jumbotronPost = createBox({
	name: 'jumbotron-post',
	position: { x: 0, y: 2, z: -20.3 },
	size: new Vector3(1.5, 6, 1),
	collision: { static: true },
	material: { color: new Color(0x555555) },
});

// ─── Cameras ─────────────────────────────────────────────────────────────

const mainCamera = createCamera({
	position: new Vector3(0, 10, 30),
	target: new Vector3(0, 0, 0),
	perspective: Perspectives.ThirdPerson,
	name: 'main',
});

const jumbotronCamera = createCamera({
	position: new Vector3(30, 0, 30),
	target: new Vector3(20, 20, 0),
	perspective: Perspectives.ThirdPerson,
	name: 'jumbotron-cam',
	renderToTexture: { width: 1024, height: 576 },
});

// ─── Wire up the jumbotron feed ──────────────────────────────────────────

jumbotronScreen.onSetup(({ me }: any) => {
	setCameraFeed(me, jumbotronCamera);
});

// Let the jumbotron camera follow the actor
actor.onSetup(({ me }: any) => {
	jumbotronCamera.addTarget(me);
});

// ─── Stage ───────────────────────────────────────────────────────────────

const stage = createStage(
	{ gravity: new Vector3(0, -9.82, 0) },
	mainCamera,
	jumbotronCamera,
);

stage.add(ground);
stage.add(...boxes);
stage.add(actor);
stage.add(jumbotronScreen);
stage.add(jumbotronFrame);
stage.add(jumbotronPost);

// ─── Game ────────────────────────────────────────────────────────────────

const game = createGame(
	{ id: 'jumbotron-test', debug: true },
	stage,
);

export default game;
