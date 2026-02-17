import { Color, Vector2 } from 'three';
import { createGame, createStage, createText, useArrowsForDirections, useIJKLForAxes, useMouse } from '@zylem/game-lib';

const stage1 = createStage({
	inputs: {
		p1: ['gamepad-1', 'keyboard-1'],
		p2: ['gamepad-2', 'keyboard-2'],
	},
	backgroundColor: new Color(Color.NAMES.mediumseagreen)
});

stage1.setInputConfiguration(
	useArrowsForDirections('p1'),
	useIJKLForAxes('p1'),
	useMouse('p1'),
);

const inputText = createText({
	name: 'inputText',
	text: 'Use a gamepad or keyboard to control the game',
	fontSize: 36,
	screenPosition: new Vector2(0.5, 0.5),
});

const mouseInputText = createText({
	name: 'mouseInputText',
	text: '<mouse input>',
	fontSize: 36,
	screenPosition: new Vector2(0.5, 0.25),
});

stage1.add(inputText);
stage1.add(mouseInputText);

const formatNumber = (num: number) => num.toFixed(2);

const myGame = createGame(
	stage1,
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
		if (Math.abs(axis.value) >= 0.1) {
			inputText.updateText(`${name}: ${formatNumber(axis.value)} (held ${formatNumber(axis.held)}s)`);
		}
	}

	const ptr = p1.pointer;
	const leftClick = p1.shoulders.LTrigger;
	const rightClick = p1.shoulders.RTrigger;
	const moveX = p1.axes.SecondaryHorizontal.value;
	const moveY = p1.axes.SecondaryVertical.value;
	const isDragging = leftClick.held > 0 && (moveX !== 0 || moveY !== 0);

	const pos = ptr ? `position: (${formatNumber(ptr.x)}, ${formatNumber(ptr.y)})` : 'position: <>';
	const move = `move: (${formatNumber(moveX)}, ${formatNumber(moveY)})`;
	const drag = isDragging ? 'dragging' : 'idle';
	const left = leftClick.held > 0 ? `L:${formatNumber(leftClick.held)}s` : leftClick.released ? 'L:released' : 'L:up';
	const right = rightClick.held > 0 ? `R:${formatNumber(rightClick.held)}s` : rightClick.released ? 'R:released' : 'R:up';

	mouseInputText.updateText(`${pos} | ${move} | ${drag} | ${left} | ${right}`);
});

export default myGame;
