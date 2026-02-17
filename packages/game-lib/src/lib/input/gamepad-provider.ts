import { InputProvider, AnalogState, ButtonState, InputGamepad } from './input';

export class GamepadProvider implements InputProvider {
	private gamepadIndex: number;
	private connected: boolean = false;

	private buttonStates: Record<number, ButtonState> = {};
	private analogStates: Record<number, AnalogState> = {};

	private onConnected = (e: GamepadEvent) => {
		if (e.gamepad.index === this.gamepadIndex) {
			this.connected = true;
		}
	};
	private onDisconnected = (e: GamepadEvent) => {
		if (e.gamepad.index === this.gamepadIndex) {
			this.connected = false;
		}
	};

	constructor(gamepadIndex: number) {
		this.gamepadIndex = gamepadIndex;
		window.addEventListener('gamepadconnected', this.onConnected);
		window.addEventListener('gamepaddisconnected', this.onDisconnected);
	}

	/** Removes event listeners and cleans up state. */
	dispose(): void {
		window.removeEventListener('gamepadconnected', this.onConnected);
		window.removeEventListener('gamepaddisconnected', this.onDisconnected);
		this.buttonStates = {};
		this.analogStates = {};
	}

	private handleButtonState(index: number, gamepad: Gamepad, delta: number): ButtonState {
		let state = this.buttonStates[index];
		if (!state) {
			state = { pressed: false, released: false, held: 0 };
			this.buttonStates[index] = state;
		}

		const isPressed = gamepad.buttons[index].pressed;
		state.pressed = isPressed && state.held === 0;
		state.released = !isPressed && state.held > 0;
		state.held = isPressed ? state.held + delta : 0;

		return state;
	}

	private handleAnalogState(index: number, gamepad: Gamepad, delta: number): AnalogState {
		let state = this.analogStates[index];
		if (!state) {
			state = { value: 0, held: 0 };
			this.analogStates[index] = state;
		}

		state.value = gamepad.axes[index];
		state.held = state.value !== 0 ? state.held + delta : 0;

		return state;
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
			SecondaryHorizontal: this.handleAnalogState(2, gamepad, delta),
			SecondaryVertical: this.handleAnalogState(3, gamepad, delta),
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