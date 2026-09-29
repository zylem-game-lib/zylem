import { MathUtils, Vector3 } from 'three';
import type { CameraBehavior, CameraContext, CameraPose } from '../types';
import { clonePose } from '../smoothing';

/**
 * Pointer for edge scrolling.
 * `x`/`y` are 0..1 from the top-left, unless `centered` is set, in which case
 * they are −1..1 with −1 at the left and top (the shape of `inputs.p1.pointer.centerX/Y`).
 */
export interface StrategyPointer {
	x: number;
	y: number;
	centered?: boolean;
}

/** What {@link StrategyPanOptions.sampleInput} returns each frame. */
export interface StrategyPanInput {
	pointer?: StrategyPointer;
	/** Stick or arrow intent, −1..1. +x is screen right, +y is screen up. */
	pan?: { x: number; y: number };
}

export interface StrategyPanOptions {
	/**
	 * Read pointer and pan intent. Kept as a closure so the behavior does not
	 * import InputManager. Typical source: `inputs.p1.pointer` and directions.
	 */
	sampleInput?: () => StrategyPanInput;
	/** Fraction of the viewport that counts as an edge. Default 0.08. */
	edgeMargin?: number;
	/** World units per second at a flush edge. Default 12. */
	edgeSpeed?: number;
	/** World units per second at full stick deflection. Default 16. */
	panSpeed?: number;
	/** Target key to ease toward. Null follows nothing. */
	followKey?: string | null;
	/** Interpolation factor while following, per 60Hz frame. Default 0.12. */
	followLerp?: number;
	/**
	 * A manual pan or edge scroll drops follow until {@link StrategyPanBehavior.setFollowKey}.
	 * Default true.
	 */
	breakFollowOnPan?: boolean;
}

export interface StrategyPanBehavior extends CameraBehavior {
	/** Follow `key`, or pass null to pan freely. Clears a manual-pan suspension. */
	setFollowKey(key: string | null): void;
}

/**
 * StarCraft-style pan on the XZ plane.
 *
 * The perspective (top-down or isometric) owns the angle. This behavior only
 * slides the framed point: edge scroll, arrow or stick pan, and an optional
 * follow target. Screen up maps to world −Z, which matches a top-down camera
 * whose up vector is −Z.
 */
export function createStrategyPan(options?: StrategyPanOptions): StrategyPanBehavior {
	const sampleInput = options?.sampleInput ?? ((): StrategyPanInput => ({}));
	const edgeMargin = MathUtils.clamp(options?.edgeMargin ?? 0.08, 0, 0.5);
	const edgeSpeed = options?.edgeSpeed ?? 12;
	const panSpeed = options?.panSpeed ?? 16;
	const followLerp = options?.followLerp ?? 0.12;
	const breakFollowOnPan = options?.breakFollowOnPan ?? true;

	let followKey: string | null = options?.followKey ?? null;
	let followSuspended = false;
	let focus: Vector3 | null = null;

	const reset = () => {
		focus = null;
		followSuspended = false;
	};

	return {
		priority: 0,
		enabled: true,
		onAttach: reset,
		onDetach: reset,

		setFollowKey(key: string | null) {
			followKey = key;
			followSuspended = false;
		},

		update(ctx: CameraContext, pose: CameraPose): CameraPose {
			const framed = pose.lookAt ?? pose.position;
			const focusPoint = focus ?? framed.clone();
			focus = focusPoint;

			const input = sampleInput() ?? {};
			const panX = input.pan?.x ?? 0;
			const panY = input.pan?.y ?? 0;
			const edge = edgeIntent(input.pointer, edgeMargin);
			const manual = Math.abs(panX) > 0.01
				|| Math.abs(panY) > 0.01
				|| edge.x !== 0
				|| edge.y !== 0;

			if (manual && breakFollowOnPan) followSuspended = true;

			const follow = !followSuspended && followKey ? ctx.targets[followKey] : undefined;
			if (follow) {
				const t = frameLerp(followLerp, ctx.dt);
				focusPoint.x = MathUtils.lerp(focusPoint.x, follow.position.x, t);
				focusPoint.z = MathUtils.lerp(focusPoint.z, follow.position.z, t);
			} else {
				// +pan.y is screen up, which is world −Z for a top-down camera.
				focusPoint.x += (panX * panSpeed + edge.x * edgeSpeed) * ctx.dt;
				focusPoint.z += (-panY * panSpeed + edge.y * edgeSpeed) * ctx.dt;
			}

			const result = clonePose(pose);
			const dx = focusPoint.x - framed.x;
			const dz = focusPoint.z - framed.z;
			result.position.x += dx;
			result.position.z += dz;
			if (result.lookAt) {
				result.lookAt.x += dx;
				result.lookAt.z += dz;
			}
			return result;
		},
	};
}

/**
 * Edge intent in −1..1.
 * `x` is screen right (+1) / left (−1). `y` is screen down (+1) / up (−1),
 * so the caller maps screen-down onto +Z.
 */
function edgeIntent(
	pointer: StrategyPointer | undefined,
	margin: number,
): { x: number; y: number } {
	if (!pointer || margin <= 0) return { x: 0, y: 0 };
	const x = pointer.centered ? (pointer.x + 1) / 2 : pointer.x;
	const y = pointer.centered ? (pointer.y + 1) / 2 : pointer.y;
	return {
		x: edgeAxis(x, margin),
		y: edgeAxis(y, margin),
	};
}

/** −1 at the low edge, +1 at the high edge, 0 in the middle. */
function edgeAxis(unit: number, margin: number): number {
	if (unit < margin) return -((margin - unit) / margin);
	if (unit > 1 - margin) return (unit - (1 - margin)) / margin;
	return 0;
}

function frameLerp(factor: number, dt: number): number {
	const damping = MathUtils.clamp(factor, 0, 1);
	return 1 - Math.pow(1 - damping, dt * 60);
}
