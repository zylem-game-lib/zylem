export { drizzle, waterDrizzlePreset } from './drizzle';
export { mist, waterMistPreset } from './mist';
export { splash, waterSplashPreset } from './splash';
export { spray, waterSprayPreset } from './spray';
export { torrent, waterTorrentPreset } from './torrent';

import { drizzle } from './drizzle';
import { mist } from './mist';
import { splash } from './splash';
import { spray } from './spray';
import { torrent } from './torrent';

export const waterPresets = {
	mist,
	spray,
	splash,
	drizzle,
	torrent,
} as const;
