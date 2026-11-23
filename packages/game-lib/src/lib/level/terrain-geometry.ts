import {
	surfaceProjector,
	terrainSample,
	terrainTagColor,
	type BrushVec3,
	type TerrainPlane,
} from '@zylem/bridge';
import {
	BufferGeometry,
	Float32BufferAttribute,
	Line,
	LineBasicMaterial,
	Mesh,
	Object3D,
	Raycaster,
	Vector3,
	type Material,
} from 'three';
import { applyLevelPose } from './level-geometry';
import type { LevelTextures } from './level-textures';

const UP = { x: 0, y: 1, z: 0 };

/** Shared vertex grid for rendering, navigation and static triangle collision. */
export function terrainGridGeometry(plane: TerrainPlane): BufferGeometry {
	const n = plane.cells;
	const vertices = new Float32Array(plane.heights.length * 3);
	const indices: number[] = [];
	for (let z = 0; z <= n; z++) {
		for (let x = 0; x <= n; x++) {
			const a = z * (n + 1) + x;
			vertices[a * 3] = x - n / 2;
			vertices[a * 3 + 1] = plane.heights[a]!;
			vertices[a * 3 + 2] = z - n / 2;
			if (z === n || x === n) continue;
			const right = a + 1;
			const below = a + n + 1;
			indices.push(a, below, right, right, below, below + 1);
		}
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
	geometry.setIndex(indices);
	return geometry;
}

export function terrainWorldGeometry(plane: TerrainPlane): BufferGeometry {
	const geometry = terrainGridGeometry(plane);
	const frame = new Object3D();
	applyLevelPose(frame, plane.pose);
	frame.updateMatrix();
	return geometry.applyMatrix4(frame.matrix);
}

export interface TerrainView {
	plane: TerrainPlane;
	mesh: Mesh;
}

/** Split UV seams at cell edges while retaining shared grid normals and one draw group per material. */
export function terrainAppearance(
	plane: TerrainPlane,
	textures: LevelTextures,
	selected: boolean,
	showTags: boolean
) {
	const grid = terrainGridGeometry(plane);
	grid.computeVertexNormals();
	if (
		!Object.keys(plane.surfaces ?? {}).length &&
		!(showTags && Object.keys(plane.tags ?? {}).length)
	)
		return { geometry: grid, material: textures.material(null, { selected }) };

	const geometry = grid.toNonIndexed();
	grid.dispose();
	const positions = geometry.getAttribute('position');
	const uvs = new Float32Array(positions.count * 2);
	const groups = new Map<Material, number[]>();
	const bareProjector = surfaceProjector(UP);
	const point = new Vector3();
	for (let cell = 0; cell < plane.cells ** 2; cell++) {
		const surface = plane.surfaces?.[cell];
		const tag = showTags && plane.tags?.[cell];
		const material = textures.material(surface?.textureId ?? null, {
			selected,
			tint: tag ? terrainTagColor(tag) : null,
		});
		let group = groups.get(material);
		if (!group) {
			group = [];
			groups.set(material, group);
		}
		const project = surface ? surfaceProjector(UP, surface) : bareProjector;
		for (let i = cell * 6; i < (cell + 1) * 6; i++) {
			const uv = project(point.fromBufferAttribute(positions, i));
			uvs[i * 2] = uv.u;
			uvs[i * 2 + 1] = uv.v;
			group.push(i);
		}
	}
	geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
	const indices: number[] = [];
	const materials: Material[] = [];
	for (const [material, group] of groups) {
		geometry.addGroup(indices.length, group.length, materials.length);
		for (const index of group) indices.push(index);
		materials.push(material);
	}
	geometry.setIndex(indices);
	return { geometry, material: materials };
}

export function terrainBrushOutline(view: TerrainView, local: Vector3, radius: number): Line {
	const points: Vector3[] = [];
	const edge = view.plane.cells / 2;
	for (let i = 0; i <= 48; i++) {
		const angle = (i * Math.PI) / 24;
		const x = Math.max(-edge, Math.min(edge, local.x + Math.cos(angle) * radius));
		const z = Math.max(-edge, Math.min(edge, local.z + Math.sin(angle) * radius));
		const height = terrainSample(view.plane, x, z)!.height;
		points.push(view.mesh.localToWorld(new Vector3(x, height + 0.025, z)));
	}
	const line = new Line(
		new BufferGeometry().setFromPoints(points),
		new LineBasicMaterial({ color: 0xffffff, depthTest: false })
	);
	line.renderOrder = 10;
	return line;
}

export interface TerrainSurfaceHit {
	planeId: string;
	/** World Y at the supplied X and Z. */
	height: number;
	/** The game's surface tag, or null on an unmarked cell. */
	tag: string | null;
}

/** Find the highest terrain triangle at or below a world position, including on overlapping planes. */
export function terrainSurfaceBelow(
	views: Iterable<TerrainView>,
	position: BrushVec3
): TerrainSurfaceHit | null {
	let closest: TerrainSurfaceHit | null = null;
	const local = new Vector3();
	const origin = new Vector3(position.x, position.y + 1e-6, position.z);
	const down = new Vector3(0, -1, 0);
	for (const { plane, mesh } of views) {
		const matrix = mesh.matrixWorld.elements;
		// An upright heightfield needs just one grid lookup, even if translated, scaled or turned about Y.
		if (Math.abs(matrix[4]!) + Math.abs(matrix[6]!) < 1e-10) {
			mesh.worldToLocal(local.copy(origin));
			const sample = terrainSample(plane, local.x, local.z);
			if (!sample) continue;
			local.y = sample.height;
			const height = mesh.localToWorld(local).y;
			if (height > origin.y || (closest && closest.height >= height)) continue;
			closest = { planeId: plane.id, height, tag: sample.tag };
		} else {
			const hit = new Raycaster(origin, down).intersectObject(mesh, false)[0];
			if (!hit || (closest && closest.height >= hit.point.y)) continue;
			mesh.worldToLocal(local.copy(hit.point));
			const sample = terrainSample(plane, local.x, local.z);
			if (sample) closest = { planeId: plane.id, height: hit.point.y, tag: sample.tag };
		}
	}
	return closest;
}
