import { Color } from 'three';
import { game, stage } from '../../src/main';

const stage1 = stage({
	inputs: {
		p1: ['gamepad-1', 'keyboard-1'],
		p2: ['gamepad-2', 'keyboard-2'],
	},
	backgroundColor: new Color(Color.NAMES.mediumseagreen)
});


const myGame = game(
	stage1,
);

myGame.setup = ({ game }) => {
	console.log(game);
};

myGame.update = ({ inputs }) => {
	const { p1 } = inputs;
	// console.log(p1);
	for (const button in p1.buttons) {
		if (p1.buttons[button].pressed) {
			console.log(button, 'just pressed');
		}
		if (p1.buttons[button].released) {
			console.log(button, 'just released');
		}
		if (p1.buttons[button].held > 0) {
			console.log(button, 'held for', p1.buttons[button].held, 'seconds');
		}
	}
	for (const direction in p1.directions) {
		if (p1.directions[direction].pressed) {
			console.log(direction, 'just pressed');
		}
		if (p1.directions[direction].released) {
			console.log(direction, 'just released');
		}
		if (p1.directions[direction].held > 0) {
			console.log(direction, 'held for', p1.directions[direction].held, 'seconds');
		}
	}
	for (const shoulder in p1.shoulders) {
		if (p1.shoulders[shoulder].pressed) {
			console.log(shoulder, 'just pressed');
		}
		if (p1.shoulders[shoulder].released) {
			console.log(shoulder, 'just released');
		}
		if (p1.shoulders[shoulder].held > 0) {
			console.log(shoulder, 'held for', p1.shoulders[shoulder].held, 'seconds');
		}
	}
	for (const axis in p1.axes) {
		if (p1.axes[axis].value >= 0.5) {
			console.log(axis, 'held for', p1.axes[axis].held, 'seconds');
		}
		if (p1.axes[axis].value <= -0.5) {
			console.log(axis, 'held for', p1.axes[axis].held, 'seconds');
		}
	}
}

myGame.start();
