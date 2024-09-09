import { game, stage, sphere } from '../../src/main';

const example = game(
	stage(),
	sphere({
		update: ({ entity: ball, inputs }) => {
			const { horizontal, vertical } = inputs[0];
			ball.moveXY(horizontal * 5, -vertical * 5);
		}
	}),
	sphere()
);

example.start();