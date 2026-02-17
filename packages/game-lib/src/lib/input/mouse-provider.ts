import { InputProvider, AnalogState, ButtonState, InputGamepad } from './input';
import { compileMapping, mergeAnalogState, mergeButtonState, PropertyPath } from './input-state';
import { MouseConfig } from '../game/game-interfaces';

const DEFAULT_SENSITIVITY = 0.002;

/**
 * Maps mouse movement and button input to the InputGamepad interface.
 *
 * Default mapping:
 *  - Mouse movement X/Y -> axes.SecondaryHorizontal / axes.SecondaryVertical
 *  - Left click   -> shoulders.LTrigger
 *  - Right click  -> shoulders.RTrigger
 *
 * Supports optional pointer lock for FPS-style camera control.
 */
export class MouseProvider implements InputProvider {
	private buttonStates = new Map<number, ButtonState>();
	private analogStates = new Map<string, AnalogState>();
	private compiledMapping: Map<string, PropertyPath[]>;

	private movementX = 0;
	private movementY = 0;

	private pointerX = 0;
	private pointerY = 0;

	private mouseButtonDown = new Set<number>();

	private sensitivity: number;
	private usePointerLock: boolean;
	private isLocked = false;

	private targetElement: HTMLElement;

	// --- bound event handlers ---

	private onMouseMove = (e: MouseEvent) => {
		this.movementX += e.movementX;
		this.movementY += e.movementY;
		this.pointerX = e.clientX / window.innerWidth;
		this.pointerY = e.clientY / window.innerHeight;
	};

	private onMouseDown = (e: MouseEvent) => {
		this.mouseButtonDown.add(e.button);
		if (this.usePointerLock && !this.isLocked) {
			this.targetElement.requestPointerLock();
		}
	};

	private onMouseUp = (e: MouseEvent) => {
		this.mouseButtonDown.delete(e.button);
	};

	private onContextMenu = (e: MouseEvent) => {
		e.preventDefault();
	};

	private onPointerLockChange = () => {
		this.isLocked = document.pointerLockElement === this.targetElement;
	};

	constructor(config?: MouseConfig, targetElement?: HTMLElement) {
		this.sensitivity = config?.sensitivity ?? DEFAULT_SENSITIVITY;
		this.usePointerLock = config?.pointerLock ?? false;
		this.compiledMapping = compileMapping(config?.mapping ?? null);

		this.targetElement = targetElement ?? document.body;

		this.targetElement.addEventListener('mousemove', this.onMouseMove);
		this.targetElement.addEventListener('mousedown', this.onMouseDown);
		this.targetElement.addEventListener('mouseup', this.onMouseUp);
		this.targetElement.addEventListener('contextmenu', this.onContextMenu);

		if (this.usePointerLock) {
			document.addEventListener('pointerlockchange', this.onPointerLockChange);
		}
	}

	/** Removes all event listeners and cleans up state. */
	dispose(): void {
		this.targetElement.removeEventListener('mousemove', this.onMouseMove);
		this.targetElement.removeEventListener('mousedown', this.onMouseDown);
		this.targetElement.removeEventListener('mouseup', this.onMouseUp);
		this.targetElement.removeEventListener('contextmenu', this.onContextMenu);
		document.removeEventListener('pointerlockchange', this.onPointerLockChange);

		if (this.isLocked) {
			document.exitPointerLock();
		}

		this.buttonStates.clear();
		this.analogStates.clear();
		this.mouseButtonDown.clear();
		this.movementX = 0;
		this.movementY = 0;
	}

	// --- state helpers ---

	private handleMouseButton(button: number, delta: number): ButtonState {
		let state = this.buttonStates.get(button);
		if (!state) {
			state = { pressed: false, released: false, held: 0 };
			this.buttonStates.set(button, state);
		}

		const isPressed = this.mouseButtonDown.has(button);
		state.pressed = isPressed && state.held === 0;
		state.released = !isPressed && state.held > 0;
		state.held = isPressed ? state.held + delta : 0;

		return state;
	}

