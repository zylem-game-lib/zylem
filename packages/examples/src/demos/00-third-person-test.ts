/// <reference types="@zylem/assets" />

import { Vector3 } from 'three';
import { createGame, createStage, createZone, Platformer3DBehavior } from '@zylem/game-lib';
import { playgroundPlane, playgroundActor, playgroundPlatforms } from '../utils';
import skybox from '@zylem/assets/3d/skybox/default.png';
import { UpdateContext } from '@zylem/game-lib';
import { createCamera } from '@zylem/game-lib';
import { TransformableEntity } from '~/lib/actions/capabilities/apply-transform';
import { GameEntity } from '~/lib/entities';
import { StageEntity } from '@zylem/game-lib';

const groundPlane = playgroundPlane('dirt');
const player = playgroundActor('player') as TransformableEntity & GameEntity<any> & StageEntity;
const platforms = playgroundPlatforms();

const camera = createCamera({
	position: { x: 0, y: 8, z: 7 },
	perspective: 'third-person',
});

const stage = createStage({
	gravity: new Vector3(0, -9.82, 0),
	backgroundImage: skybox
}, camera);

// Attach platformer behavior with double-jump
const platformerHandle = player.use(Platformer3DBehavior, {
	walkSpeed: 10,
	runSpeed: 20,
	jumpForce: 16,
	maxJumps: 2, // Double jump!
	gravity: 9.82,
	groundRayLength: 0.25,
});

const startingZone = createZone({
	position: { x: 0, y: 0, z: 0 },
	size: new Vector3(10, 10, 10),
	onEnter: ({ self, visitor, globals }) => {
		// testGame.log(`${visitor.uuid} entered the starting zone 🚶♂️`);
	},
	onExit: ({ self, visitor, globals }) => {
		// testGame.log(`${visitor.uuid} exited the starting zone 🚶♂️`);
	},
});

const endingZone = createZone({
	position: { x: 0, y: 30, z: 0 },
	size: new Vector3(10, 10, 10),
	onEnter: ({ self, visitor, globals }) => {
		// testGame.log(`${visitor.uuid} entered the ending zone ⛳️`);
	},
	onExit: ({ self, visitor, globals }) => {
		// testGame.log(`${visitor.uuid} exited the ending zone ⛳️`);
	},
});

stage.add(startingZone);
stage.add(endingZone);
stage.add(groundPlane);
stage.add(player);
stage.add(...platforms);

const game = createGame(
	{
		id: 'behaviors-test',
		debug: true,
	},
	stage
);

let lastMovement = new Vector3();
player.onSetup(({ me }) => {
	camera.cameraRef.target = me;
});

player.onUpdate(({ inputs, me }: UpdateContext<any>) => {
	const { p1 } = inputs;

	const horizontal = p1.axes.Horizontal.value;
	const vertical = p1.axes.Vertical.value;

	me.$platformer.moveX = horizontal;
	me.$platformer.moveZ = vertical;
	me.$platformer.jump = p1.buttons.A.held > 0;
	me.$platformer.run = p1.shoulders.LTrigger.held > 0;

	const state = platformerHandle.getState();

	switch (state) {
		case 'running':
			me.playAnimation({ key: 'running' });
			break;
		case 'walking':
			me.playAnimation({ key: 'walking' });
			break;
		case 'jumping':
			me.playAnimation({ key: 'jumping-up', pauseAtEnd: true });
			break;
		case 'falling':
			me.playAnimation({ key: 'jumping-down', pauseAtEnd: true });
			break;
		case 'landing':
			me.playAnimation({ key: 'idle' });
			break;
		default:
			me.playAnimation({ key: 'idle' });
			break;
	}
	if (Math.abs(horizontal) > 0.2 || Math.abs(vertical) > 0.2) {
		lastMovement.set(horizontal, 0, vertical);
	}
	if (lastMovement.lengthSq() > 0) {
		me.rotateInDirection(lastMovement);
	}
});

export default game;