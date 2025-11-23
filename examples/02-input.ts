import { Color } from 'three';
import { createGame, createStage } from '../src/api/main';

const stage1 = createStage({
	inputs: {
		p1: ['gamepad-1', 'keyboard-1'],
		p2: ['gamepad-2', 'keyboard-2'],
	},
	backgroundColor: new Color(Color.NAMES.mediumseagreen)
});


const myGame = createGame(
	stage1,
);

myGame.setup = ({ game }) => {
	console.log(game);
};

myGame.update = ({ inputs }) => {
	const { p1 } = inputs;
	// console.log(p1);
	for (const [name, button] of Object.entries(p1.buttons)) {
		if (button.pressed) {
			console.log(name, 'just pressed');
		}
		if (button.released) {
			console.log(name, 'just released');
		}
		if (button.held > 0) {
			console.log(name, 'held for', button.held, 'seconds');
		}
	}
	for (const [name, direction] of Object.entries(p1.directions)) {
		if (direction.pressed) {
			console.log(name, 'just pressed');
		}
		if (direction.released) {
			console.log(name, 'just released');
		}
		if (direction.held > 0) {
			console.log(name, 'held for', direction.held, 'seconds');
		}
	}
	for (const [name, shoulder] of Object.entries(p1.shoulders)) {
		if (shoulder.pressed) {
			console.log(name, 'just pressed');
		}
		if (shoulder.released) {
			console.log(name, 'just released');
		}
		if (shoulder.held > 0) {
			console.log(name, 'held for', shoulder.held, 'seconds');
		}
	}
	for (const [name, axis] of Object.entries(p1.axes)) {
		if (axis.value >= 0.5) {
			console.log(name, 'held for', axis.held, 'seconds');
		}
		if (axis.value <= -0.5) {
			console.log(name, 'held for', axis.held, 'seconds');
		}
	}
}

myGame.start();
