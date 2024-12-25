import { game, stage, box } from '../../src/main';

const test = box();

const example = game(
	{ debug: true },
	stage(),
	test
);

example.start();
