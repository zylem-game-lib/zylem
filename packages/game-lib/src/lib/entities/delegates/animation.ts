import {
	AnimationAction,
	AnimationClip,
	AnimationMixer,
	Bone,
	LoopOnce,
	LoopRepeat,
	Object3D,
} from 'three';
import { EntityAssetLoader, AssetLoaderResult } from '../../core/entity-asset-loader';

export type AnimationOptions = {
	key: string;
	pauseAtEnd?: boolean;
	pauseAtPercentage?: number;
	fadeToKey?: string;
	fadeDuration?: number;
};

type AnimationObject = {
	key?: string;
	path: string;
};

function getTrackTargetName(trackName: string): string {
	const propertyIndex = trackName.lastIndexOf('.');
	return propertyIndex >= 0 ? trackName.slice(0, propertyIndex) : trackName;
}

function shouldStripRootMotion(track: any, targetByName: Map<string, Object3D>): boolean {
	if (!track?.name?.endsWith('.position')) {
		return false;
	}

	const targetName = getTrackTargetName(track.name);
	const target = targetByName.get(targetName);
	if (target instanceof Bone) {
		return !(target.parent instanceof Bone);
	}

	return /hips\.position$/i.test(track.name) || /root\.position$/i.test(track.name);
}

/**
 * Strip the root bone's translation track on the requested axes.
 *
 * X/Z are always stripped: the platformer body / KCC owns horizontal
 * world position, so any baked horizontal root motion would slide
 * the mesh off the collider.
 *
 * Y is opt-in via `stripY` because Mixamo-style FBX rigs commonly
 * author the root bone's Y track as a *calibration* — the hips bone
 * in bind pose typically sits at the model origin, not at
 * hip-height-in-world, so the animation's first-frame Y is what
 * places the visible feet on the ground. Stripping Y removes that
 * calibration and the whole character drops. Callers should only
 * enable `stripY` for rigs whose first-frame Y is true root motion
 * (a bob), not a calibration.
 */
function stripClipRootMotion(
	clip: AnimationClip,
	targetByName: Map<string, Object3D>,
	stripY: boolean,
): AnimationClip {
	for (const track of clip.tracks) {
		if (!shouldStripRootMotion(track, targetByName)) {
			continue;
		}

		if (!track.values || track.values.length < 3) {
			continue;
		}

		const baseX = track.values[0];
		const baseY = track.values[1];
		const baseZ = track.values[2];
		for (let i = 0; i < track.values.length; i += 3) {
			track.values[i] = baseX;
			if (stripY) {
				track.values[i + 1] = baseY;
			}
			track.values[i + 2] = baseZ;
		}
	}

	return clip;
}

/**
 * Per-call options for {@link AnimationDelegate.loadAnimations}.
 */
export interface AnimationLoadOptions {
	/**
	 * If true, also lock the root bone's Y translation to its first
	 * frame value (in addition to the always-stripped X/Z axes).
	 * Eliminates the bind-pose-to-animation Y "snap" at load time on
	 * rigs whose root Y track is true bob/root motion. Defaults to
	 * false because most FBX exports use the Y track as a hip-height
	 * calibration; see {@link stripClipRootMotion}.
	 */
	stripRootMotionY?: boolean;
}

export class AnimationDelegate {
	private _mixer: AnimationMixer | null = null;
	private _actions: Record<string, AnimationAction> = {};
	private _animations: AnimationClip[] = [];
	private _currentAction: AnimationAction | null = null;

	private _pauseAtPercentage = 0;
	private _isPaused = false;
	private _queuedKey: string | null = null;
	private _fadeDuration = 0.5;

	private _currentKey: string = '';
	private _assetLoader = new EntityAssetLoader();

	constructor(private target: Object3D) { }

