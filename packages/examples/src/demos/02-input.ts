import { Color, Vector2 } from 'three';
import { createGame, createStage, text } from '@zylem/game-lib';

const stage1 = createStage({
	inputs: {
		p1: ['gamepad-1', 'keyboard-1'],
		p2: ['gamepad-2', 'keyboard-2'],
	},
	backgroundColor: new Color(Color.NAMES.mediumseagreen)
});

const inputText = await text({
	name: 'inputText',
	text: 'Use a gamepad or keyboard to control the game',
	fontSize: 36,
	screenPosition: new Vector2(0.5, 0.5),
});

stage1.add(inputText);

const myGame = createGame(
	stage1,
);

myGame.setup = ({ game }) => {
	console.log(game);
};

myGame.update = ({ inputs }) => {
	const { p1 } = inputs;
	for (const [name, button] of Object.entries(p1.buttons)) {
		if (button.pressed) {
			inputText.updateText(`${name} just pressed`);
		}
		if (button.released) {
			inputText.updateText(`${name} just released`);
		}
		if (button.held > 0) {
			inputText.updateText(`${name} held for ${button.held} seconds`);
		}
	}
	for (const [name, direction] of Object.entries(p1.directions)) {
		if (direction.pressed) {
			inputText.updateText(`${name} just pressed`);
		}
		if (direction.released) {
			inputText.updateText(`${name} just released`);
		}
		if (direction.held > 0) {
			inputText.updateText(`${name} held for ${direction.held} seconds`);
		}
	}
	for (const [name, shoulder] of Object.entries(p1.shoulders)) {
		if (shoulder.pressed) {
			inputText.updateText(`${name} just pressed`);
		}
		if (shoulder.released) {
			inputText.updateText(`${name} just released`);
		}
		if (shoulder.held > 0) {
			inputText.updateText(`${name} held for ${shoulder.held} seconds`);
		}
	}
	for (const [name, axis] of Object.entries(p1.axes)) {
		if (axis.value >= 0.5) {
			inputText.updateText(`${name} held for ${axis.held} seconds`);
		}
		if (axis.value <= -0.5) {
			inputText.updateText(`${name} held for ${axis.held} seconds`);
		}
	}
}

export default myGame;
