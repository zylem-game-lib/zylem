import { InputProvider } from './input-provider';
import { ButtonState, InputGamepad } from './input';

export class KeyboardProvider implements InputProvider {
	private keyStates = new Map<string, boolean>();
	private keyButtonStates = new Map<string, ButtonState>();

	constructor() {
		window.addEventListener('keydown', ({ key }) => this.keyStates.set(key, true));
		window.addEventListener('keyup', ({ key }) => this.keyStates.set(key, false));
	}

	private isKeyPressed(key: string): boolean {
		return this.keyStates.get(key) || false;
	}

	private handleButtonState(key: string, delta: number): ButtonState {
		let buttonState = this.keyButtonStates.get(key);
		const isPressed = this.isKeyPressed(key);

		if (!buttonState) {
			buttonState = { pressed: false, released: false, held: 0 };
			this.keyButtonStates.set(key, buttonState);
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
		return {
			buttons: {
				A: this.handleButtonState('z', delta),
				B: this.isKeyPressed('x'),
				X: this.isKeyPressed('a'),
				Y: this.isKeyPressed('s'),
				Start: this.isKeyPressed(' '),
				Select: this.isKeyPressed('Enter'),
				L: this.isKeyPressed('q'),
				R: this.isKeyPressed('e'),
			},
			directions: {
				Up: this.isKeyPressed('ArrowUp') || this.isKeyPressed('w'),
				Down: this.isKeyPressed('ArrowDown') || this.isKeyPressed('s'),
				Left: this.isKeyPressed('ArrowLeft') || this.isKeyPressed('a'),
				Right: this.isKeyPressed('ArrowRight') || this.isKeyPressed('d'),
			},
			axes: {
				Horizontal: this.getAxisValue('ArrowLeft', 'ArrowRight'),
				Vertical: this.getAxisValue('ArrowUp', 'ArrowDown'),
			},
			shoulders: {
				LTrigger: this.isKeyPressed('q') ? 1 : 0,
				RTrigger: this.isKeyPressed('e') ? 1 : 0,
			}
		};
	}

	getName(): string {
		return 'keyboard';
	}

	private getAxisValue(negativeKey: string, positiveKey: string): number {
		return (this.isKeyPressed(positiveKey) ? 1 : 0) - (this.isKeyPressed(negativeKey) ? 1 : 0);
	}

	isConnected(): boolean {
		return true;
	}
} 