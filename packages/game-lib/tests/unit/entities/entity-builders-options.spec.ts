import { describe, expect, it } from 'vitest';
import { Vector2, Vector3 } from 'three';

import { createPlane, PlaneMeshBuilder } from '../../../src/lib/entities/plane';

/**
 * Regression coverage for a bug where `entity.options._builders` was
 * `undefined` even though the builders ran successfully.
 *
 * Some entity classes (e.g. `ZylemPlane`) reassign `this.options = deepMerge(...)`
 * inside their constructor, producing a fresh object. The `EntityBuilder`
 * constructor was attaching `_builders` to the raw `arg` it received, which
 * is no longer the same reference as the entity's `options` after that
 * reassignment. Consumers that look up `entity.options._builders` (e.g. a
 * runtime adapter extracting `heightData` from a plane's mesh builder for a
 * WASM heightfield) saw `undefined` and silently bailed out — manifesting
 * as "no collision on the ground" in the third-person demo.
 *
 * The fix in `EntityBuilder` mirrors the `_builders` assignment onto the
 * entity's `options` as well, so post-build consumers can reach the mesh /
 * collision / material builders that produced the entity.
 */
describe('EntityBuilder._builders propagation', () => {
	it('exposes the meshBuilder/collisionBuilder on entity.options after build', () => {
		const plane = createPlane({
			tile: new Vector2(10, 10),
			position: new Vector3(0, -1, 0),
			randomizeHeight: false,
			heightMap: [0, 1, 2, 3, 4],
		});

		const builders = (plane.options as any)._builders;
		expect(builders).toBeDefined();
		expect(builders.meshBuilder).toBeInstanceOf(PlaneMeshBuilder);
		expect(builders.collisionBuilder).toBeDefined();
		expect(builders.materialBuilder).toBeDefined();
	});

	it('plane.options._builders.meshBuilder.heightData is populated after build', () => {
		const plane = createPlane({
			tile: new Vector2(10, 10),
			position: new Vector3(0, -1, 0),
			subdivisions: 2,
			heightMap: [1, 2, 3],
		});

		const meshBuilder = ((plane.options as any)._builders?.meshBuilder) as
			| PlaneMeshBuilder
			| undefined;
		expect(meshBuilder).toBeInstanceOf(PlaneMeshBuilder);
		expect(meshBuilder!.heightData.length).toBe((2 + 1) * (2 + 1));
		expect(Array.from(meshBuilder!.heightData)).toEqual([
			1, 1, 1, 2, 2, 2, 3, 3, 3,
		]);
	});
});
