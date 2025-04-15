import { game, vessel, stage } from '../../src/main';

const test = vessel();
const test2 = vessel(vessel(), vessel());
const test3 = vessel({ test: 'test' }, vessel({ test1: 'test' }), vessel({ test2: 'test' }));

const stage1 = stage();
const testGame = game(
	{ id: 'zylem', debug: true },
	stage1,
	test, test2, test3,
);

testGame.start();


