import { Color, Vector2 } from "three";
import { createStage, createText } from "@zylem/game-lib";

const startGameText = createText({
	name: 'startGameText',
	text: 'Press A ("z" on keyboard) to start the game',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(0.5, 0.5),
});

export const stageZero = createStage({
	backgroundColor: new Color(Color.NAMES.black),
});

stageZero.add(startGameText);