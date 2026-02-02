import { InputProvider } from './input-provider';
import { AnalogState, ButtonState, InputGamepad } from './input';
import { compileMapping, createInputGamepadState, mergeButtonState } from './input-state';

export class KeyboardProvider implements InputProvider {
	private keyStates = new Map<string, boolean>();
	private keyButtonStates = new Map<string, ButtonState>();
	private mapping: Record<string, string[]> | null = null;
	private compiledMapping: Map<string, Array<{ category: string; property: string }>>;
	private includeDefaultBase: boolean = true;

	constructor(mapping?: Record<string, string[]>, options?: { includeDefaultBase?: boolean }) {
		console.log('[KeyboardProvider] Constructor called with mapping:', mapping, 'options:', options);
		this.mapping = mapping ?? null;
		this.includeDefaultBase = options?.includeDefaultBase ?? true;
		
		// Pre-compute the mapping at construction time
		console.log('[KeyboardProvider] About to call compileMapping with:', this.mapping);
		this.compiledMapping = compileMapping(this.mapping);
		console.log('[KeyboardProvider] compileMapping returned, size:', this.compiledMapping.size);
		
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

	/**
	 * Optimized custom mapping application using pre-computed paths.
	 * No string parsing happens here - all lookups are O(1).
	 */
	private applyCustomMapping(input: Partial<InputGamepad>, delta: number): Partial<InputGamepad> {
		if (this.compiledMapping.size === 0) return input;

		for (const [key, paths] of this.compiledMapping.entries()) {
			const state = this.handleButtonState(key, delta);
			
			for (const path of paths) {
				const { category, property } = path;
				
				if (category === 'buttons') {
					if (!input.buttons) input.buttons = {} as any;
					const nextButtons = input.buttons as any;
					nextButtons[property] = mergeButtonState(nextButtons[property], state);
				} else if (category === 'directions') {
					if (!input.directions) input.directions = {} as any;
					const nextDirections = input.directions as any;
					nextDirections[property] = mergeButtonState(nextDirections[property], state);
				} else if (category === 'shoulders') {
					if (!input.shoulders) input.shoulders = {} as any;
					const nextShoulders = input.shoulders as any;
					nextShoulders[property] = mergeButtonState(nextShoulders[property], state);
				}
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
			base.axes = {
				Horizontal: this.handleAnalogState('ArrowLeft', 'ArrowRight', delta),
				Vertical: this.handleAnalogState('ArrowUp', 'ArrowDown', delta),
			};
			base.shoulders = {
				LTrigger: this.handleButtonState('Q', delta),
				RTrigger: this.handleButtonState('E', delta),
			};
		}
		const result = this.applyCustomMapping(base, delta);
		
		// DEBUG: Log when keys are pressed
		// if (this.isKeyPressed('w') || this.isKeyPressed('s') || this.isKeyPressed('ArrowUp') || this.isKeyPressed('ArrowDown')) {
		// 	console.log('[KeyboardProvider] includeDefaultBase:', this.includeDefaultBase);
		// 	console.log('[KeyboardProvider] compiledMapping size:', this.compiledMapping.size);
		// 	console.log('[KeyboardProvider] result.directions:', result.directions);
		// }
		
		return result;
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