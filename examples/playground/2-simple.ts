import { game, stage, box } from '../../src/main';

const example = game(
	{ debug: true },
	stage(),
	box()
);

example.start();
