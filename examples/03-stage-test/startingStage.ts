import { Color, Vector2 } from "three";
import { stage, text } from "../../src/main";

const startGameText = await text({
	name: 'startGameText',
	text: 'Press A to start the game',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(window.innerWidth / 2, window.innerHeight / 2),
});

export const startingStage = stage({
	backgroundColor: new Color(Color.NAMES.black),
}, startGameText);