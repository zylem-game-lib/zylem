/**
 * Reactive, library-wide default config for newly created stages.
 *
 * Holds a valtio proxy of baseline stage settings (background, inputs, gravity,
 * variables) that can be mutated at runtime to influence future stages, plus
 * `getStageOptions`, which merges those defaults into the option array the
 * `stage()` builder passes to `Stage`. Exists so defaults are centralized and
 * tweakable rather than hard-coded at each call site.
 */
import { proxy } from 'valtio/vanilla';
import { Vector3 } from 'three';
import type { StageOptions, ZylemStageConfig } from './zylem-stage';
import { ZylemBlueColor } from '../core/utility/vector';

/**
 * Reactive defaults for building `Stage` instances. These values are applied
 * automatically by the `stage()` builder and can be changed at runtime to
 * influence future stage creations.
 */
const initialDefaults: Partial<ZylemStageConfig> = {
	backgroundColor: ZylemBlueColor,
	backgroundImage: null,
	inputs: {
		p1: ['gamepad-1', 'keyboard'],
		p2: ['gamepad-2', 'keyboard'],
	},
	gravity: new Vector3(0, 0, 0),
	variables: {},
};

const stageDefaultsState = proxy<Partial<ZylemStageConfig>>({
	...initialDefaults,
});

export function getStageOptions(options: StageOptions): StageOptions {
	const defaults = getStageDefaultConfig();
	let originalConfig = {};
	if (typeof options[0] === 'object') {
		originalConfig = options.shift() ?? {};
	}
	const combinedConfig = { ...defaults, ...originalConfig };
	return [combinedConfig, ...options] as StageOptions;
}

/** Get a plain object copy of the current defaults. */
function getStageDefaultConfig(): Partial<ZylemStageConfig> {
	return {
		backgroundColor: stageDefaultsState.backgroundColor,
		backgroundImage: stageDefaultsState.backgroundImage ?? null,
		inputs: stageDefaultsState.inputs ? { ...stageDefaultsState.inputs } : undefined,
		gravity: stageDefaultsState.gravity,
		variables: stageDefaultsState.variables ? { ...stageDefaultsState.variables } : undefined,
	};
}


