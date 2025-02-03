import { InputProvider } from './input-provider';
import { ButtonState, InputGamepad } from './input';

export class GamepadProvider implements InputProvider {
	private gamepadIndex: number;
	private connected: boolean = false;

	private buttonStates: Record<number, ButtonState> = {};

	constructor(gamepadIndex: number) {
		this.gamepadIndex = gamepadIndex;
		window.addEventListener('gamepadconnected', (e) => {
			if (e.gamepad.index === this.gamepadIndex) {
				this.connected = true;
			}
		});
		window.addEventListener('gamepaddisconnected', (e) => {
			if (e.gamepad.index === this.gamepadIndex) {
				this.connected = false;
			}
		});
	}

	private handleButtonState(index: number, gamepad: Gamepad, delta: number): ButtonState {
		const isPressed = gamepad.buttons[index].pressed;
		let buttonState = this.buttonStates[index];

		if (!buttonState) {
			buttonState = { pressed: false, released: false, held: 0 };
			this.buttonStates[index] = buttonState;
		}

		if (isPressed) {
			if (buttonState.held === 0) {
				buttonState.pressed = true;
			} else {
				buttonState.pressed = false;
			}
			buttonState.held += delta;
			buttonState.released = false;
		} else {
			if (buttonState.held > 0) {
				buttonState.released = true;
				buttonState.held = 0;
			} else {
				buttonState.released = false;
			}
			buttonState.pressed = false;
		}

		return buttonState;
	}

	getInput(delta: number): Partial<InputGamepad> {
		const gamepad = navigator.getGamepads()[this.gamepadIndex];
		if (!gamepad) return {};

		return {
			buttons: {
				A: this.handleButtonState(0, gamepad, delta),
				B: gamepad.buttons[1].pressed,
				X: gamepad.buttons[2].pressed,
				Y: gamepad.buttons[3].pressed,
				Start: gamepad.buttons[9].pressed,
				Select: gamepad.buttons[8].pressed,
				L: gamepad.buttons[4].pressed,
				R: gamepad.buttons[5].pressed,
			},
			directions: {
				Up: gamepad.axes[1] < -0.1,
				Down: gamepad.axes[1] > 0.1,
				Left: gamepad.axes[0] < -0.1,
				Right: gamepad.axes[0] > 0.1,
			},
			axes: {
				Horizontal: Math.abs(gamepad.axes[0]) > 0.1 ? gamepad.axes[0] : 0,
				Vertical: Math.abs(gamepad.axes[1]) > 0.1 ? gamepad.axes[1] : 0,
			},
			shoulders: {
				LTrigger: gamepad.buttons[6].value,
				RTrigger: gamepad.buttons[7].value,
			}
		};
	}

	getName(): string {
		return `gamepad-${this.gamepadIndex + 1}`;
	}

	isConnected(): boolean {
		return this.connected;
	}
} 