import { game, vessel, stage } from '../src/main';

const test = vessel();
test.setup = (params) => {
	console.log('setup', params);
}
test.update = (params) => {
	// console.log('update', params);
}
test.destroy = (params) => {
	console.log('destroy', params);
}

const stage1 = stage();
const testGame = game(
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