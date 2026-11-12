import { getPositionsAndIndices, NavMeshHelper } from '@recast-navigation/three';
import type { BridgeVec3, NavigationPath } from '@zylem/bridge';
import { Detour, importNavMesh, init, type NavMesh, NavMeshQuery, Raw } from 'recast-navigation';

export { getPositionsAndIndices };

/** Owns Detour resources. A path supplies waypoints; movement and link traversal belong to gameplay. */
export class NavigationMesh {
	private query: NavMeshQuery;
	private disposed = false;
	private constructor(private mesh: NavMesh) {
		this.query = new NavMeshQuery(mesh);
	}
	static async load(bytes: Uint8Array): Promise<NavigationMesh> {
		await init();
		const { navMesh } = importNavMesh(bytes);
		return new NavigationMesh(navMesh);
	}
	createHelper(): NavMeshHelper {
		return new NavMeshHelper(this.mesh);
	}
	findPath(
		start: BridgeVec3,
		end: BridgeVec3,
		halfExtents: BridgeVec3 = { x: 1, y: 2, z: 1 }
	): NavigationPath {
		const empty: NavigationPath = { status: 'unreachable', points: [] };
		if (this.disposed) return empty;
		if (
			![
				start.x,
				start.y,
				start.z,
				end.x,
				end.y,
				end.z,
				halfExtents.x,
				halfExtents.y,
				halfExtents.z,
			].every(Number.isFinite) ||
			Math.min(halfExtents.x, halfExtents.y, halfExtents.z) <= 0
		)
			return empty;
		const a = this.query.findNearestPoly(start, { halfExtents });
		const b = this.query.findNearestPoly(end, { halfExtents });
		if (!a.success || !b.success || !a.nearestRef || !b.nearestRef) return empty;
		const corridor = this.query.findPath(
			a.nearestRef,
			b.nearestRef,
			a.nearestPoint,
			b.nearestPoint
		);
		try {
			if (!corridor.success || !corridor.polys.size) return empty;
			const last = corridor.polys.get(corridor.polys.size - 1);
			const target = this.query.closestPointOnPoly(last, b.nearestPoint);
			if (!target.success) return empty;
			const straight = this.query.findStraightPath(
				a.nearestPoint,
				target.closestPoint,
				corridor.polys
			);
			try {
				if (!straight.success || !straight.straightPathCount) return empty;
				const points: BridgeVec3[] = [];
				for (let i = 0; i < straight.straightPathCount; i++)
					points.push({
						x: straight.straightPath.get(i * 3),
						y: straight.straightPath.get(i * 3 + 1),
						z: straight.straightPath.get(i * 3 + 2),
					});
				const endFlag =
					straight.straightPathFlags.get(straight.straightPathCount - 1) &
					Detour.DT_STRAIGHTPATH_END;
				return { points, status: last === b.nearestRef && endFlag ? 'complete' : 'partial' };
			} finally {
				straight.straightPath.destroy();
				straight.straightPathFlags.destroy();
				straight.straightPathRefs.destroy();
			}
		} finally {
			corridor.polys.destroy();
		}
	}
	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;
		this.query.destroy();
		// Recast 0.44's query destructor does not own its default filter.
		Raw.destroy(this.query.defaultFilter.raw);
		this.mesh.destroy();
	}
}
