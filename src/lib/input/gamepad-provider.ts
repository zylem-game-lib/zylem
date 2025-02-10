import { InputProvider } from './input-provider';
import { AnalogState, ButtonState, InputGamepad } from './input';

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

	private handleAnalogState(index: number, gamepad: Gamepad, delta: number): AnalogState {
		const value = gamepad.axes[index];
		return { value, held: delta };
	}

	getInput(delta: number): Partial<InputGamepad> {
		const gamepad = navigator.getGamepads()[this.gamepadIndex];
		if (!gamepad) return {};

		return {
			buttons: {
				A: this.handleButtonState(0, gamepad, delta),
				B: this.handleButtonState(1, gamepad, delta),
				X: this.handleButtonState(2, gamepad, delta),
				Y: this.handleButtonState(3, gamepad, delta),
				Start: this.handleButtonState(9, gamepad, delta),
				Select: this.handleButtonState(8, gamepad, delta),
				L: this.handleButtonState(4, gamepad, delta),
				R: this.handleButtonState(5, gamepad, delta),
			},
			directions: {
				Up: this.handleButtonState(12, gamepad, delta),
				Down: this.handleButtonState(13, gamepad, delta),
				Left: this.handleButtonState(14, gamepad, delta),
				Right: this.handleButtonState(15, gamepad, delta),
			},
			axes: {
				Horizontal: this.handleAnalogState(0, gamepad, delta),
				Vertical: this.handleAnalogState(1, gamepad, delta),
			},
			shoulders: {
				LTrigger: this.handleButtonState(6, gamepad, delta),
				RTrigger: this.handleButtonState(7, gamepad, delta),
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