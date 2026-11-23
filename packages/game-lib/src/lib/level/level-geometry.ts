/**
 * Triangle meshes for compiled brushes.
 *
 * Faces arrive as convex rings wound counter-clockwise about their outward
 * normals, so a fan from the first corner triangulates each one. Corners are
 * not shared between faces, which keeps the shading flat.
 *
 * Given the planes, each face also gets UVs from its surface, and the
 * triangles are grouped by texture: one group, and so one material, per
 * texture, with the bare faces first.
 */

import { BufferGeometry, Float32BufferAttribute, type Object3D } from 'three';
import {
	surfaceProjector,
	type BridgePose,
	type BrushPlane,
	type CompiledBrush,
	type CompiledFace,
} from '@zylem/bridge';

/** Set every part of the pose so a visual a preview moved goes back exactly. */
export function applyLevelPose(object: Object3D, pose: BridgePose): void {
	const position = pose.position ?? { x: 0, y: 0, z: 0 };
	object.position.set(position.x, position.y, position.z);
	if (pose.quaternion) {
		object.quaternion.set(
			pose.quaternion.x,
			pose.quaternion.y,
			pose.quaternion.z,
			pose.quaternion.w
		);
	} else if (pose.rotation) {
		object.rotation.set(pose.rotation.x, pose.rotation.y, pose.rotation.z);
	} else {
		object.quaternion.identity();
	}
	const scale = pose.scale ?? { x: 1, y: 1, z: 1 };
	object.scale.set(scale.x, scale.y, scale.z);
}

interface FaceEntry {
	compiled: CompiledBrush;
	face: CompiledFace;
	plane: BrushPlane | undefined;
}

/** Faces by the texture they show, bare faces (`null`) first, then textures as first met. */
function facesByTexture(
	brushes: readonly CompiledBrush[],
	planes?: readonly (readonly BrushPlane[] | undefined)[],
): Map<string | null, FaceEntry[]> {
	const runs = new Map<string | null, FaceEntry[]>();
	const textured = new Map<string, FaceEntry[]>();
	const bare: FaceEntry[] = [];
	brushes.forEach((compiled, index) => {
		const list = planes?.[index];
		for (const face of compiled.faces) {
			const plane = list?.[face.planeIndex];
			const textureId = plane?.surface?.textureId;
			if (!textureId) {
				bare.push({ compiled, face, plane });
				continue;
			}
			const run = textured.get(textureId);
			if (run) run.push({ compiled, face, plane });
			else textured.set(textureId, [{ compiled, face, plane }]);
		}
	});
	if (bare.length > 0 || textured.size === 0) runs.set(null, bare);
	for (const [textureId, run] of textured) runs.set(textureId, run);
	return runs;
}

function build(
	brushes: readonly CompiledBrush[],
	planes: readonly (readonly BrushPlane[] | undefined)[] | undefined,
	trianglePlanes?: number[],
): BufferGeometry {
	const positions: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];
	const textures: Array<string | null> = [];
	const geometry = new BufferGeometry();

	for (const [textureId, run] of facesByTexture(brushes, planes)) {
		const start = indices.length;
		for (const { compiled, face, plane } of run) {
			const base = positions.length / 3;
			const project = plane ? surfaceProjector(plane.normal, plane.surface) : null;
			for (const index of face.indices) {
				const vertex = compiled.vertices[index]!;
				positions.push(vertex.x, vertex.y, vertex.z);
				const uv = project?.(vertex);
				uvs.push(uv?.u ?? 0, uv?.v ?? 0);
			}
			for (let i = 1; i < face.indices.length - 1; i += 1) {
				indices.push(base, base + i, base + i + 1);
				trianglePlanes?.push(face.planeIndex);
			}
		}
		geometry.addGroup(start, indices.length - start, textures.length);
		textures.push(textureId);
	}

	geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
	geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	geometry.userData.textures = textures;
	return geometry;
}

/**
 * The texture of each material slot of a brush geometry, `null` for the bare
 * faces. A mesh takes one material per entry, in this order.
 */
export function geometryTextures(geometry: BufferGeometry): ReadonlyArray<string | null> {
	return (geometry.userData.textures as Array<string | null> | undefined) ?? [null];
}

/**
 * One brush. `userData.trianglePlanes[i]` is the plane index of triangle `i`,
 * for face picking.
 *
 * @param planes The planes the brush was compiled from, for its surfaces.
 * Without them every face is bare.
 */
export function brushGeometry(compiled: CompiledBrush, planes?: readonly BrushPlane[]): BufferGeometry {
	const trianglePlanes: number[] = [];
	const geometry = build([compiled], planes ? [planes] : undefined, trianglePlanes);
	geometry.userData.trianglePlanes = trianglePlanes;
	return geometry;
}

/**
 * Several brushes as one geometry: one draw call per texture for a whole
 * sector in play.
 *
 * @param planes The planes of each brush, in the same order.
 */
export function mergedBrushGeometry(
	brushes: readonly CompiledBrush[],
	planes?: readonly (readonly BrushPlane[] | undefined)[],
): BufferGeometry {
	return build(brushes, planes);
}
