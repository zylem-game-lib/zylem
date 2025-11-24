import {
	AnimationAction,
	AnimationClip,
	AnimationMixer,
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

	async loadAnimations(animations: AnimationObject[]): Promise<void> {
		if (!animations.length) return;

		const results = await Promise.all(animations.map(a => this._assetLoader.loadFile(a.path)));
		this._animations = results
			.filter((r): r is AssetLoaderResult => !!r.animation)
			.map(r => r.animation!);

		if (!this._animations.length) return;

		this._mixer = new AnimationMixer(this.target);
		this._animations.forEach((clip, i) => {
			const key = animations[i].key || i.toString();
			this._actions[key] = this._mixer!.clipAction(clip);
		});

		this.playAnimation({ key: Object.keys(this._actions)[0] });
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

		this._queuedKey = fadeToKey || null;
		this._fadeDuration = fadeDuration;

		this._pauseAtPercentage = pauseAtEnd ? 100 : pauseAtPercentage;
		this._isPaused = false;

		const prev = this._currentAction;
		if (prev) prev.stop();

		const action = this._actions[key];
		if (!action) return;

		if (this._pauseAtPercentage > 0) {
			action.setLoop(LoopOnce, Infinity);
			action.clampWhenFinished = true;
		} else {
			action.setLoop(LoopRepeat, Infinity);
			action.clampWhenFinished = false;
		}

		if (prev) {
			prev.crossFadeTo(action, fadeDuration, false);
		}
		action.reset().play();

		this._currentAction = action;
		this._currentKey = key;
	}

	get currentAnimationKey() { return this._currentKey; }
	get animations() { return this._animations; }
}
