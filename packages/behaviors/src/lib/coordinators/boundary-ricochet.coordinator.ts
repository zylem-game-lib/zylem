import { GameEntity } from '../entities/entity';
import { Ricochet2DHandle } from '../behaviors/ricochet-2d/ricochet-2d.descriptor';
import { WorldBoundary2DHandle } from '../behaviors/world-boundary-2d/world-boundary-2d.descriptor';
import { MoveableEntity } from '../actions/capabilities/moveable';
import { getBounds2DNormalFromHits } from '../behaviors/shared/bounds-2d';

/**
 * Coordinator that bridges WorldBoundary2DBehavior and Ricochet2DBehavior.
 * 
 * Automatically handles:
 * 1. Checking boundary hits
 * 2. Computing collision normals
 * 3. Requesting ricochet result
 * 4. Applying movement
 */
export class BoundaryRicochetCoordinator {
    constructor(
        private entity: GameEntity<any> & MoveableEntity,
        private boundary: WorldBoundary2DHandle,
        private ricochet: Ricochet2DHandle
    ) {}

    /**
     * Update loop - call this every frame.
     * Applies ricochet via transformStore and notifies listeners.
     * 
     * @returns true if ricochet was applied, false otherwise
     */
    public update(): boolean {
        const hits = this.boundary.getLastHits();
        if (!hits) return false;

        const anyHit = hits.left || hits.right || hits.top || hits.bottom;
        if (!anyHit) return false;

        const normal = getBounds2DNormalFromHits(hits);

        // Apply ricochet (also emits to listeners)
        return this.ricochet.applyRicochet({
            entity: this.entity,
            contact: { normal: { x: normal.x, y: normal.y } },
        });
    }
}
