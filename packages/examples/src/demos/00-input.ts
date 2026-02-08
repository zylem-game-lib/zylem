import { Color, Vector2 } from 'three';
import { createGame, createStage, createText } from '@zylem/game-lib';

const stage1 = createStage({
	inputs: {
		p1: ['gamepad-1', 'keyboard-1'],
		p2: ['gamepad-2', 'keyboard-2'],
	},
	backgroundColor: new Color(Color.NAMES.mediumseagreen)
});

const inputText = createText({
	name: 'inputText',
	text: 'Use a gamepad or keyboard to control the game',
	fontSize: 36,
	screenPosition: new Vector2(0.5, 0.5),
});

stage1.add(inputText);

const formatNumber = (num: number) => num.toFixed(2);

const myGame = createGame(
	stage1,
	{
		input: {
			p1: {
				key: {
					'j': ['axes.Left'],
					'l': ['axes.Right'],
					'i': ['axes.Up'],
					'k': ['axes.Down'],
				},
			},
		},
	},
).onSetup(({ game }) => {
	console.log(game);
}).onUpdate(({ inputs }) => {
	const { p1 } = inputs;
	for (const [name, button] of Object.entries(p1.buttons)) {
		if (button.pressed) {
			inputText.updateText(`${name} just pressed`);
		}
		if (button.released) {
			inputText.updateText(`${name} just released`);
		}
		if (button.held > 0) {
			inputText.updateText(`${name} held for ${formatNumber(button.held)} seconds`);
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
			inputText.updateText(`${name} held for ${formatNumber(direction.held)} seconds`);
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
			inputText.updateText(`${name} held for ${formatNumber(shoulder.held)} seconds`);
		}
	}
	for (const [name, axis] of Object.entries(p1.axes)) {
		if (axis.value >= 0.5) {
			inputText.updateText(`${name} held for ${formatNumber(axis.held)} seconds`);
		}
		if (axis.value <= -0.5) {
			inputText.updateText(`${name} held for ${formatNumber(axis.held)} seconds`);
		}
	}
});

export default myGame;
