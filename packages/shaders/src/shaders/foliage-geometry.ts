/**
 * Geometry helper for {@link createFoliage}: a cluster of collapsed leaf
 * quads.
 *
 * Each leaf is two triangles whose four vertices all sit at the leaf center
 * (with corner UVs 0/1) — the foliage shader's `positionNode` expands them
 * toward the camera at render time, exactly like the original demo's
 * bush.glb. Leaf centers are scattered in an ellipsoid resting on y = 0,
 * biased toward the surface for a bushy silhouette; normals point outward
 * from the cluster center for the fresnel rim.
 */
import { BufferAttribute, BufferGeometry } from 'three';

export interface FoliageClusterOptions {
	/** Number of leaf quads. Default 400 */
	leafCount?: number;
	/** Ellipsoid radii of the cluster. Default { x: 1, y: 0.8, z: 1 } */
	radius?: { x: number; y: number; z: number };
	/**
	 * 0 = leaves fill the volume, 1 = leaves sit on the ellipsoid surface.
	 * Default 0.6
	 */
	surfaceBias?: number;
	/** RNG seed for deterministic clusters. Default 1 */
	seed?: number;
}

/** Small deterministic PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Build a collapsed-quad leaf cluster geometry for the foliage shader. The
 * cluster rests on y = 0 and extends to y = 2 * radius.y.
 */
export function createFoliageClusterGeometry(
	options: FoliageClusterOptions = {},
): BufferGeometry {
	const leafCount = options.leafCount ?? 400;
	const radius = options.radius ?? { x: 1, y: 0.8, z: 1 };
	const surfaceBias = options.surfaceBias ?? 0.6;
	const rand = mulberry32(options.seed ?? 1);

	const positions = new Float32Array(leafCount * 4 * 3);
	const normals = new Float32Array(leafCount * 4 * 3);
	const uvs = new Float32Array(leafCount * 4 * 2);
	const indices = new Uint32Array(leafCount * 6);

	for (let i = 0; i < leafCount; i++) {
		// Uniform random direction on the sphere
		const theta = rand() * Math.PI * 2;
		const z = rand() * 2 - 1;
		const s = Math.sqrt(1 - z * z);
		const dir = { x: s * Math.cos(theta), y: z, z: s * Math.sin(theta) };

		// Bias radial placement toward the surface
		const radial = surfaceBias + (1 - surfaceBias) * Math.cbrt(rand());

		const cx = dir.x * radial * radius.x;
		const cy = dir.y * radial * radius.y + radius.y;
		const cz = dir.z * radial * radius.z;

		for (let corner = 0; corner < 4; corner++) {
			const v = i * 4 + corner;
			positions[v * 3] = cx;
			positions[v * 3 + 1] = cy;
			positions[v * 3 + 2] = cz;
			normals[v * 3] = dir.x;
			normals[v * 3 + 1] = dir.y;
			normals[v * 3 + 2] = dir.z;
			uvs[v * 2] = corner % 2;
			uvs[v * 2 + 1] = corner < 2 ? 0 : 1;
		}

		const base = i * 4;
		indices.set([base, base + 1, base + 2, base + 2, base + 1, base + 3], i * 6);
	}

	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new BufferAttribute(positions, 3));
	geometry.setAttribute('normal', new BufferAttribute(normals, 3));
	geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
	geometry.setIndex(new BufferAttribute(indices, 1));
	// Collapsed quads have zero area; give raycasting/culling a real volume.
	geometry.computeBoundingSphere();
	if (geometry.boundingSphere) {
		geometry.boundingSphere.radius += 1;
	}
	return geometry;
}
