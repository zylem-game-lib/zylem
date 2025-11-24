import { createGame, vessel, createStage } from '@zylem/game-lib';

const test = vessel();
test.setup = (params: any) => {
	console.log('setup', params);
}
test.update = (params: any) => {
	// console.log('update', params);
}
test.destroy = (params: any) => {
	console.log('destroy', params);
}

const stage1 = createStage();
const testGame = createGame(
	{ id: 'zylem', debug: true },
	stage1,
	test
);



export default testGame;


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