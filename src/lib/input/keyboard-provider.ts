import { InputProvider } from './input-provider';
import { AnalogState, ButtonState, InputGamepad } from './input';

export class KeyboardProvider implements InputProvider {
	private keyStates = new Map<string, boolean>();
	private keyButtonStates = new Map<string, ButtonState>();
	private mapping: Record<string, string[]> | null = null;
	private includeDefaultBase: boolean = true;

	constructor(mapping?: Record<string, string[]>, options?: { includeDefaultBase?: boolean }) {
		this.mapping = mapping ?? null;
		this.includeDefaultBase = options?.includeDefaultBase ?? true;
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

	private mergeButtonState(a: ButtonState | undefined, b: ButtonState | undefined): ButtonState {
		return {
			pressed: a?.pressed || b?.pressed || false,
			released: a?.released || b?.released || false,
			held: (a?.held || 0) + (b?.held || 0),
		};
	}

	private applyCustomMapping(input: Partial<InputGamepad>, delta: number): Partial<InputGamepad> {
		if (!this.mapping) return input;
		for (const [key, targets] of Object.entries(this.mapping)) {
			if (!targets || targets.length === 0) continue;
			const state = this.handleButtonState(key, delta);
			for (const target of targets) {
				const [rawCategory, rawName] = (target || '').split('.');
				if (!rawCategory || !rawName) continue;
				const category = rawCategory.toLowerCase();
				const nameKey = rawName.toLowerCase();
				if (category === 'buttons') {
					const map: Record<string, keyof InputGamepad['buttons']> = {
						'a': 'A', 'b': 'B', 'x': 'X', 'y': 'Y',
						'start': 'Start', 'select': 'Select',
						'l': 'L', 'r': 'R',
					};
					const prop = map[nameKey];
					if (!prop) continue;
					const nextButtons = (input.buttons || {} as any);
					nextButtons[prop] = this.mergeButtonState(nextButtons[prop], state);
					input.buttons = nextButtons;
					continue;
				}
				if (category === 'directions') {
					const map: Record<string, keyof InputGamepad['directions']> = {
						'up': 'Up', 'down': 'Down', 'left': 'Left', 'right': 'Right',
					};
					const prop = map[nameKey];
					if (!prop) continue;
					const nextDirections = (input.directions || {} as any);
					nextDirections[prop] = this.mergeButtonState(nextDirections[prop], state);
					input.directions = nextDirections;
					continue;
				}
				if (category === 'shoulders') {
					const map: Record<string, keyof InputGamepad['shoulders']> = {
						'ltrigger': 'LTrigger', 'rtrigger': 'RTrigger',
					};
					const prop = map[nameKey];
					if (!prop) continue;
					const nextShoulders = (input.shoulders || {} as any);
					nextShoulders[prop] = this.mergeButtonState(nextShoulders[prop], state);
					input.shoulders = nextShoulders;
					continue;
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