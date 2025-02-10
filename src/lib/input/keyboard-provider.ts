import { InputProvider } from './input-provider';
import { AnalogState, ButtonState, InputGamepad } from './input';

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

	private handleAnalogState(negativeKey: string, positiveKey: string, delta: number): AnalogState {
		const value = this.getAxisValue(negativeKey, positiveKey);
		return { value, held: delta };
	}

	getInput(delta: number): Partial<InputGamepad> {
		return {
			buttons: {
				A: this.handleButtonState('z', delta),
				B: this.handleButtonState('x', delta),
				X: this.handleButtonState('a', delta),
				Y: this.handleButtonState('s', delta),
				Start: this.handleButtonState(' ', delta),
				Select: this.handleButtonState('Enter', delta),
				L: this.handleButtonState('q', delta),
				R: this.handleButtonState('e', delta),
			},
			directions: {
				Up: this.handleButtonState('ArrowUp', delta),
				Down: this.handleButtonState('ArrowDown', delta),
				Left: this.handleButtonState('ArrowLeft', delta),
				Right: this.handleButtonState('ArrowRight', delta),
			},
			axes: {
				Horizontal: this.handleAnalogState('ArrowLeft', 'ArrowRight', delta),
				Vertical: this.handleAnalogState('ArrowUp', 'ArrowDown', delta),
			},
			shoulders: {
				LTrigger: this.handleButtonState('Q', delta),
				RTrigger: this.handleButtonState('E', delta),
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