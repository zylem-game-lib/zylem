import { Color, Vector3 } from 'three';
import { proxy, subscribe } from 'valtio/vanilla';
import { BaseEntityInterface, GameEntityInterface } from '../types/entity-types';
import { StageStateInterface } from '../types/stage-types';
import { getByPath, setByPath } from '../core/utility/path-utils';
import { ZylemBlueColor } from '../core/utility/vector';

/**
 * Initial stage state with default values.
 * Exported for use in ZylemStage construction.
 */
export const initialStageState = {
	backgroundColor: ZylemBlueColor,
	backgroundImage: null,
	inputs: {
		p1: ['gamepad-1', 'keyboard'],
		p2: ['gamepad-2', 'keyboard'],
	},
	gravity: new Vector3(0, 0, 0),
	variables: {},
	entities: [] as GameEntityInterface[],
};

/**
 * Stage state proxy for reactive updates.
 */
const stageState = proxy({
	backgroundColor: new Color(Color.NAMES.cornflowerblue),
	backgroundImage: null,
	inputs: {
		p1: ['gamepad-1', 'keyboard-1'],
		p2: ['gamepad-2', 'keyboard-2'],
	},
	variables: {},
	gravity: new Vector3(0, 0, 0),
	entities: [],
} as StageStateInterface);

// ============================================================
// Stage state setters (internal use)
// ============================================================

const setStageBackgroundColor = (value: Color) => {
	stageState.backgroundColor = value;
};

const setStageBackgroundImage = (value: string | null) => {
	stageState.backgroundImage = value;
};

const setEntitiesToStage = (entities: Partial<BaseEntityInterface>[]) => {
	stageState.entities = entities;
};

/** Replace the entire stage variables object (used on stage load). */
const setStageVariables = (variables: Record<string, any>) => {
	stageState.variables = { ...variables };
};

/** Reset all stage variables (used on stage unload). */
const resetStageVariables = () => {
	stageState.variables = {};
};

const stageStateToString = (state: StageStateInterface) => {
	let string = `\n`;
	for (const key in state) {
		const value = state[key as keyof StageStateInterface];
		string += `${key}:\n`;
		if (key === 'entities') {
			for (const entity of state.entities) {
				string += `  ${entity.uuid}: ${entity.name}\n`;
			}
			continue;
		}
		if (typeof value === 'object' && value !== null) {
			for (const subKey in value as Record<string, any>) {
				const subValue = value?.[subKey as keyof typeof value];
				if (subValue) {
					string += `  ${subKey}: ${subValue}\n`;
				}
			}
		} else if (typeof value === 'string') {
			string += `  ${key}: ${value}\n`;
		}
	}
	return string;
};

// ============================================================
// Object-scoped variable storage (WeakMap-based)
// ============================================================

/**
 * WeakMap to store variables keyed by object reference.
 * Variables are automatically garbage collected when the target is collected.
 */
const variableStore = new WeakMap<object, Record<string, unknown>>();

/**
 * Separate proxy store for reactivity. We need a regular Map for subscriptions
 * since WeakMap doesn't support iteration/subscriptions.
 */
const variableProxyStore = new Map<object, ReturnType<typeof proxy>>();

function getOrCreateVariableProxy(target: object): Record<string, unknown> {
	let store = variableProxyStore.get(target) as Record<string, unknown> | undefined;
	if (!store) {
		store = proxy({});
		variableProxyStore.set(target, store);
	}
	return store;
}

/**
 * Set a variable on an object by path.
 * @example setVariable(stage1, 'totalAngle', 0.5)
 * @example setVariable(entity, 'enemy.count', 10)
 */
export function setVariable(target: object, path: string, value: unknown): void {
	const store = getOrCreateVariableProxy(target);
	setByPath(store, path, value);
}

/**
 * Create/initialize a variable with a default value on a target object.
 * Only sets the value if it doesn't already exist.
 * @example createVariable(stage1, 'totalAngle', 0)
 * @example createVariable(entity, 'enemy.count', 10)
 */
export function createVariable<T>(target: object, path: string, defaultValue: T): T {
	const store = getOrCreateVariableProxy(target);
	const existing = getByPath<T>(store, path);
	if (existing === undefined) {
		setByPath(store, path, defaultValue);
		return defaultValue;
	}
	return existing;
}

/**
 * Get a variable from an object by path.
 * @example getVariable(stage1, 'totalAngle') // 0.5
 * @example getVariable<number>(entity, 'enemy.count') // 10
 */
export function getVariable<T = unknown>(target: object, path: string): T | undefined {
	const store = variableProxyStore.get(target);
	if (!store) return undefined;
	return getByPath<T>(store, path);
}

/**
 * Subscribe to changes on a variable at a specific path for a target object.
 * Returns an unsubscribe function.
 * @example const unsub = onVariableChange(stage1, 'score', (val) => console.log(val));
 */
export function onVariableChange<T = unknown>(
	target: object,
	path: string,
	callback: (value: T) => void
): () => void {
	const store = getOrCreateVariableProxy(target);
	let previous = getByPath<T>(store, path);
	return subscribe(store, () => {
		const current = getByPath<T>(store, path);
		if (current !== previous) {
			previous = current;
			callback(current as T);
		}
	});
}

/**
 * Subscribe to changes on multiple variable paths for a target object.
 * Callback fires when any of the paths change, receiving all current values.
 * Returns an unsubscribe function.
 * @example const unsub = onVariableChanges(stage1, ['count', 'total'], ([count, total]) => console.log(count, total));
 */
export function onVariableChanges<T extends unknown[] = unknown[]>(
	target: object,
	paths: string[],
	callback: (values: T) => void
): () => void {
	const store = getOrCreateVariableProxy(target);
	let previousValues = paths.map(p => getByPath(store, p));
	return subscribe(store, () => {
		const currentValues = paths.map(p => getByPath(store, p));
		const hasChange = currentValues.some((val, i) => val !== previousValues[i]);
		if (hasChange) {
			previousValues = currentValues;
			callback(currentValues as T);
		}
	});
}

/**
 * Clear all variables for a target object. Used on stage/entity dispose.
 */
export function clearVariables(target: object): void {
	variableProxyStore.delete(target);
}

// ============================================================
// Legacy stage variable functions (internal, for stage defaults)
// ============================================================

const setStageVariable = (key: string, value: any) => {
	stageState.variables[key] = value;
};

const getStageVariable = (key: string) => {
	if (stageState.variables.hasOwnProperty(key)) {
		return stageState.variables[key];
	} else {
		console.warn(`Stage variable ${key} not found`);
	}
};

export {
	stageState,
	
	setStageBackgroundColor,
	setStageBackgroundImage,
	
	stageStateToString,
	setStageVariable,
	getStageVariable,
	setStageVariables,
	resetStageVariables,
};