export { arcane } from './arcane';
export { corrupted } from './corrupted';
export { holy } from './holy';
export { nature } from './nature';
export { psychic } from './psychic';
export { voidMagic } from './void';

import { arcane } from './arcane';
import { corrupted } from './corrupted';
import { holy } from './holy';
import { nature } from './nature';
import { psychic } from './psychic';
import { voidMagic } from './void';

export const magicPresets = {
	arcane,
	holy,
	corrupted,
	nature,
	void: voidMagic,
	psychic,
} as const;
