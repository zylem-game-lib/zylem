import { game, vessel, box } from '../../src/main';

const test = vessel();
const test2 = vessel(vessel(), vessel());
const test3 = vessel({ test: 'test' }, vessel({ test1: 'test' }), vessel({ test2: 'test' }));
const myBox = box();

const testGame = game(
	{ id: 'zylem' },
	test, test2, test3, myBox
);

// test3.update = ({ delta, entity }) => {
// 	console.log(delta, entity);
// }
testGame.start();
testGame.update(({ delta }) => {
	console.log(delta);
});

