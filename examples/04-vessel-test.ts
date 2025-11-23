import { createGame, vessel, createStage } from '../src/api/main';
import { SetupContext, UpdateContext, DestroyContext } from '../src/lib/core/base-node-life-cycle';

const test = vessel();
test.setup = (params: SetupContext<any>) => {
	console.log('setup', params);
}
test.update = (params: UpdateContext<any>) => {
	// console.log('update', params);
}
test.destroy = (params: DestroyContext<any>) => {
	console.log('destroy', params);
}

const stage1 = createStage();
const testGame = createGame(
	{ id: 'zylem', debug: true },
	stage1,
	test
);

testGame.start();


/**
 * 
 * import { update } from '../src/lib/actions/update';
 * import { sphere } from '../src/lib/entities';
 * const mySphere = await sphere({
 * 	size: new Vector3(4, 4, 4),
 * 	position: { x: 0, y: 0, z: 0 },
 * 	collision: { static: false },
 * 	material: { path: marsSurfacePath },
 * });
 * 
 * update(mySphere, (context) => {
 * 
 * });
 * 
 */