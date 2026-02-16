import type {
	CameraPerspective,
	CameraBehavior,
	CameraAction,
	CameraContext,
	CameraPose,
	CameraPipelineState,
} from './types';
import { defaultPose, clonePose, applyDelta, smoothPose } from './smoothing';

/**
 * CameraPipeline runs a deterministic per-frame update:
 *
 *   Perspective -> Behaviors (priority) -> Actions (deltas) -> Smoothing -> finalPose
 *
 * It separates "desired pose" from "final pose". Everything writes to desired;
 * only smoothing converts desired into the final committed pose.
 */
export class CameraPipeline {
	/** Active perspective (exactly one at a time). */
	perspective: CameraPerspective | null = null;

	/** Keyed behaviors, sorted by priority each frame. */
	private behaviors: Map<string, CameraBehavior> = new Map();

	/** Active transient actions. Expired actions are auto-removed. */
	private actions: CameraAction[] = [];

	/** The desired pose after perspective + behaviors + actions. */
	private _desiredPose: CameraPose = defaultPose();

	/** The smoothed final pose committed to the Three.js camera. */
	private _finalPose: CameraPose = defaultPose();

	/** Whether the pipeline has run at least once (prevents lerp from origin on first frame). */
	private _initialized = false;

	/** Smoothing factor: 0 = no movement, 1 = instant snap. */
	damping = 0.15;

	constructor(perspective?: CameraPerspective) {
		if (perspective) {
			this.perspective = perspective;
			if (perspective.defaults?.damping != null) {
				this.damping = perspective.defaults.damping;
			}
		}
	}

	/**
	 * Run the full pipeline for one frame.
	 * Returns the final pose that should be committed to the Three.js camera.
	 */
	run(ctx: CameraContext): CameraPose {
		// 1. Base pose from perspective
		let pose: CameraPose = this.perspective
			? this.perspective.getBasePose(ctx)
			: defaultPose();

		// 2. Behaviors in priority order (low -> high)
		const sorted = this.getSortedBehaviors();
		for (const behavior of sorted) {
			if (behavior.enabled === false) continue;
			pose = behavior.update(ctx, pose);
		}

		// Store desired pose (before actions and smoothing)
		this._desiredPose = clonePose(pose);

		// 3. Actions apply additive deltas; expired ones are removed
		for (let i = this.actions.length - 1; i >= 0; i--) {
			const action = this.actions[i];
			const delta = action.update(ctx);
			pose = applyDelta(pose, delta);
			if (action.isDone(ctx)) {
				this.actions.splice(i, 1);
			}
		}

		// 4. Smoothing: interpolate from previous final pose toward computed pose
		if (!this._initialized) {
			this._finalPose = clonePose(pose);
			this._initialized = true;
		} else {
			this._finalPose = smoothPose(this._finalPose, pose, this.damping, ctx.dt);
		}

		return this._finalPose;
	}

	// ─── Behavior management ───────────────────────────────────────────────

	/**
	 * Add or replace a behavior by key (idempotent).
	 * Calls onDetach on the old behavior and onAttach on the new one.
	 */
	addBehavior(key: string, behavior: CameraBehavior, ctx?: CameraContext): void {
		const existing = this.behaviors.get(key);
		if (existing?.onDetach && ctx) {
			existing.onDetach(ctx);
		}
		this.behaviors.set(key, behavior);
		if (behavior.onAttach && ctx) {
			behavior.onAttach(ctx);
		}
	}

	/**
	 * Remove a behavior by key. Calls onDetach if a context is provided.
	 */
	removeBehavior(key: string, ctx?: CameraContext): boolean {
		const existing = this.behaviors.get(key);
		if (!existing) return false;
		if (existing.onDetach && ctx) {
			existing.onDetach(ctx);
		}
		return this.behaviors.delete(key);
	}

	/**
	 * Check whether a behavior with the given key exists.
	 */
	hasBehavior(key: string): boolean {
		return this.behaviors.has(key);
	}

	// ─── Action management ─────────────────────────────────────────────────

	/**
	 * Add a transient action. Actions self-expire via isDone().
	 */
	addAction(action: CameraAction): void {
		this.actions.push(action);
	}

	// ─── State inspection ──────────────────────────────────────────────────

	/**
	 * Return a debug snapshot of the pipeline state.
	 */
	getState(): CameraPipelineState {
		return {
			perspectiveId: this.perspective?.id ?? null,
			desiredPose: this._desiredPose ? clonePose(this._desiredPose) : null,
			finalPose: this._finalPose ? clonePose(this._finalPose) : null,
			activeBehaviors: Array.from(this.behaviors.keys()),
			activeActionCount: this.actions.length,
		};
	}

	/**
	 * Set a new perspective. Resets the pipeline initialization flag so the
	 * first frame with the new perspective snaps instead of lerping from the old pose.
	 */
	setPerspective(perspective: CameraPerspective): void {
		this.perspective = perspective;
		this._initialized = false;
		if (perspective.defaults?.damping != null) {
			this.damping = perspective.defaults.damping;
		}
	}

	// ─── Internal helpers ──────────────────────────────────────────────────

	private getSortedBehaviors(): CameraBehavior[] {
		return Array.from(this.behaviors.values()).sort(
			(a, b) => (a.priority ?? 0) - (b.priority ?? 0)
		);
	}
}
