import { InputProvider, InputGamepad, InputPlayerNumber, Inputs } from './input';
import { KeyboardProvider } from './keyboard-provider';
import { GamepadProvider } from './gamepad-provider';
import { MouseProvider } from './mouse-provider';
import { GameInputConfig, GameInputPlayerConfig } from '../game/game-interfaces';
import { mergeButtonState, mergeAnalogState } from './input-state';

interface PlayerEntry {
	player: InputPlayerNumber;
	config?: GameInputPlayerConfig;
	gamepadIndex: number;
	isP1: boolean;
}

export class InputManager {
	private inputMap: Map<InputPlayerNumber, InputProvider[]> = new Map();
	private currentInputs: Inputs = {} as Inputs;
	private previousInputs: Inputs = {} as Inputs;

	constructor(config?: GameInputConfig) {
		const players = this.buildPlayerEntries(config);

		for (const { player, config: playerConfig, gamepadIndex, isP1 } of players) {
			if (playerConfig?.key) {
				const includeDefaultBase = playerConfig.includeDefaults ?? isP1;
				this.addInputProvider(player, new KeyboardProvider(playerConfig.key, { includeDefaultBase }));
			} else if (isP1) {
				this.addInputProvider(player, new KeyboardProvider());
			}
			if (playerConfig?.mouse) {
				this.addInputProvider(player, new MouseProvider(playerConfig.mouse));
			}
			this.addInputProvider(player, new GamepadProvider(gamepadIndex));
		}
	}

	/**
	 * Reconfigure keyboard and mouse providers at runtime without affecting gamepad providers.
	 * Disposes existing keyboard/mouse providers and creates new ones from the given config.
	 */
	configure(config: GameInputConfig): void {
		const players = this.buildPlayerEntries(config);

		for (const { player, config: playerConfig, isP1 } of players) {
			const providers = this.inputMap.get(player) ?? [];

			// Dispose and remove keyboard + mouse providers
			const remaining = providers.filter(p => {
				if (p instanceof KeyboardProvider || p instanceof MouseProvider) {
					p.dispose();
					return false;
				}
				return true;
			});

			// Create new keyboard provider and prepend before gamepad providers
			if (playerConfig?.key) {
				const includeDefaultBase = playerConfig.includeDefaults ?? isP1;
				remaining.unshift(new KeyboardProvider(playerConfig.key, { includeDefaultBase }));
			} else if (isP1) {
				remaining.unshift(new KeyboardProvider());
			}

			// Create new mouse provider
			if (playerConfig?.mouse) {
				remaining.unshift(new MouseProvider(playerConfig.mouse));
			}

			this.inputMap.set(player, remaining);
		}
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

	private buildPlayerEntries(config?: GameInputConfig): PlayerEntry[] {
		return [
			{ player: 1, config: config?.p1, gamepadIndex: 0, isP1: true },
			{ player: 2, config: config?.p2, gamepadIndex: 1, isP1: false },
			{ player: 3, config: config?.p3, gamepadIndex: 2, isP1: false },
			{ player: 4, config: config?.p4, gamepadIndex: 3, isP1: false },
			{ player: 5, config: config?.p5, gamepadIndex: 4, isP1: false },
			{ player: 6, config: config?.p6, gamepadIndex: 5, isP1: false },
			{ player: 7, config: config?.p7, gamepadIndex: 6, isP1: false },
			{ player: 8, config: config?.p8, gamepadIndex: 7, isP1: false },
		];
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
				SecondaryHorizontal: mergeAnalogState(a.axes?.SecondaryHorizontal, b.axes?.SecondaryHorizontal),
				SecondaryVertical: mergeAnalogState(a.axes?.SecondaryVertical, b.axes?.SecondaryVertical),
			},
			shoulders: {
				LTrigger: mergeButtonState(a.shoulders?.LTrigger, b.shoulders?.LTrigger),
				RTrigger: mergeButtonState(a.shoulders?.RTrigger, b.shoulders?.RTrigger),
			},
			pointer: b.pointer ?? a.pointer,
		};
	}
}
