import { InputProvider, AnalogState, ButtonState, InputGamepad } from './input';
import { compileMapping, mergeAnalogState, mergeButtonState, PropertyPath } from './input-state';
import { MouseConfig } from '../game/game-interfaces';
import { debugState } from '../debug/debug-state';
import { subscribe } from 'valtio/vanilla';

const DEFAULT_SENSITIVITY = 0.002;

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function resolveGameCanvas(root: HTMLElement): HTMLCanvasElement | null {
	if (root instanceof HTMLCanvasElement) {
		return root;
	}
	const direct = root.querySelector('canvas');
	if (direct instanceof HTMLCanvasElement) {
		return direct;
	}
	for (const el of root.querySelectorAll('*')) {
		const shadow = (el as HTMLElement).shadowRoot;
		if (!shadow) continue;
		const nested = shadow.querySelector('canvas');
		if (nested instanceof HTMLCanvasElement) {
			return nested;
		}
	}
	return null;
}

/**
 * Maps mouse movement and button input to the InputGamepad interface.
 *
 * Default mapping:
 *  - Mouse movement X/Y -> axes.SecondaryHorizontal / axes.SecondaryVertical
 *  - Left click   -> shoulders.LTrigger
 *  - Right click  -> shoulders.RTrigger
 *
 * Supports optional pointer lock for FPS-style camera control, or
 * screen-center look (free cursor mapped from canvas center).
 */
export class MouseProvider implements InputProvider {
	private buttonStates = new Map<number, ButtonState>();
	private analogStates = new Map<string, AnalogState>();
	private compiledMapping: Map<string, PropertyPath[]>;

	private movementX = 0;
	private movementY = 0;

	private pointerX = 0.5;
	private pointerY = 0.5;
	private pointerCenterX = 0;
	private pointerCenterY = 0;

	private mouseButtonDown = new Set<number>();

	private sensitivity: number;
	private usePointerLock: boolean;
	private lookMode: 'delta' | 'screenCenter';
	private isLocked = false;

	private targetElement: HTMLElement;
	private debugUnsubscribe: (() => void) | null = null;

	private updatePointerPosition(clientX: number, clientY: number): void {
		this.pointerX = clientX / window.innerWidth;
		this.pointerY = clientY / window.innerHeight;

		const canvas = resolveGameCanvas(this.targetElement);
		if (canvas) {
			const rect = canvas.getBoundingClientRect();
			if (rect.width > 0 && rect.height > 0) {
				const cx = rect.left + rect.width / 2;
				const cy = rect.top + rect.height / 2;
				this.pointerCenterX = clamp((clientX - cx) / (rect.width / 2), -1, 1);
				this.pointerCenterY = clamp((clientY - cy) / (rect.height / 2), -1, 1);
				return;
			}
		}

		this.pointerCenterX = clamp((this.pointerX - 0.5) * 2, -1, 1);
		this.pointerCenterY = clamp((this.pointerY - 0.5) * 2, -1, 1);
	}

	// --- bound event handlers ---

	private onMouseMove = (e: MouseEvent) => {
		this.updatePointerPosition(e.clientX, e.clientY);

		if (debugState.enabled || this.lookMode === 'screenCenter') {
			return;
		}

		this.movementX += e.movementX;
		this.movementY += e.movementY;
	};

	private onMouseDown = (e: MouseEvent) => {
		const target = e.target as Element | null;
		const isGameCanvas = target instanceof HTMLCanvasElement
			&& this.targetElement.contains(target);

		if (!isGameCanvas) return;

		this.mouseButtonDown.add(e.button);
		if (this.usePointerLock && !this.isLocked && !debugState.enabled) {
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
		this.lookMode = config?.lookMode ?? 'delta';
		this.usePointerLock = config?.pointerLock ?? false;
		this.compiledMapping = compileMapping(config?.mapping ?? null);

		this.targetElement = targetElement ?? document.body;

		// Listen for movement on `window` so deltas are still received during
		// pointer lock (and even if the cursor leaves the target element). This
		// mirrors `KeyboardProvider`'s window-based listener pattern.
		window.addEventListener('mousemove', this.onMouseMove);
		this.targetElement.addEventListener('mousedown', this.onMouseDown);
		this.targetElement.addEventListener('mouseup', this.onMouseUp);
		this.targetElement.addEventListener('contextmenu', this.onContextMenu);

		if (this.usePointerLock) {
			document.addEventListener('pointerlockchange', this.onPointerLockChange);
			this.debugUnsubscribe = subscribe(debugState, () => {
				if (debugState.enabled && document.pointerLockElement === this.targetElement) {
					document.exitPointerLock();
				}
			});
		}
	}

	/** Removes all event listeners and cleans up state. */
	dispose(): void {
		window.removeEventListener('mousemove', this.onMouseMove);
		this.targetElement.removeEventListener('mousedown', this.onMouseDown);
		this.targetElement.removeEventListener('mouseup', this.onMouseUp);
		this.targetElement.removeEventListener('contextmenu', this.onContextMenu);
		document.removeEventListener('pointerlockchange', this.onPointerLockChange);
		this.debugUnsubscribe?.();
		this.debugUnsubscribe = null;

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
		if (debugState.enabled) {
			this.movementX = 0;
			this.movementY = 0;
		}

		const zeroAxis: AnalogState = { value: 0, held: 0 };
		const useDeltaLook = this.lookMode === 'delta';

		const input: Partial<InputGamepad> = {
			axes: {
				Horizontal: zeroAxis,
				Vertical: zeroAxis,
				SecondaryHorizontal: useDeltaLook
					? this.handleMovementAxis('x', delta)
					: zeroAxis,
				SecondaryVertical: useDeltaLook
					? this.handleMovementAxis('y', delta)
					: zeroAxis,
			},
			shoulders: {
				LTrigger: this.handleMouseButton(0, delta),
				RTrigger: this.handleMouseButton(2, delta),
			},
			pointer: {
				x: this.pointerX,
				y: this.pointerY,
				centerX: this.pointerCenterX,
				centerY: this.pointerCenterY,
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
