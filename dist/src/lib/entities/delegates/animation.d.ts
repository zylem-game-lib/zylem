import { AnimationClip, Object3D } from 'three';
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
export declare class AnimationDelegate {
    private target;
    private _mixer;
    private _actions;
    private _animations;
    private _currentAction;
    private _pauseAtPercentage;
    private _isPaused;
    private _queuedKey;
    private _fadeDuration;
    private _currentKey;
    private _assetLoader;
    constructor(target: Object3D);
    loadAnimations(animations: AnimationObject[]): Promise<void>;
    update(delta: number): void;
    playAnimation(opts: AnimationOptions): void;
    get currentAnimationKey(): string;
    get animations(): AnimationClip[];
}
export {};
//# sourceMappingURL=animation.d.ts.map