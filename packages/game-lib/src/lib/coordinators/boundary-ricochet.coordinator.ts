import { GameEntity } from '../entities/entity';
import { Ricochet2DHandle, Ricochet2DResult } from '../behaviors/ricochet-2d/ricochet-2d.descriptor';
import { WorldBoundary2DHandle } from '../behaviors/world-boundary-2d/world-boundary-2d.descriptor';
import { MoveableEntity } from '../actions/capabilities/moveable';

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
     * Update loop - call this every frame
     */
    public update(): Ricochet2DResult | null {
        const hits = this.boundary.getLastHits();
        if (!hits) return null;

        const anyHit = hits.left || hits.right || hits.top || hits.bottom;
        if (!anyHit) return null;

        // Compute collision normal from boundary hits
        let normalX = 0;
        let normalY = 0;
        if (hits.left) normalX = 1;
        if (hits.right) normalX = -1;
        if (hits.bottom) normalY = 1;
        if (hits.top) normalY = -1;

        // Compute ricochet result
        return this.ricochet.getRicochet({
            entity: this.entity,
            contact: { normal: { x: normalX, y: normalY } },
        });
    }
}
