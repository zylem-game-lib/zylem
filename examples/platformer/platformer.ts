import { Zylem } from "../../src/main";
const { Game } = Zylem;
import { LevelOne } from "./level-1";

const platformer = Game({
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