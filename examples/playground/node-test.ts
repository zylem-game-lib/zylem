import { game, node, ZylemNode, box } from '../../src/main';

const test = node();
const test2 = node(node(), node());
const test3 = node({ test: 'test' }, node({ test1: 'test' }), node({ test2: 'test' }));
const myBox = box();

const testGame = game(
	{ id: 'zylem' },
	test, test2, test3, myBox
);

test3.update = ({ delta, entity }) => {
	console.log(delta, entity);
}
testGame.start();
testGame.update(({ delta }) => {
	console.log(delta);
});

