import { type LevelNavigation, validateNavigationSettings } from '@zylem/bridge';
import { exportNavMesh, init, Raw, TileCacheMeshProcess } from 'recast-navigation';
import { generateTileCache } from 'recast-navigation/generators';

export interface NavigationBakeInput {
	positions: Float32Array;
	indices: Uint32Array;
	navigation: LevelNavigation;
}

/** Pure geometry input, suitable for a worker. Returned bytes own their memory. */
export async function bakeNavigationData(input: NavigationBakeInput): Promise<Uint8Array> {
	const { positions, indices, navigation } = input;
	const s = navigation.settings;
	validateNavigationSettings(s);
	if (!positions.length || !indices.length) throw new Error('No solid geometry to bake.');
	if (positions.length % 3 || indices.length % 3) throw new Error('Invalid triangle geometry.');
	let minX = Infinity,
		maxX = -Infinity,
		minZ = Infinity,
		maxZ = -Infinity;
	for (let i = 0; i < positions.length; i += 3) {
		if (![positions[i], positions[i + 1], positions[i + 2]].every(Number.isFinite))
			throw new Error('Geometry must be finite.');
		minX = Math.min(minX, positions[i]);
		maxX = Math.max(maxX, positions[i]);
		minZ = Math.min(minZ, positions[i + 2]);
		maxZ = Math.max(maxZ, positions[i + 2]);
	}
	if (indices.some((i) => i >= positions.length / 3))
		throw new Error('Triangle index outside geometry.');
	if (Math.ceil((maxX - minX) / s.cellSize) * Math.ceil((maxZ - minZ) / s.cellSize) > 16_000_000) {
		throw new Error('Bake exceeds 16 million cells. Increase cell size or split the level.');
	}
	if (navigation.obstacles.length > 128)
		throw new Error('A bake supports up to 128 obstacle volumes.');
	for (const o of navigation.obstacles) {
		if (
			![o.min.x, o.min.y, o.min.z, o.max.x, o.max.y, o.max.z].every(Number.isFinite) ||
			o.min.x >= o.max.x ||
			o.min.y >= o.max.y ||
			o.min.z >= o.max.z
		)
			throw new Error('Obstacle volumes must have positive finite dimensions.');
	}
	for (const l of navigation.links) {
		if (
			![l.start.x, l.start.y, l.start.z, l.end.x, l.end.y, l.end.z, l.radius].every(
				Number.isFinite
			) ||
			l.radius <= 0
		)
			throw new Error('Links need finite endpoints and a positive radius.');
	}
	await init();
	const process = new TileCacheMeshProcess((params, areas, flags) => {
		for (let i = 0; i < params.polyCount(); i++) {
			areas.set(i, 0);
			flags.set(i, 1);
		}
		params.setOffMeshConnections(
			navigation.links.map((l, i) => ({
				startPosition: l.start,
				endPosition: l.end,
				radius: l.radius,
				bidirectional: l.bidirectional,
				area: 0,
				flags: 1,
				userId: i + 1,
			}))
		);
	});
	try {
		const result = generateTileCache(positions, indices, {
			cs: s.cellSize,
			ch: s.cellHeight,
			walkableRadius: Math.ceil(s.agentRadius / s.cellSize),
			walkableHeight: Math.ceil(s.agentHeight / s.cellHeight),
			walkableClimb: Math.floor(s.maxClimb / s.cellHeight),
			walkableSlopeAngle: s.maxSlope,
			tileSize: 64,
			maxObstacles: 128,
			tileCacheMeshProcess: process,
		});
		if (!result.success) throw new Error(result.error);
		const { tileCache, navMesh } = result;
		try {
			const drain = () => {
				for (let i = 0; i < 100_000; i++) {
					const update = tileCache.update(navMesh);
					if (!update.success) throw new Error('Obstacle update failed.');
					if (update.upToDate) return;
				}
				throw new Error('Obstacle update did not complete.');
			};
			// Keep original bounds: earlier blockers can remove whole navmesh tiles,
			// but their compressed TileCache layers still count against Detour's limit.
			const tileBounds: { min: number[]; max: number[] }[] = [];
			for (let i = 0; i < navMesh.getMaxTiles(); i++) {
				const header = navMesh.getTile(i).header();
				if (header)
					tileBounds.push({
						min: [0, 1, 2].map((axis) => header.bmin(axis)),
						max: [0, 1, 2].map((axis) => header.bmax(axis)),
					});
			}
			for (const o of navigation.obstacles) {
				// TileCache carving does not apply agent clearance itself. Add a
				// voxel of tolerance because contour vertices sit on cell edges.
				const padding = Math.ceil(s.agentRadius / s.cellSize) * s.cellSize + s.cellSize;
				const min = { x: o.min.x - padding, y: o.min.y - s.agentHeight, z: o.min.z - padding };
				const max = { x: o.max.x + padding, y: o.max.y, z: o.max.z + padding };
				// Detour queries a conservative square around an oriented box even
				// when its angle is zero (1.41 * max half-extent).
				const radius = (1.42 * Math.max(max.x - min.x, max.z - min.z)) / 2;
				const centerX = (min.x + max.x) / 2,
					centerZ = (min.z + max.z) / 2;
				const queryMin = [centerX - radius, min.y, centerZ - radius];
				const queryMax = [centerX + radius, max.y, centerZ + radius];
				const touched = tileBounds.filter((bounds) =>
					[0, 1, 2].every(
						(axis) => queryMin[axis] <= bounds.max[axis] && queryMax[axis] >= bounds.min[axis]
					)
				).length;
				// Detour limits a single obstacle to eight touched tile layers.
				if (touched > 8)
					throw new Error(
						'Obstacle spans more than eight navigation tiles. Split it into smaller volumes.'
					);
				const added = tileCache.addBoxObstacle(
					{ x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 },
					{ x: (max.x - min.x) / 2, y: (max.y - min.y) / 2, z: (max.z - min.z) / 2 },
					0
				);
				if (!added.success) throw new Error('Could not add obstacle volume.');
				drain();
			}
			let polygons = 0;
			for (let i = 0; i < navMesh.getMaxTiles(); i++)
				polygons += navMesh.getTile(i).header()?.polyCount() ?? 0;
			if (!polygons)
				throw new Error('No walkable surface. Check geometry, exclusions, and agent settings.');
			return exportNavMesh(navMesh).slice();
		} finally {
			tileCache.destroy();
			navMesh.destroy();
		}
	} finally {
		Raw.destroy(process.raw);
	}
}
