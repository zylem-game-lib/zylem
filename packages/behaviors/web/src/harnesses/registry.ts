import type { BehaviorHarness } from './types';
import { screenWrapHarness } from './screen-wrap';
import { worldBoundary2DHarness } from './world-boundary-2d';
import { cooldownHarness } from './cooldown';

/**
 * Behaviors whose runtime requires Rapier, the wasm stage, or a live
 * entity body — not yet wired into the text harness.
 */
export const runtimeRequired: ReadonlyArray<{ id: string; name: string }> = [
	{ id: 'thruster', name: 'Thruster' },
	{ id: 'top-down-movement', name: 'Top-down Movement' },
	{ id: 'shooter-2d', name: 'Shooter 2D' },
	{ id: 'ricochet-2d', name: 'Ricochet 2D' },
	{ id: 'ricochet-3d', name: 'Ricochet 3D' },
	{ id: 'screen-visibility', name: 'Screen Visibility' },
	{ id: 'world-boundary-3d', name: 'World Boundary 3D' },
	{ id: 'jumper-2d', name: 'Jumper 2D' },
	{ id: 'jumper-3d', name: 'Jumper 3D' },
	{ id: 'platformer-3d', name: 'Platformer 3D' },
	{ id: 'first-person', name: 'First Person' },
	{ id: 'destructible-3d', name: 'Destructible 3D' },
	{ id: 'particle-emitter', name: 'Particle Emitter' },
];

export const registry: ReadonlyArray<BehaviorHarness<any, any, any>> = [
	screenWrapHarness,
	worldBoundary2DHarness,
	cooldownHarness,
];
