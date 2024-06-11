import { game } from "../../src/main";
import { LevelOne } from "./level-1";

const platformer = game({
	id: 'playground',
	globals: {
		score: 0,
		lives: 3,
		time: 0,
		actualTime: 0,
	},
	stages: [
		LevelOne(),
	],
});

platformer.start();