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

/** Replace multiple defaults at once (shallow merge). */
function setStageDefaults(partial: Partial<ZylemStageConfig>): void {
	Object.assign(stageDefaultsState, partial);
}

/** Reset defaults back to library defaults. */
function resetStageDefaults(): void {
	Object.assign(stageDefaultsState, initialDefaults);
}

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


