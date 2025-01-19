import { game, vessel, box } from '../../src/main';

const test = vessel();
test.update = ({ entity }) => {
	// console.log(entity);
};
test.setup = ({ entity }) => {
	console.log(entity);
};

const test2 = vessel(vessel(), vessel());
const test3 = vessel({ test: 'test' }, vessel({ test1: 'test' }), vessel({ test2: 'test' }));
const myBox = await box();

const testGame = game(
	{ id: 'zylem' },
	test, test2, test3, myBox
);

testGame.start();
testGame.update(({ delta }) => {
	console.log(delta);
});

