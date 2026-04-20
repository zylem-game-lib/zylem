import { Color } from 'three';
import { createSphere } from '@zylem/game-lib';
import groundTextureUrl from '../assets/ground.png';

type Boulder = ReturnType<typeof createSphere>;

interface BoulderSpec {
	position: { x: number; y: number; z: number };
	radius: number;
	tint: Color;
}

/**
 * Deterministic, hand-placed boulder layout for the arena main stage.
 *
 * - Placement is fixed so bug reports and screenshots reproduce cleanly.
 * - All boulders use static collision so the platformer can collide with
 *   and walk around them without being able to push them.
 * - The player spawns at the origin, so no boulder sits within ~3 units
 *   of (0, 0, 0).
 */
function boulderSpecs(): BoulderSpec[] {
	const base = 0.46;
	const shade = (offset: number): Color =>
		new Color(base + offset, base + offset, base + offset);

	return [
		{ position: { x: 8, y: -3.1, z: 5 }, radius: 1.8, tint: shade(0.04) },
		{ position: { x: -6, y: -3.3, z: 9 }, radius: 1.4, tint: shade(-0.02) },
		{ position: { x: 12, y: -2.9, z: -4 }, radius: 2.2, tint: shade(0.02) },
		{ position: { x: -9, y: -3.1, z: -7 }, radius: 1.6, tint: shade(0.06) },
		{ position: { x: 4, y: -3.5, z: -10 }, radius: 1.2, tint: shade(-0.05) },
		{ position: { x: -12, y: -3.2, z: 3 }, radius: 1.9, tint: shade(0.01) },
		{ position: { x: 7, y: -3.4, z: 11 }, radius: 1.0, tint: shade(-0.03) },
		{ position: { x: -4, y: -3.6, z: 13 }, radius: 0.9, tint: shade(0.05) },
	];
}

/**
 * Builds the fixed set of static boulder obstacles for the arena main
 * stage. Callers are responsible for adding the returned entities to
 * the stage.
 */
export function createBoulders(): Boulder[] {
	return boulderSpecs().map((spec) =>
		createSphere({
			radius: spec.radius,
			position: spec.position,
			// Share the ground texture with the plane so the boulders read
			// as rocks of the same material. `color` multiplies the sampled
			// texture, keeping the per-boulder shade variation for depth.
			material: {
				path: groundTextureUrl,
				color: spec.tint,
				repeat: { x: 2, y: 2 },
			},
			collision: { static: true },
		}),
	);
}