	private handleMovementAxis(axis: 'x' | 'y', delta: number): AnalogState {
		let state = this.analogStates.get(axis);
		if (!state) {
			state = { value: 0, held: 0 };
			this.analogStates.set(axis, state);
		}

		const raw = axis === 'x' ? this.movementX : this.movementY;
		state.value = Math.max(-1, Math.min(1, raw * this.sensitivity));
		state.held = state.value !== 0 ? state.held + delta : 0;

		return state;
	}

	// --- custom mapping ---

	/**
	 * Applies custom MouseMapping on top of the base input.
	 * Mouse action keys: 'leftButton', 'rightButton', 'middleButton', 'moveX', 'moveY'.
	 */
	private applyCustomMapping(input: Partial<InputGamepad>, delta: number): Partial<InputGamepad> {
		if (this.compiledMapping.size === 0) return input;

		const axisValues = new Map<string, number>();

		const mouseActions: Record<string, () => ButtonState | null> = {
			'leftbutton': () => this.handleMouseButton(0, delta),
			'rightbutton': () => this.handleMouseButton(2, delta),
			'middlebutton': () => this.handleMouseButton(1, delta),
		};

		for (const [key, paths] of this.compiledMapping.entries()) {
			const lowerKey = key.toLowerCase();

			for (const path of paths) {
				if (path.category === 'axes') {
					if (!axisValues.has(path.property)) {
						axisValues.set(path.property, 0);
					}
					if (lowerKey === 'movex') {
						axisValues.set(
							path.property,
							axisValues.get(path.property)! + Math.max(-1, Math.min(1, this.movementX * this.sensitivity)) * path.axisDirection!
						);
					} else if (lowerKey === 'movey') {
						axisValues.set(
							path.property,
							axisValues.get(path.property)! + Math.max(-1, Math.min(1, this.movementY * this.sensitivity)) * path.axisDirection!
						);
				} else if (lowerKey in mouseActions && this.mouseButtonDown.has(this.buttonIndexForAction(lowerKey))) {
					axisValues.set(path.property, axisValues.get(path.property)! + path.axisDirection!);
					}
				} else {
					const buttonAction = mouseActions[lowerKey];
					if (buttonAction) {
						const buttonState = buttonAction();
						if (buttonState) {
							const group = ((input as any)[path.category] ??= {});
							group[path.property] = mergeButtonState(group[path.property], buttonState);
						}
					}
				}
			}
		}

		if (axisValues.size > 0) {
			if (!input.axes) input.axes = {} as any;
			for (const [axisName, value] of axisValues.entries()) {
				const stateKey = `custom:${axisName}`;
				let state = this.analogStates.get(stateKey);
				if (!state) {
					state = { value: 0, held: 0 };
					this.analogStates.set(stateKey, state);
				}
				state.value = Math.max(-1, Math.min(1, value));
				state.held = value !== 0 ? state.held + delta : 0;
				(input.axes as any)[axisName] = mergeAnalogState((input.axes as any)[axisName], state);
			}
		}

		return input;
	}

	private buttonIndexForAction(action: string): number {
		switch (action) {
			case 'leftbutton': return 0;
			case 'middlebutton': return 1;
			case 'rightbutton': return 2;
			default: return -1;
		}
	}

	// --- InputProvider interface ---

	getInput(delta: number): Partial<InputGamepad> {
		const input: Partial<InputGamepad> = {
			axes: {
				Horizontal: { value: 0, held: 0 },
				Vertical: { value: 0, held: 0 },
				SecondaryHorizontal: this.handleMovementAxis('x', delta),
				SecondaryVertical: this.handleMovementAxis('y', delta),
			},
			shoulders: {
				LTrigger: this.handleMouseButton(0, delta),
				RTrigger: this.handleMouseButton(2, delta),
			},
			pointer: {
				x: this.pointerX,
				y: this.pointerY,
			},
		};

		// Reset accumulated movement for this frame
		this.movementX = 0;
		this.movementY = 0;

		return this.applyCustomMapping(input, delta);
	}

	getName(): string {
		return 'mouse';
	}

	isConnected(): boolean {
		return true;
	}
}
