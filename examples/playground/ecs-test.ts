import { Vector3 } from 'three';
import { game, stage, box, actor, move, bounce } from '../../src/main';

function behaviors(): any[] {
	return [
		{ component: bounce, values: { height: 4 } },
		{ component: move, values: { movement: 2 } }
	];
}

const gameConfig = {
	debug: true,
};

const level1 = stage({
	update: ({ inputs }) => {
		const { horizontal, vertical } = inputs[0];
		if (horizontal || vertical) {
			ecsTest.log(`horiz: ${horizontal} vert: ${vertical}`);
		}
	}
});

const ecsTest = game(
	gameConfig,
	level1,
	box({
		setup: ({ entity, camera }) => {
			ecsTest.log(entity.uuid);
			camera.move(new Vector3(0, 16, 0));
			camera.rotate(-0.2, 0, 0);
		},
		update: ({ entity }) => {
			ecsTest.log(bounce.height[entity.eid].toString());
		}
	}, ...behaviors()),
	actor({
		models: ['playground/health-box.gltf'],
		setup: ({ entity }) => {
			entity.setPosition(5, 0, 0);
		}
	})
);

ecsTest.start();