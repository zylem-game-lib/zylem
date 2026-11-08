/**
 * Drawing a primitive in two steps.
 *
 * A press starts a footprint on a frame (the face under the cursor, the view
 * plane, or the ground) and the drag sizes it, its corners on the world grid.
 * The release starts the height step: the pointer sets the height along the
 * frame normal until a click commits. Pure state; the session draws it.
 */

import {
	framePoint,
	orderFootprint,
	type BrushFootprint,
	type BrushFrame,
	type BrushVec3,
	type LevelDrawShape,
	type LevelGesture,
} from '@zylem/bridge';
import {
	AxisDrag,
	framePlane,
	rayHitPlane,
	snapInFrame,
	snapValue,
	type DrawRay,
	type ViewBasis,
} from './level-draw';

export type DrawPhase = 'idle' | 'footprint' | 'height';

export interface DrawState {
	frame: BrushFrame;
	/** Ordered, `u0 <= u1` and `v0 <= v1`. */
	footprint: BrushFootprint;
	/** `null` until the height step begins. */
	height: number | null;
}

type PrimitiveGesture = Extract<LevelGesture, { kind: 'primitive' }>;

/** Footprint sides shorter than this are no side at all. */
const MIN_SIDE = 1e-6;

function copyFrame(frame: BrushFrame): BrushFrame {
	return {
		origin: { ...frame.origin },
		u: { ...frame.u },
		v: { ...frame.v },
		normal: { ...frame.normal },
	};
}

export class LevelDrawTool {
	private current: DrawPhase = 'idle';
	private frame: BrushFrame | null = null;
	private step = 0;
	private start = { u: 0, v: 0 };
	private end = { u: 0, v: 0 };
	private height = 0;
	private lift: AxisDrag | null = null;

	get phase(): DrawPhase {
		return this.current;
	}

	/** The frame of the draw in progress. */
	get activeFrame(): BrushFrame | null {
		return this.current === 'idle' ? null : this.frame;
	}

	/** The world point the footprint started from. */
	get anchor(): BrushVec3 | null {
		if (this.current === 'idle' || !this.frame) return null;
		return framePoint(this.frame, this.start.u, this.start.v);
	}

	/** Start a footprint on `frame` at `point`, snapping with `step` (0 for none). */
	begin(frame: BrushFrame, point: BrushVec3, step: number): void {
		this.frame = copyFrame(frame);
		this.step = step;
		this.start = snapInFrame(frame, point, step);
		this.end = { ...this.start };
		this.height = 0;
		this.lift = null;
		this.current = 'footprint';
	}

	/** Size the footprint from a ray on the frame plane. A ray too grazing to read is skipped. */
	drag(ray: DrawRay): void {
		if (this.current !== 'footprint' || !this.frame) return;
		const plane = framePlane(this.frame);
		const hit = rayHitPlane(ray, plane.normal, plane.distance);
		if (hit) this.end = snapInFrame(this.frame, hit, this.step);
	}

	/**
	 * Finish the footprint and begin the height step, or end the draw when the
	 * footprint has no area.
	 *
	 * @returns Whether the height step began.
	 */
	release(ray: DrawRay, view: ViewBasis): boolean {
		if (this.current !== 'footprint' || !this.frame) return false;
		const footprint = this.footprint();
		if (footprint.u1 - footprint.u0 < MIN_SIDE || footprint.v1 - footprint.v0 < MIN_SIDE) {
			this.cancel();
			return false;
		}
		const center = framePoint(
			this.frame,
			(footprint.u0 + footprint.u1) / 2,
			(footprint.v0 + footprint.v1) / 2
		);
		this.lift = new AxisDrag(center, this.frame.normal, ray, view);
		this.height = this.initialHeight();
		this.current = 'height';
		return true;
	}

	/** Set the height from a ray, relative to where the height step began. */
	raise(ray: DrawRay): void {
		if (this.current !== 'height' || !this.lift) return;
		const travel = this.lift.measure(ray);
		if (travel === null) return;
		this.height = snapValue(this.initialHeight() + travel, this.step);
	}

	/** The primitive to commit, or `null` when it would be flat. Ends the draw either way. */
	commit(shape: LevelDrawShape): PrimitiveGesture | null {
		const state = this.state();
		this.cancel();
		if (!state?.height) return null;
		return {
			kind: 'primitive',
			frame: copyFrame(state.frame),
			footprint: state.footprint,
			height: state.height,
			shape: { ...shape },
		};
	}

	cancel(): void {
		this.current = 'idle';
		this.frame = null;
		this.lift = null;
		this.height = 0;
	}

	/** What to draw: the footprint, with its height once the height step has begun. */
	state(): DrawState | null {
		if (this.current === 'idle' || !this.frame) return null;
		return {
			frame: this.frame,
			footprint: this.footprint(),
			height: this.current === 'height' ? this.height : null,
		};
	}

	private footprint(): BrushFootprint {
		return orderFootprint({
			u0: this.start.u,
			v0: this.start.v,
			u1: this.end.u,
			v1: this.end.v,
		});
	}

	/** A height step starts one grid step tall, so a click without moving still builds. */
	private initialHeight(): number {
		return this.step > 0 ? this.step : 1;
	}
}