	async loadAnimations(
		animations: AnimationObject[],
		options: AnimationLoadOptions = {},
	): Promise<void> {
		if (!animations.length) return;

		const stripY = options.stripRootMotionY ?? false;

		const results = await Promise.all(animations.map(a => this._assetLoader.loadFile(a.path)));
		const targetByName = new Map<string, Object3D>();
		this.target.traverse((node) => {
			if (node.name) {
				targetByName.set(node.name, node);
			}
		});
		
		// Build animations list while preserving original key mapping
		// Filter to only successful loads and pair with their original keys
		const loadedAnimations: { key: string; clip: AnimationClip }[] = [];
		results.forEach((result, i) => {
			if (result.animation) {
				loadedAnimations.push({
					key: animations[i].key || i.toString(),
					clip: stripClipRootMotion(result.animation, targetByName, stripY),
				});
			}
		});

		if (!loadedAnimations.length) return;

		this._animations = loadedAnimations.map(a => a.clip);
		this._mixer = new AnimationMixer(this.target);
		
		// Create actions with correct key mapping
		loadedAnimations.forEach(({ key, clip }) => {
			this._actions[key] = this._mixer!.clipAction(clip);
		});

		this.playAnimation({ key: loadedAnimations[0].key });
	}

	update(delta: number): void {
		if (!this._mixer || !this._currentAction) return;

		this._mixer.update(delta);

		const pauseAtTime = this._currentAction.getClip().duration * (this._pauseAtPercentage / 100);
		if (
			!this._isPaused &&
			this._pauseAtPercentage > 0 &&
			this._currentAction.time >= pauseAtTime
		) {
			this._currentAction.time = pauseAtTime;
			this._currentAction.paused = true;
			this._isPaused = true;

			if (this._queuedKey !== null) {
				const next = this._actions[this._queuedKey];
				next.reset().play();
				this._currentAction.crossFadeTo(next, this._fadeDuration, false);
				this._currentAction = next;
				this._currentKey = this._queuedKey;
				this._queuedKey = null;
			}
		}
	}

	playAnimation(opts: AnimationOptions): void {
		if (!this._mixer) return;
		const { key, pauseAtPercentage = 0, pauseAtEnd = false, fadeToKey, fadeDuration = 0.5 } = opts;
		if (key === this._currentKey) return;

		// Check if the new action exists BEFORE stopping the current animation
		// This prevents T-posing when an animation key doesn't exist
		const action = this._actions[key];
		if (!action) return;

		// Two keys pointing at the same AnimationClip share a single
		// mixer-cached AnimationAction. Resetting/cross-fading it into
		// itself restarts the clip from time 0 and re-applies any baked
		// root-bone Y track, causing a visible "sink into ground" snap on
		// every switch. Treat these transitions as a no-op and just
		// rename the current key so future `key === _currentKey` checks
		// stay consistent.
		if (action === this._currentAction) {
			this._currentKey = key;
			return;
		}

		this._queuedKey = fadeToKey || null;
		this._fadeDuration = fadeDuration;

		this._pauseAtPercentage = pauseAtEnd ? 100 : pauseAtPercentage;
		this._isPaused = false;

		const prev = this._currentAction;
		// Don't stop prev here - crossFadeTo needs it playing for smooth transition

		if (this._pauseAtPercentage > 0) {
			action.setLoop(LoopOnce, Infinity);
			action.clampWhenFinished = true;
		} else {
			action.setLoop(LoopRepeat, Infinity);
			action.clampWhenFinished = false;
		}

		// Start the new action
		action.reset().play();

		// Crossfade from previous if it exists
		if (prev) {
			prev.crossFadeTo(action, fadeDuration, false);
		}

		this._currentAction = action;
		this._currentKey = key;
	}

	/**
	 * Dispose of all animation resources
	 */
	dispose(): void {
		// Stop all actions
		Object.values(this._actions).forEach(action => {
			action.stop();
		});

		// Stop and uncache mixer
		if (this._mixer) {
			this._mixer.stopAllAction();
			this._mixer.uncacheRoot(this.target);
			this._mixer = null;
		}

		// Clear references
		this._actions = {};
		this._animations = [];
		this._currentAction = null;
		this._currentKey = '';
	}

	get currentAnimationKey() { return this._currentKey; }
	get animations() { return this._animations; }
}
