export { blaze, fireBlazePreset } from './blaze';
export { ember, fireEmberPreset } from './ember';
export { flamelet, fireFlameletPreset } from './flamelet';
export { smolder, fireSmolderPreset } from './smolder';
export { spark, fireSparkPreset } from './spark';

import { blaze } from './blaze';
import { ember } from './ember';
import { flamelet } from './flamelet';
import { smolder } from './smolder';
import { spark } from './spark';

export const firePresets = {
	spark,
	ember,
	flamelet,
	blaze,
	smolder,
} as const;
