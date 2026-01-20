import { InputProvider } from './input-provider';
import { AnalogState, ButtonState, InputGamepad, InputPlayerNumber, Inputs } from './input';
import { KeyboardProvider } from './keyboard-provider';
import { GamepadProvider } from './gamepad-provider';
import { GameInputConfig } from '../game/game-interfaces';
import { mergeButtonState, mergeAnalogState } from './input-state';


export class InputManager {
	private inputMap: Map<InputPlayerNumber, InputProvider[]> = new Map();
	private currentInputs: Inputs = {} as Inputs;
	private previousInputs: Inputs = {} as Inputs;

	constructor(config?: GameInputConfig) {
		console.log('[InputManager] Constructor called with config:', config);
		console.log('[InputManager] config?.p1:', config?.p1);
		console.log('[InputManager] config?.p1?.key:', config?.p1?.key);
		
		if (config?.p1?.key) {
			console.log('[InputManager] Creating P1 KeyboardProvider with custom mapping:', config.p1.key);
			this.addInputProvider(1, new KeyboardProvider(config.p1.key, { includeDefaultBase: false }));
		} else {
			console.log('[InputManager] Creating P1 KeyboardProvider with default mapping');
			this.addInputProvider(1, new KeyboardProvider());
		}
		this.addInputProvider(1, new GamepadProvider(0));
		if (config?.p2?.key) {
			this.addInputProvider(2, new KeyboardProvider(config.p2.key, { includeDefaultBase: false }));
		}
		this.addInputProvider(2, new GamepadProvider(1));
		if (config?.p3?.key) {
			this.addInputProvider(3, new KeyboardProvider(config.p3.key, { includeDefaultBase: false }));
		}
		this.addInputProvider(3, new GamepadProvider(2));
		if (config?.p4?.key) {
			this.addInputProvider(4, new KeyboardProvider(config.p4.key, { includeDefaultBase: false }));
		}
		this.addInputProvider(4, new GamepadProvider(3));
		if (config?.p5?.key) {
			this.addInputProvider(5, new KeyboardProvider(config.p5.key, { includeDefaultBase: false }));
		}
		this.addInputProvider(5, new GamepadProvider(4));
		if (config?.p6?.key) {
			this.addInputProvider(6, new KeyboardProvider(config.p6.key, { includeDefaultBase: false }));
		}
		this.addInputProvider(6, new GamepadProvider(5));
		if (config?.p7?.key) {
			this.addInputProvider(7, new KeyboardProvider(config.p7.key, { includeDefaultBase: false }));
		}
		this.addInputProvider(7, new GamepadProvider(6));
		if (config?.p8?.key) {
			this.addInputProvider(8, new KeyboardProvider(config.p8.key, { includeDefaultBase: false }));
		}
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

	private mergeInputs(a: Partial<InputGamepad>, b: Partial<InputGamepad>): Partial<InputGamepad> {
		return {
			buttons: {
				A: mergeButtonState(a.buttons?.A, b.buttons?.A),
				B: mergeButtonState(a.buttons?.B, b.buttons?.B),
				X: mergeButtonState(a.buttons?.X, b.buttons?.X),
				Y: mergeButtonState(a.buttons?.Y, b.buttons?.Y),
				Start: mergeButtonState(a.buttons?.Start, b.buttons?.Start),
				Select: mergeButtonState(a.buttons?.Select, b.buttons?.Select),
				L: mergeButtonState(a.buttons?.L, b.buttons?.L),
				R: mergeButtonState(a.buttons?.R, b.buttons?.R),
			},
			directions: {
				Up: mergeButtonState(a.directions?.Up, b.directions?.Up),
				Down: mergeButtonState(a.directions?.Down, b.directions?.Down),
				Left: mergeButtonState(a.directions?.Left, b.directions?.Left),
				Right: mergeButtonState(a.directions?.Right, b.directions?.Right),
			},
			axes: {
				Horizontal: mergeAnalogState(a.axes?.Horizontal, b.axes?.Horizontal),
				Vertical: mergeAnalogState(a.axes?.Vertical, b.axes?.Vertical),
			},
			shoulders: {
				LTrigger: mergeButtonState(a.shoulders?.LTrigger, b.shoulders?.LTrigger),
				RTrigger: mergeButtonState(a.shoulders?.RTrigger, b.shoulders?.RTrigger),
			}
		};
	}
} 