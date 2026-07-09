/**
 * Stage configuration: types, defaults, and option parsing.
 *
 * Defines the user-facing stage config shape (`StageConfigLike`), the internal
 * `StageConfig` class, and the engine defaults applied to every stage. Its core
 * job is `parseStageOptions`, which untangles the heterogeneous `createStage(...)`
 * argument list (config objects, camera wrappers, sync/async entities) into a
 * normalized `ParsedStageOptions` that `ZylemStage` can consume directly.
 */
import { Color, Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { CameraWrapper } from '../camera/camera';
import { isBaseNode, isCameraWrapper, isConfigObject, isEntityInput } from '../core/utility/options-parser';
import { ZylemBlueColor } from '../core/utility/vector';
import type { ZylemShader } from '../graphics/material';
import type { ZylemPostEffect } from '../camera/renderer-manager';
import type { RuntimeDebugBinding, StageRuntimeAdapter } from '../runtime/zylem-stage-runtime';
import type { Vec3Components } from '../core/vector';
import type { WasmStageRuntimeOptions } from '../runtime/wasm-stage-runtime';

/** Source for the unified-Stage wasm runtime: bytes, fetch URL, or a builder. */
export type StageWasmSource =
	| ArrayBuffer
	| RequestInfo
	| URL
	| (() => Promise<ArrayBuffer | RequestInfo | URL>);

/** Authoring-side configuration for the unified-Stage wasm runtime. */
export interface StageWasmRuntimeConfig {
	/** wasm bytes (ArrayBuffer) or a URL/`fetch` input that resolves to bytes. */
	source: StageWasmSource;
	/** Forwarded to {@link WasmStageRuntime} construction. */
	options?: Omit<WasmStageRuntimeOptions, 'imports'>;
	/**
	 * Phase A feature flag for the WASM-owned-rendering migration. When `true`,
	 * the stage routes opted-in entities through a {@link StagePhysicsBridge}
	 * (WASM owns transforms) and renders them via the {@link RenderBundleManager}
	 * (WebGPU `BundleGroup`s) instead of the Rapier `ZylemWorld` +
	 * `syncRenderPoses` path. Off by default so existing stages are unaffected.
	 *
	 * REQUIRED for the behavior wasm fast path: `runtimeHandle` is only
	 * assigned by the bridge, so behavior descriptors (platformer, jumper,
	 * thruster, ...) run their Rust-side systems only when this flag is set.
	 * Without it, wasm-simulated poses would have no read-back into the
	 * Three.js scene and entities would be double-simulated by the TS Rapier
	 * world — so behaviors deliberately fall back to their TS systems.
	 */
	bundleRendering?: boolean;
}

export type StageGLTFAssetLoaderConfig = {
	meshopt?: boolean;
	ktx2TranscoderPath?: URL | string;
};

export type StageAssetLoaderConfig = {
	gltf?: StageGLTFAssetLoaderConfig;
};

/**
 * Default location (served statically) of the Basis Universal transcoder used
 * by three's `KTX2Loader` to decode `KHR_texture_basisu` textures. Stages apply
 * this automatically so demos don't need to specify it; `KTX2Loader` only
 * fetches the transcoder lazily when a KTX2 texture is actually encountered.
 */
export const DEFAULT_KTX2_TRANSCODER_PATH = '/three/basis/';

/**
 * Apply engine defaults (e.g. the KTX2 transcoder path) to a stage's GLTF
 * loader config. A stage may still override any field explicitly.
 */
export function resolveGLTFLoaderConfig(
	gltf?: StageGLTFAssetLoaderConfig,
): StageGLTFAssetLoaderConfig {
	return {
		...gltf,
		ktx2TranscoderPath: gltf?.ktx2TranscoderPath ?? DEFAULT_KTX2_TRANSCODER_PATH,
	};
}

/**
 * Stage configuration type for user-facing options.
 */
export type StageConfigLike = Partial<{
	inputs: Record<string, string[]>;
	backgroundColor: Color | string;
	backgroundImage: string | null;
	backgroundShader: ZylemShader;
	gravity: Vector3 | Vec3Components;
	variables: Record<string, any>;
	/** Physics update rate in Hz (default 60). */
	physicsRate: number;
	assetLoaders: StageAssetLoaderConfig;
	runtimeAdapter: StageRuntimeAdapter;
	/** Binds stage debug policy into wasm runtime adapters (see {@link RuntimeDebugBinding}). */
	runtimeDebugBinding?: RuntimeDebugBinding;
	/**
	 * When set, the stage instantiates a {@link WasmStageRuntime} from the given
	 * source during `load()`. Behavior descriptors that have been ported to the
	 * unified-Stage Rust runtime read this via `BehaviorSystemContext.wasmStage`.
	 */
	wasmRuntime?: StageWasmRuntimeConfig;
	/**
	 * When `false`, the engine's built-in ambient + directional lights are
	 * suppressed so the stage can be lit entirely via `createLight(...)`
	 * entities. Defaults to `true`.
	 */
	defaultLighting: boolean;
	/**
	 * Postprocessing effects applied in order between the scene pass and the
	 * display output (e.g. effects from `@zylem/shaders`). Only active for
	 * single fullscreen-camera rendering.
	 */
	postProcessingEffects: ZylemPostEffect[];
}>;

/**
 * Internal stage configuration class.
 */
export class StageConfig {
	constructor(
		public inputs: Record<string, string[]>,
		public backgroundColor: Color | string,
		public backgroundImage: string | null,
		public backgroundShader: ZylemShader | null,
		public gravity: Vector3 | Vec3Components,
		public variables: Record<string, any>,
		/** Physics update rate in Hz (default 60). */
		public physicsRate: number = 60,
		/** Optional runtime loader configuration for stage-managed assets. */
		public assetLoaders: StageAssetLoaderConfig = {},
		/** Optional stage runtime adapter for wasm-owned simulation/rendering. */
		public runtimeAdapter: StageRuntimeAdapter | undefined = undefined,
		/** Optional debug signals for wasm runtime adapters. */
		public runtimeDebugBinding: RuntimeDebugBinding | undefined = undefined,
		/** Whether the built-in ambient + directional lights are created. */
		public defaultLighting: boolean = true,
		/** Optional unified-Stage wasm runtime configuration. */
		public wasmRuntime: StageWasmRuntimeConfig | undefined = undefined,
		/** Postprocessing effects applied over the scene pass, in order. */
		public postProcessingEffects: ZylemPostEffect[] = [],
	) { }
}

/**
 * Create default stage configuration.
 */
export function createDefaultStageConfig(): StageConfig {
	return new StageConfig(
		{
			p1: ['gamepad-1', 'keyboard-1'],
			p2: ['gamepad-2', 'keyboard-2'],
		},
		ZylemBlueColor,
		null,
		null,
		new Vector3(0, 0, 0),
		{},
		60,
		{},
		undefined,
		undefined,
		true,
		undefined,
	);
}

/**
 * Result of parsing stage options.
 */
export interface ParsedStageOptions {
	config: StageConfig;
	entities: BaseNode[];
	asyncEntities: Array<BaseNode | Promise<any> | (() => BaseNode | Promise<any>)>;
	/** @deprecated Use `cameras` array instead for multi-camera support */
	camera?: CameraWrapper;
	/** All camera wrappers found in stage options */
	cameras: CameraWrapper[];
}

/**
 * Parse stage options array and resolve configuration.
 * Separates config objects, camera wrappers, and entity inputs.
 * 
 * @param options Stage options array
 * @returns Parsed stage options with resolved config, entities, and camera
 */
export function parseStageOptions(options: any[] = []): ParsedStageOptions {
	const defaults = createDefaultStageConfig();
	let config: Partial<StageConfig> = {};
	const entities: BaseNode[] = [];
	const asyncEntities: Array<BaseNode | Promise<any> | (() => BaseNode | Promise<any>)> = [];
	const cameras: CameraWrapper[] = [];

	for (const item of options) {
		if (isCameraWrapper(item)) {
			cameras.push(item);
		} else if (isBaseNode(item)) {
			entities.push(item);
		} else if (isEntityInput(item) && !isBaseNode(item)) {
			asyncEntities.push(item);
		} else if (isConfigObject(item)) {
			config = { ...config, ...item };
		}
	}

	// Merge user config with defaults
	const resolvedConfig = new StageConfig(
		config.inputs ?? defaults.inputs,
		config.backgroundColor ?? defaults.backgroundColor,
		config.backgroundImage ?? defaults.backgroundImage,
		config.backgroundShader ?? defaults.backgroundShader,
		config.gravity ?? defaults.gravity,
		config.variables ?? defaults.variables,
		config.physicsRate ?? defaults.physicsRate,
		(config as any).assetLoaders ?? defaults.assetLoaders,
		(config as any).runtimeAdapter ?? defaults.runtimeAdapter,
		(config as any).runtimeDebugBinding ?? defaults.runtimeDebugBinding,
		(config as any).defaultLighting ?? defaults.defaultLighting,
		(config as any).wasmRuntime ?? defaults.wasmRuntime,
		(config as any).postProcessingEffects ?? defaults.postProcessingEffects,
	);

	// Backward compat: first camera is the legacy `camera` field
	const camera = cameras.length > 0 ? cameras[0] : undefined;

	return { config: resolvedConfig, entities, asyncEntities, camera, cameras };
}

/**
 * Factory for authoring stage configuration objects in user code.
 * Returns a plain object that can be passed to `createStage(...)`.
 */
export function stageConfig(config: StageConfigLike): StageConfigLike {
	return { ...config };
}
