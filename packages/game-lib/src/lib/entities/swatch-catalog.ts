/**
 * Built-in swatch sources: every behavior descriptor game-lib re-exports from
 * `@zylem/game-lib/behavior`, registered under its export name.
 *
 * Kept apart from `swatch-registry.ts` so the registry module does not pull the
 * whole behavior barrel into every bundle; only games that call this (the
 * `ZylemGame` constructor does) pay for it. Shaders are not built in — game-lib
 * does not depend on `@zylem/shaders` — so hosts register those themselves.
 */

import * as behaviors from '../behaviors';
import { registerSwatchSourcesFromModule } from './swatch-registry';

let registered: (() => void) | null = null;

/**
 * Register the built-in behavior descriptors as swatch sources. Idempotent, so
 * a second game on the page does not re-register them.
 */
export function registerBuiltInBehaviorSwatchSources(): () => void {
	if (registered) return registered;
	registered = registerSwatchSourcesFromModule(
		'behavior',
		behaviors as unknown as Record<string, unknown>,
	);
	return registered;
}
