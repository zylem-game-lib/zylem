import { InputGamepad, ButtonState, AnalogState, InputPlayerNumber } from './input';

/**
 * Represents a direct property path for efficient state updates.
 * Avoids string parsing on every frame.
 */
interface PropertyPath {
	category: 'buttons' | 'directions' | 'shoulders' | 'axes';
	property: string;
}

/**
 * Pre-computed mapping from keyboard key to input properties.
 * Built once at initialization to avoid per-frame string parsing.
 */
type CompiledMapping = Map<string, PropertyPath[]>;

/**
 * Creates a default ButtonState
 */
function createButtonState(): ButtonState {
	return { pressed: false, released: false, held: 0 };
}

/**
 * Creates a default AnalogState
 */
function createAnalogState(): AnalogState {
	return { value: 0, held: 0 };
}

/**
 * Creates a fresh InputGamepad state object
 */
export function createInputGamepadState(playerNumber: InputPlayerNumber): InputGamepad {
	return {
		playerNumber,
		buttons: {
			A: createButtonState(),
			B: createButtonState(),
			X: createButtonState(),
			Y: createButtonState(),
			Start: createButtonState(),
			Select: createButtonState(),
			L: createButtonState(),
			R: createButtonState(),
		},
		directions: {
			Up: createButtonState(),
			Down: createButtonState(),
			Left: createButtonState(),
			Right: createButtonState(),
		},
		shoulders: {
			LTrigger: createButtonState(),
			RTrigger: createButtonState(),
		},
		axes: {
			Horizontal: createAnalogState(),
			Vertical: createAnalogState(),
		},
	};
}

/**
 * Compiles a keyboard mapping into efficient property paths.
 * This is done once at initialization instead of every frame.
 * 
 * @param mapping - Raw mapping from config (e.g., { 'w': ['directions.Up'] })
 * @returns Compiled mapping for O(1) lookups
 */
export function compileMapping(mapping: Record<string, string[]> | null): CompiledMapping {
	const compiled = new Map<string, PropertyPath[]>();
	
	if (!mapping) return compiled;

	for (const [key, targets] of Object.entries(mapping)) {
		if (!targets || targets.length === 0) continue;
		
		const paths: PropertyPath[] = [];
		
		for (const target of targets) {
			const [rawCategory, rawName] = (target || '').split('.');
			if (!rawCategory || !rawName) continue;
			
			const category = rawCategory.toLowerCase();
			const nameKey = rawName.toLowerCase();
			
			// Map category and property name
			if (category === 'buttons') {
				const propertyMap: Record<string, string> = {
					'a': 'A', 'b': 'B', 'x': 'X', 'y': 'Y',
					'start': 'Start', 'select': 'Select',
					'l': 'L', 'r': 'R',
				};
				const prop = propertyMap[nameKey];
				if (prop) {
					paths.push({ category: 'buttons', property: prop });
				}
			} else if (category === 'directions') {
				const propertyMap: Record<string, string> = {
					'up': 'Up', 'down': 'Down', 'left': 'Left', 'right': 'Right',
				};
				const prop = propertyMap[nameKey];
				if (prop) {
					paths.push({ category: 'directions', property: prop });
				}
			} else if (category === 'shoulders') {
				const propertyMap: Record<string, string> = {
					'ltrigger': 'LTrigger', 'rtrigger': 'RTrigger',
				};
				const prop = propertyMap[nameKey];
				if (prop) {
					paths.push({ category: 'shoulders', property: prop });
				}
			}
		}
		
		if (paths.length > 0) {
			compiled.set(key, paths);
		}
	}
	
	return compiled;
}

/**
 * Merges two ButtonStates efficiently
 */
export function mergeButtonState(a: ButtonState | undefined, b: ButtonState | undefined): ButtonState {
	if (!a && !b) return createButtonState();
	if (!a) return { ...b! };
	if (!b) return { ...a };
	
	return {
		pressed: a.pressed || b.pressed,
		released: a.released || b.released,
		held: a.held + b.held,
	};
}

/**
 * Merges two AnalogStates efficiently
 */
export function mergeAnalogState(a: AnalogState | undefined, b: AnalogState | undefined): AnalogState {
	if (!a && !b) return createAnalogState();
	if (!a) return { ...b! };
	if (!b) return { ...a };
	
	return {
		value: a.value + b.value,
		held: a.held + b.held,
	};
}

/**
 * Merges two InputGamepad objects efficiently.
 * Reuses the target object structure to minimize allocations.
 */
export function mergeInputGamepads(target: InputGamepad, source: Partial<InputGamepad>): void {
	// Merge buttons
	if (source.buttons) {
		target.buttons.A = mergeButtonState(target.buttons.A, source.buttons.A);
		target.buttons.B = mergeButtonState(target.buttons.B, source.buttons.B);
		target.buttons.X = mergeButtonState(target.buttons.X, source.buttons.X);
		target.buttons.Y = mergeButtonState(target.buttons.Y, source.buttons.Y);
		target.buttons.Start = mergeButtonState(target.buttons.Start, source.buttons.Start);
		target.buttons.Select = mergeButtonState(target.buttons.Select, source.buttons.Select);
		target.buttons.L = mergeButtonState(target.buttons.L, source.buttons.L);
		target.buttons.R = mergeButtonState(target.buttons.R, source.buttons.R);
	}
	
	// Merge directions
	if (source.directions) {
		target.directions.Up = mergeButtonState(target.directions.Up, source.directions.Up);
		target.directions.Down = mergeButtonState(target.directions.Down, source.directions.Down);
		target.directions.Left = mergeButtonState(target.directions.Left, source.directions.Left);
		target.directions.Right = mergeButtonState(target.directions.Right, source.directions.Right);
	}
	
	// Merge shoulders
	if (source.shoulders) {
		target.shoulders.LTrigger = mergeButtonState(target.shoulders.LTrigger, source.shoulders.LTrigger);
		target.shoulders.RTrigger = mergeButtonState(target.shoulders.RTrigger, source.shoulders.RTrigger);
	}
	
	// Merge axes
	if (source.axes) {
		target.axes.Horizontal = mergeAnalogState(target.axes.Horizontal, source.axes.Horizontal);
		target.axes.Vertical = mergeAnalogState(target.axes.Vertical, source.axes.Vertical);
	}
}
