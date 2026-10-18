/**
 * Compile a level's solids into convex-hull vertex buffers.
 *
 * One buffer per brush that closes. The caller puts them on a single static
 * body. Vertices stay in world space, matching the brush planes.
 */

import { compileBrush } from './brush';
import type { BrushSolid } from './level-types';

export function levelCollisionHulls(solids: readonly BrushSolid[]): Float32Array[] {
	const hulls: Float32Array[] = [];
	for (const solid of solids) {
		const compiled = compileBrush(solid.planes);
		if (!compiled) continue;
		const vertices = new Float32Array(compiled.vertices.length * 3);
		compiled.vertices.forEach((vertex, index) => {
			vertices[index * 3] = vertex.x;
			vertices[index * 3 + 1] = vertex.y;
			vertices[index * 3 + 2] = vertex.z;
		});
		hulls.push(vertices);
	}
	return hulls;
}
