export { arc, electricityArcPreset } from './arc';
export { pulse, electricityPulsePreset } from './pulse';
export { spark, electricitySparkPreset } from './spark';
export { storm, electricityStormPreset } from './storm';
export { surge, electricitySurgePreset } from './surge';

import { arc } from './arc';
import { pulse } from './pulse';
import { spark } from './spark';
import { storm } from './storm';
import { surge } from './surge';

export const electricityPresets = {
	spark,
	arc,
	surge,
	pulse,
	storm,
} as const;
