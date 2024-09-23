import { game, stage, box } from '../../src/main';

const test = box();


const example = game(
	{ debug: true },
	stage(),
	box({
		update: ({ entity: cube, inputs }) => {
			const { horizontal, vertical } = inputs[0];
			cube.moveXY(horizontal * 5, -vertical * 5);
		}
	}),
	box({
		update: ({ entity: cube, inputs }) => {
			const { horizontal, vertical } = inputs[0];
			cube.moveXY(-horizontal * 5, vertical * 5);
		}
	}),
	test
);

example.start();