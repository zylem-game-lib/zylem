/**
 * Shared shader contracts for @zylem/shaders.
 *
 * `ZylemTSLShader` is structurally identical to the type of the same name in
 * `@zylem/game-lib/graphics`, so shaders from this package can be passed
 * directly to game-lib (`material: { shader }`, `backgroundShader`,
 * `createNodeMaterialFromTSL()`) without this package depending on game-lib.
 */
import type { Blending, Side } from 'three';

/**
 * TSL shader object (WebGPU). `colorNode` is a TSL node producing the
 * fragment color.
 */
export type ZylemTSLShader = {
	colorNode: any;
	/**
	 * Optional TSL node overriding vertex positions (e.g. wave displacement).
	 * Requires geometry with enough vertices to displace (e.g. a subdivided
	 * plane).
	 */
	positionNode?: any;
	/** Optional TSL node overriding the surface normal. */
	normalNode?: any;
	transparent?: boolean;
	/** Optional three.js blending mode (e.g. `AdditiveBlending`). */
	blending?: Blending;
	/** Optional three.js render side (e.g. `DoubleSide`). */
	side?: Side;
	/** Optional depth test override (e.g. `false` for overlay holograms). */
	depthTest?: boolean;
};

/**
 * A named bag of TSL `uniform()` nodes. Mutate `uniforms.<name>.value` at
 * runtime to animate or tweak a shader parameter.
 */
export type ZylemShaderUniforms = Record<string, { value: any }>;

/**
 * A consumable shader plus its runtime-tweakable uniforms. Structurally a
 * `ZylemTSLShader`, so it can be passed anywhere game-lib accepts one.
 */
export type ZylemParameterizedShader<
	U extends ZylemShaderUniforms = ZylemShaderUniforms,
> = ZylemTSLShader & {
	uniforms: U;
};

/**
 * A postprocessing effect: receives the current pipeline node (initially the
 * scene pass) and returns the transformed node. `ctx.scenePass` is the
 * original scene `PassNode` for effects that need extra channels (depth,
 * velocity, ...). `ctx.scene`/`ctx.camera` are the rendered scene and
 * camera, for effects that build their own scene pass (e.g. pixelation,
 * retro). Such pass-replacing effects should be first in the effect chain —
 * the default scene pass simply goes unused.
 */
export type ZylemPostEffect = (
	inputNode: any,
	ctx: { scenePass: any; scene: any; camera: any },
) => any;

/**
 * A stage transition shader: blends the outgoing and incoming stage frames
 * during a stage switch. Receives the outgoing frame node (`fromNode`), the
 * incoming frame node (`toNode`), and a float `progress` uniform node
 * (0 = fully outgoing, 1 = fully incoming); returns the blended color node.
 *
 * Structurally compatible with `ZylemTransitionShader` in
 * `@zylem/game-lib`, so transitions from this package plug directly into
 * `game.nextStage({ transition: { shader } })`.
 */
export type ZylemTransitionShader = (ctx: {
	fromNode: any;
	toNode: any;
	progress: any;
}) => any;
