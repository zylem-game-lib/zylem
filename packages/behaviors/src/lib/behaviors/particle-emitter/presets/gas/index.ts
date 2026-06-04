export { haze, gasHazePreset } from './haze';
export { miasma, gasMiasmaPreset } from './miasma';
export { plume, gasPlumePreset } from './plume';
export { smoke, gasSmokePreset } from './smoke';
export { vapor, gasVaporPreset } from './vapor';

import { haze } from './haze';
import { miasma } from './miasma';
import { plume } from './plume';
import { smoke } from './smoke';
import { vapor } from './vapor';

export const gasPresets = {
	vapor,
	smoke,
	haze,
	plume,
	miasma,
} as const;
