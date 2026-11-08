/**
 * Compile a level's solids into convex-hull vertex buffers.
 *
 * One buffer per brush that closes. Vertices stay in world space, matching the
 * brush planes, so the body that carries them sits at the origin.
 */

import { compileBrush, type BrushSolid, type CompiledBrush } from '@zylem/bridge';

export function hullVertices(compiled: CompiledBrush): Float32Array {
	const vertices = new Float32Array(compiled.vertices.length * 3);
	compiled.vertices.forEach((vertex, index) => {
		vertices[index * 3] = vertex.x;
		vertices[index * 3 + 1] = vertex.y;
		vertices[index * 3 + 2] = vertex.z;
	});
	return vertices;
}

export function levelCollisionHulls(solids: readonly BrushSolid[]): Float32Array[] {
	const hulls: Float32Array[] = [];
	for (const solid of solids) {
		const compiled = compileBrush(solid.planes);
		if (compiled) hulls.push(hullVertices(compiled));
	}
	return hulls;
}
