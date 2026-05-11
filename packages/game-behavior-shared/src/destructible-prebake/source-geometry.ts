/**
 * Normalizes source mesh geometry for Voronoi prebake / fracture so runtime and
 * CLI tooling share one code path (float attributes, non-indexed, root-relative transform).
 */

import {
	BufferAttribute,
	BufferGeometry,
	Matrix4,
	type Group,
	type Mesh,
} from 'three';

type ReadableGeometryAttribute = Pick<
	BufferAttribute,
	'count' | 'itemSize' | 'getComponent'
>;

function cloneAttributeAsFloat32(
	attribute: ReadableGeometryAttribute,
): BufferAttribute {
	const values = new Float32Array(attribute.count * attribute.itemSize);
	let offset = 0;
	for (let index = 0; index < attribute.count; index += 1) {
		for (let component = 0; component < attribute.itemSize; component += 1) {
			values[offset] = attribute.getComponent(index, component);
			offset += 1;
		}
	}

	return new BufferAttribute(values, attribute.itemSize);
}

/**
 * Clones geometry with float32 attributes and expands indexed meshes to non-indexed.
 */
export function normalizeFractureSourceGeometry(
	sourceGeometry: BufferGeometry,
): BufferGeometry {
	const geometry = sourceGeometry.clone();
	for (const [name, attribute] of Object.entries(geometry.attributes)) {
		geometry.setAttribute(name, cloneAttributeAsFloat32(attribute));
	}

	const index = geometry.getIndex();
	if (!index) {
		return geometry;
	}

	const indices = new Uint32Array(index.count);
	for (let cursor = 0; cursor < index.count; cursor += 1) {
		indices[cursor] = index.getX(cursor);
	}

	geometry.setIndex(new BufferAttribute(indices, 1));
	return geometry.toNonIndexed();
}

/**
 * Produces fracture-space geometry: normalized mesh vertices in root-local space.
 */
export function buildNormalizedFractureSourceGeometry(
	mesh: Mesh,
	root: Group,
): BufferGeometry {
	const geometry = normalizeFractureSourceGeometry(mesh.geometry);
	root.updateMatrixWorld(true);
	mesh.updateMatrixWorld(true);

	const relativeMatrix = new Matrix4()
		.copy(root.matrixWorld)
		.invert()
		.multiply(mesh.matrixWorld);

	geometry.applyMatrix4(relativeMatrix);
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();
	return geometry;
}
