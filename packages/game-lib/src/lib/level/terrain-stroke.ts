import {
	applyTerrainBrush,
	sweepTerrainBrush,
	type LevelGesture,
	type TerrainBrush,
	type TerrainPlane,
} from '@zylem/bridge';
import type { Vector3 } from 'three';

/** A stroke owns its starting surface so repeat pointer events never accumulate extra height. */
export class TerrainStroke {
	readonly kind = 'terrain';
	private weights = new Map<number, number>();
	private previous: Vector3 | null = null;

	constructor(
		readonly plane: TerrainPlane,
		private brush: TerrainBrush,
		readonly radius: number
	) {}

	move(point: Vector3 | null): TerrainPlane | null {
		const from = this.previous;
		this.previous = point;
		if (
			!point ||
			!sweepTerrainBrush(this.weights, this.plane, this.brush, from ?? point, point, this.radius)
		)
			return null;
		return applyTerrainBrush(this.plane, this.brush, this.weights);
	}

	finish(): LevelGesture | null {
		return this.weights.size
			? {
					kind: 'terrain-stroke',
					planeId: this.plane.id,
					brush: this.brush,
					weights: [...this.weights],
				}
			: null;
	}
}
