import { InputProvider } from './input-provider';
import { ButtonState, InputGamepad, InputPlayerNumber, Inputs } from './input';
import { KeyboardProvider } from './keyboard-provider';
import { GamepadProvider } from './gamepad-provider';


export class InputManager {
	private inputMap: Map<InputPlayerNumber, InputProvider[]> = new Map();
	private currentInputs: Inputs = {} as Inputs;
	private previousInputs: Inputs = {} as Inputs;

	constructor() {
		this.addInputProvider(1, new KeyboardProvider());
		this.addInputProvider(1, new GamepadProvider(0));
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

	private mergeInputs(a: Partial<InputGamepad>, b: Partial<InputGamepad>): Partial<InputGamepad> {
		return {
			buttons: {
				A: this.mergeButtonState(a.buttons?.A, b.buttons?.A),
				B: Boolean(b.buttons?.B || a.buttons?.B),
				X: Boolean(b.buttons?.X || a.buttons?.X),
				Y: Boolean(b.buttons?.Y || a.buttons?.Y),
				Start: Boolean(b.buttons?.Start || a.buttons?.Start),
				Select: Boolean(b.buttons?.Select || a.buttons?.Select),
				L: Boolean(b.buttons?.L || a.buttons?.L),
				R: Boolean(b.buttons?.R || a.buttons?.R),
			},
			directions: {
				Up: Boolean(b.directions?.Up || a.directions?.Up),
				Down: Boolean(b.directions?.Down || a.directions?.Down),
				Left: Boolean(b.directions?.Left || a.directions?.Left),
				Right: Boolean(b.directions?.Right || a.directions?.Right),
			},
			axes: {
				Horizontal: b.axes?.Horizontal || a.axes?.Horizontal || 0,
				Vertical: b.axes?.Vertical || a.axes?.Vertical || 0,
			},
			shoulders: {
				LTrigger: Math.max(a.shoulders?.LTrigger || 0, b.shoulders?.LTrigger || 0),
				RTrigger: Math.max(a.shoulders?.RTrigger || 0, b.shoulders?.RTrigger || 0),
			}
		};
	}

	// 	constructor() {
	// 		let interval = setInterval(() => {
	// 			if (!this.hasSupport) clearInterval(interval);
	// 			if (this.connections.size > this.lastConnection) this.scanGamePads();
	// 		}, 200);
	// 		window.addEventListener('gamepadconnected', ({ gamepad }) => this.connections.set(gamepad.index, gamepad.connected));
	// 		window.addEventListener('gamepaddisconnected', ({ gamepad }) => this.connections.delete(gamepad.index));
	// 		window.addEventListener('keydown', ({ key }) => this.keyboardInput.set(key, true));
	// 		window.addEventListener('keyup', ({ key }) => this.keyboardInput.set(key, false));
	// 	}

	// 	scanGamePads() {
	// 		const browserGamePadSupport = Boolean(navigator.getGamepads) ?? false;
	// 		if (!browserGamePadSupport) {
	// 			console.warn('This browser doesn\'t support gamepads');
	// 			this.hasSupport = false;
	// 			return;
	// 		}
	// 		this.lastConnection = navigator.getGamepads().length;
	// 	}
	// 	getDebugInfo(): string {
	// 		const gamepads = navigator.getGamepads();
	// 		let info = '';
	// 		for (let i = 0; i < gamepads.length; i++) {
	// 			const gamepad = gamepads[i];
	// 			if (!gamepad) continue;
	// 			info += `\nGamepad ${i}: ${gamepad.id} connected: ${gamepad.connected}\n`;
	// 			info += `\nAxes: ${gamepad.axes}\n`;
	// 			info += `\nButtons: ${gamepad.buttons}\n`;
	// 		}
	// 		return info;
	// 	}
	// }
} 