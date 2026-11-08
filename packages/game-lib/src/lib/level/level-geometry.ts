/**
 * Triangle meshes for compiled brushes.
 *
 * Faces arrive as convex rings wound counter-clockwise about their outward
 * normals, so a fan from the first corner triangulates each one. Corners are
 * not shared between faces, which keeps the shading flat.
 */

import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { CompiledBrush } from '@zylem/bridge';

function appendBrush(compiled: CompiledBrush, positions: number[], indices: number[]): void {
	for (const face of compiled.faces) {
		const base = positions.length / 3;
		for (const index of face.indices) {
			const vertex = compiled.vertices[index]!;
			positions.push(vertex.x, vertex.y, vertex.z);
		}
		for (let i = 1; i < face.indices.length - 1; i += 1) {
			indices.push(base, base + i, base + i + 1);
		}
	}
}

function toGeometry(positions: number[], indices: number[]): BufferGeometry {
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
}

export function brushGeometry(compiled: CompiledBrush): BufferGeometry {
	const positions: number[] = [];
	const indices: number[] = [];
	appendBrush(compiled, positions, indices);
	return toGeometry(positions, indices);
}

/** Several brushes as one geometry: one draw call for a whole sector in play. */
export function mergedBrushGeometry(brushes: readonly CompiledBrush[]): BufferGeometry {
	const positions: number[] = [];
	const indices: number[] = [];
	for (const compiled of brushes) appendBrush(compiled, positions, indices);
	return toGeometry(positions, indices);
}
