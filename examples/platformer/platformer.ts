import { Zylem } from "../../src/main";
import { LevelOne } from "./level-1";

const { create } = Zylem;

const game = create({
	id: 'platformer',
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

game.start();