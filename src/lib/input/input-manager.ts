import { InputProvider } from './input-provider';
import { AnalogState, ButtonState, InputGamepad, InputPlayerNumber, Inputs } from './input';
import { KeyboardProvider } from './keyboard-provider';
import { GamepadProvider } from './gamepad-provider';


export class InputManager {
	private inputMap: Map<InputPlayerNumber, InputProvider[]> = new Map();
	private currentInputs: Inputs = {} as Inputs;
	private previousInputs: Inputs = {} as Inputs;

	constructor() {
		this.addInputProvider(1, new KeyboardProvider());
		this.addInputProvider(1, new GamepadProvider(0));
		this.addInputProvider(2, new GamepadProvider(1));
		this.addInputProvider(3, new GamepadProvider(2));
		this.addInputProvider(4, new GamepadProvider(3));
		this.addInputProvider(5, new GamepadProvider(4));
		this.addInputProvider(6, new GamepadProvider(5));
		this.addInputProvider(7, new GamepadProvider(6));
		this.addInputProvider(8, new GamepadProvider(7));
	}

	addInputProvider(playerNumber: InputPlayerNumber, provider: InputProvider) {
		if (!this.inputMap.has(playerNumber)) {
			this.inputMap.set(playerNumber, []);
		}
		this.inputMap.get(playerNumber)?.push(provider);
	}

	getInputs(delta: number): Inputs {
		const inputs = {} as Inputs;
		this.inputMap.forEach((providers, playerNumber) => {
			const playerKey = `p${playerNumber}` as const;

			const mergedInput = providers.reduce((acc, provider) => {
				const input = provider.getInput(delta);
				return this.mergeInputs(acc, input);
			}, {} as Partial<InputGamepad>);

			inputs[playerKey] = {
				playerNumber: playerNumber as InputPlayerNumber,
				...mergedInput
			} as InputGamepad;
		});
		return inputs;
	}

	mergeButtonState(a: ButtonState | undefined, b: ButtonState | undefined): ButtonState {
		return {
			pressed: a?.pressed || b?.pressed || false,
			released: a?.released || b?.released || false,
			held: (a?.held || 0) + (b?.held || 0),
		};
	}

	mergeAnalogState(a: AnalogState | undefined, b: AnalogState | undefined): AnalogState {
		return {
			value: (a?.value || 0) + (b?.value || 0),
			held: (a?.held || 0) + (b?.held || 0),
		};
	}

	private mergeInputs(a: Partial<InputGamepad>, b: Partial<InputGamepad>): Partial<InputGamepad> {
		return {
			buttons: {
				A: this.mergeButtonState(a.buttons?.A, b.buttons?.A),
				B: this.mergeButtonState(a.buttons?.B, b.buttons?.B),
				X: this.mergeButtonState(a.buttons?.X, b.buttons?.X),
				Y: this.mergeButtonState(a.buttons?.Y, b.buttons?.Y),
				Start: this.mergeButtonState(a.buttons?.Start, b.buttons?.Start),
				Select: this.mergeButtonState(a.buttons?.Select, b.buttons?.Select),
				L: this.mergeButtonState(a.buttons?.L, b.buttons?.L),
				R: this.mergeButtonState(a.buttons?.R, b.buttons?.R),
			},
			directions: {
				Up: this.mergeButtonState(a.directions?.Up, b.directions?.Up),
				Down: this.mergeButtonState(a.directions?.Down, b.directions?.Down),
				Left: this.mergeButtonState(a.directions?.Left, b.directions?.Left),
				Right: this.mergeButtonState(a.directions?.Right, b.directions?.Right),
			},
			axes: {
				Horizontal: this.mergeAnalogState(a.axes?.Horizontal, b.axes?.Horizontal),
				Vertical: this.mergeAnalogState(a.axes?.Vertical, b.axes?.Vertical),
			},
			shoulders: {
				LTrigger: this.mergeButtonState(a.shoulders?.LTrigger, b.shoulders?.LTrigger),
				RTrigger: this.mergeButtonState(a.shoulders?.RTrigger, b.shoulders?.RTrigger),
			}
		};
	}
} 