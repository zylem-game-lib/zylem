import { game, vessel, stage } from '../../src/main';

const test = vessel();
test.setup = (params) => {
	console.log('setup', params);
}
test.update = (params) => {
	console.log('update', params);
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


