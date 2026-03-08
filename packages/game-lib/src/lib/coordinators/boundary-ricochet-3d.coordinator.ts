import { GameEntity } from '../entities/entity';
import type { MoveableEntity } from '../actions/capabilities/moveable';
import type { Ricochet3DHandle } from '../behaviors/ricochet-3d/ricochet-3d.descriptor';
import type { WorldBoundary3DHandle } from '../behaviors/world-boundary-3d/world-boundary-3d.descriptor';
import { getBounds3DNormalFromHits } from '../behaviors/shared/bounds-3d';

export class BoundaryRicochet3DCoordinator {
	constructor(
		private entity: GameEntity<any> & MoveableEntity,
		private boundary: WorldBoundary3DHandle,
		private ricochet: Ricochet3DHandle,
	) {}

	public update(): boolean {
		const hits = this.boundary.getLastHits();
		if (!hits) return false;

		const anyHit =
			hits.left || hits.right || hits.top || hits.bottom || hits.back || hits.front;
		if (!anyHit) return false;

		const clamped = this.boundary.getLastClampedPosition();
		if (clamped && this.entity.body) {
			this.entity.body.setTranslation(clamped, true);
		}

		const normal = getBounds3DNormalFromHits(hits);
		return this.ricochet.applyRicochet({
			entity: this.entity,
			contact: { normal },
		});
	}
}
