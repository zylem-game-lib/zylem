import { Color, Vector2 } from "three";
import { stage, text } from "../../src/api/main";

const startGameText = await text({
	name: 'startGameText',
	text: 'Press A to start the game',
	fontSize: 20,
	stickToViewport: true,
	screenPosition: new Vector2(0.5, 0.5),
});

export const stage0 = stage({
	backgroundColor: new Color(Color.NAMES.black),
}, startGameText);