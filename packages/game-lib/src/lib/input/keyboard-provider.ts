import { InputProvider, AnalogState, ButtonState, InputGamepad } from './input';
import { compileMapping, mergeAnalogState, mergeButtonState, PropertyPath } from './input-state';

export class KeyboardProvider implements InputProvider {
	private keyStates = new Map<string, boolean>();
	private keyButtonStates = new Map<string, ButtonState>();
	private analogStates = new Map<string, AnalogState>();
	private compiledMapping: Map<string, PropertyPath[]>;
	private includeDefaultBase: boolean = true;

	private onKeyDown = ({ key }: KeyboardEvent) => this.keyStates.set(key, true);
	private onKeyUp = ({ key }: KeyboardEvent) => this.keyStates.set(key, false);

	constructor(mapping?: Record<string, string[]>, options?: { includeDefaultBase?: boolean }) {
		this.includeDefaultBase = options?.includeDefaultBase ?? true;
		this.compiledMapping = compileMapping(mapping ?? null);

		window.addEventListener('keydown', this.onKeyDown);
		window.addEventListener('keyup', this.onKeyUp);
	}

	/** Removes event listeners and cleans up state. */
	dispose(): void {
		window.removeEventListener('keydown', this.onKeyDown);
		window.removeEventListener('keyup', this.onKeyUp);
		this.keyStates.clear();
		this.keyButtonStates.clear();
		this.analogStates.clear();
	}

	private isKeyPressed(key: string): boolean {
		return this.keyStates.get(key) || false;
	}

	private handleButtonState(key: string, delta: number): ButtonState {
		let state = this.keyButtonStates.get(key);
		if (!state) {
			state = { pressed: false, released: false, held: 0 };
			this.keyButtonStates.set(key, state);
		}

		const isPressed = this.isKeyPressed(key);
		state.pressed = isPressed && state.held === 0;
		state.released = !isPressed && state.held > 0;
		state.held = isPressed ? state.held + delta : 0;

		return state;
	}

	private handleAnalogState(negativeKey: string, positiveKey: string, delta: number): AnalogState {
		const stateKey = `${negativeKey}:${positiveKey}`;
		let state = this.analogStates.get(stateKey);
		if (!state) {
			state = { value: 0, held: 0 };
			this.analogStates.set(stateKey, state);
		}

		state.value = this.getAxisValue(negativeKey, positiveKey);
		state.held = state.value !== 0 ? state.held + delta : 0;

		return state;
	}

	/**
	 * Applies custom key mappings using pre-computed paths.
	 * Handles buttons/directions/shoulders via ButtonState merging,
	 * and axes via accumulated axis contributions with held tracking.
	 */
	private applyCustomMapping(input: Partial<InputGamepad>, delta: number): Partial<InputGamepad> {
		if (this.compiledMapping.size === 0) return input;

		// Collect axis contributions across all keys (initialized to 0)
		const axisValues = new Map<string, number>();

		for (const [key, paths] of this.compiledMapping.entries()) {
			let buttonState: ButtonState | null = null;

			for (const path of paths) {
				if (path.category === 'axes') {
					if (!axisValues.has(path.property)) {
						axisValues.set(path.property, 0);
					}
					if (this.isKeyPressed(key)) {
						axisValues.set(path.property, axisValues.get(path.property)! + path.axisDirection!);
					}
				} else {
					// Lazy-compute button state only when needed
					if (!buttonState) {
						buttonState = this.handleButtonState(key, delta);
					}
					const group = ((input as any)[path.category] ??= {});
					group[path.property] = mergeButtonState(group[path.property], buttonState);
				}
			}
		}

		// Apply accumulated axis values with held-time tracking
		if (axisValues.size > 0) {
			if (!input.axes) input.axes = {} as any;
			for (const [axisName, value] of axisValues.entries()) {
				const stateKey = `custom:${axisName}`;
				let state = this.analogStates.get(stateKey);
				if (!state) {
					state = { value: 0, held: 0 };
					this.analogStates.set(stateKey, state);
				}
				state.value = value;
				state.held = value !== 0 ? state.held + delta : 0;
				(input.axes as any)[axisName] = mergeAnalogState((input.axes as any)[axisName], state);
			}
		}

		return input;
	}

	getInput(delta: number): Partial<InputGamepad> {
		const base: Partial<InputGamepad> = {};
		if (this.includeDefaultBase) {
			base.buttons = {
				A: this.handleButtonState('z', delta),
				B: this.handleButtonState('x', delta),
				X: this.handleButtonState('a', delta),
				Y: this.handleButtonState('s', delta),
				Start: this.handleButtonState(' ', delta),
				Select: this.handleButtonState('Enter', delta),
				L: this.handleButtonState('q', delta),
				R: this.handleButtonState('e', delta),
			};
			base.directions = {
				Up: this.handleButtonState('ArrowUp', delta),
				Down: this.handleButtonState('ArrowDown', delta),
				Left: this.handleButtonState('ArrowLeft', delta),
				Right: this.handleButtonState('ArrowRight', delta),
			};
			base.shoulders = {
				LTrigger: this.handleButtonState('Q', delta),
				RTrigger: this.handleButtonState('E', delta),
			};
		}

		return this.applyCustomMapping(base, delta);
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
