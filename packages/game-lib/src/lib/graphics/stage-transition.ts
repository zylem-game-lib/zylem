/**
 * Stage transition contracts and defaults.
 *
 * A stage transition blends the outgoing stage's frame into the incoming
 * stage's frame during `game.nextStage({ transition })` (and
 * `previousStage` / `reset`). The blend itself is a `ZylemTransitionShader`
 * — structurally compatible with the type of the same name in
 * `@zylem/shaders`, so fancy transitions (`createStageTransition`) plug in
 * directly without game-lib depending on that package. When no shader is
 * provided, a plain crossfade is used.
 */
import { clamp, mix } from 'three/tsl';

/**
 * A stage transition shader: receives the outgoing frame node (`fromNode`),
 * the incoming frame node (`toNode`), and a float `progress` uniform node
 * (0 = fully outgoing, 1 = fully incoming); returns the blended color node.
 *
 * Structurally compatible with `ZylemTransitionShader` from `@zylem/shaders`.
 */
export type ZylemTransitionShader = (ctx: {
	fromNode: any;
	toNode: any;
	progress: any;
}) => any;

/** Named easing curves for transition progress. */
export type StageTransitionEasing = 'linear' | 'easeInOut';

/**
 * Configuration for a stage transition, passed as
 * `game.nextStage({ transition: { ... } })`. All fields are optional;
 * `{ transition: {} }` yields a 0.8s eased crossfade.
 */
export interface StageTransitionConfig {
	/** Transition length in seconds (default `0.8`). */
	duration?: number;
	/**
	 * The blend shader (e.g. `createStageTransition({ pattern: 'noise' }).shader`
	 * from `@zylem/shaders`, or a `ZylemStageTransition` object directly).
	 * Defaults to a plain crossfade.
	 */
	shader?: ZylemTransitionShader | { shader: ZylemTransitionShader };
	/** Easing applied to progress (default `'easeInOut'`). */
	easing?: StageTransitionEasing | ((t: number) => number);
	/** Invoked once the transition completes. */
	onComplete?: () => void;
}

/** `StageTransitionConfig` with all defaults applied. */
export interface ResolvedStageTransition {
	duration: number;
	shader: ZylemTransitionShader;
	easing: (t: number) => number;
	onComplete?: () => void;
}

/** Default blend: plain crossfade between the two frames. */
export const crossfadeTransitionShader: ZylemTransitionShader = ({
	fromNode,
	toNode,
	progress,
}) => mix(fromNode, toNode, clamp(progress, 0.0, 1.0));

function easeInOut(t: number): number {
	return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

function resolveEasing(
	easing: StageTransitionConfig['easing'],
): (t: number) => number {
	if (typeof easing === 'function') return easing;
	if (easing === 'linear') return (t) => t;
	return easeInOut;
}

/** Apply defaults to a user-provided transition config. */
export function resolveStageTransition(
	config: StageTransitionConfig = {},
): ResolvedStageTransition {
	const shaderOption = config.shader;
	const shader =
		typeof shaderOption === 'function'
			? shaderOption
			: shaderOption?.shader ?? crossfadeTransitionShader;
	return {
		duration: Math.max(0.01, config.duration ?? 0.8),
		shader,
		easing: resolveEasing(config.easing),
		onComplete: config.onComplete,
	};
}
