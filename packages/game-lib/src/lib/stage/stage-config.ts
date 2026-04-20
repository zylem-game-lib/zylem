import { Color, Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { CameraWrapper } from '../camera/camera';
import { isBaseNode, isCameraWrapper, isConfigObject, isEntityInput } from '../core/utility/options-parser';
import { ZylemBlueColor } from '../core/utility/vector';
import type { ZylemShader } from '../graphics/material';
import type { RuntimeDebugBinding, StageRuntimeAdapter } from '../runtime/zylem-stage-runtime';

export type StageGLTFAssetLoaderConfig = {
	meshopt?: boolean;
	ktx2TranscoderPath?: URL | string;
};

export type StageAssetLoaderConfig = {
	gltf?: StageGLTFAssetLoaderConfig;
};

/**
 * Stage configuration type for user-facing options.
 */
export type StageConfigLike = Partial<{
	inputs: Record<string, string[]>;
	backgroundColor: Color | string;
	backgroundImage: string | null;
	backgroundShader: ZylemShader;
	gravity: Vector3;
	variables: Record<string, any>;
	/** Physics update rate in Hz (default 60). */
	physicsRate: number;
	/** Run physics in a Web Worker (default false). */
	usePhysicsWorker: boolean;
	/**
	 * URL to the physics worker script. Required when `usePhysicsWorker` is true.
	 * In a Vite app, use:
	 * ```ts
	 * physicsWorkerUrl: new URL('@zylem/game-lib/dist/physics-worker.js', import.meta.url)
	 * ```
	 */
	physicsWorkerUrl: URL | string;
	assetLoaders: StageAssetLoaderConfig;
	runtimeAdapter: StageRuntimeAdapter;
	/** Binds stage debug policy into wasm runtime adapters (see {@link RuntimeDebugBinding}). */
	runtimeDebugBinding?: RuntimeDebugBinding;
	/**
	 * When `false`, the engine's built-in ambient + directional lights are
	 * suppressed so the stage can be lit entirely via `createLight(...)`
	 * entities. Defaults to `true`.
	 */
	defaultLighting: boolean;
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
		public gravity: Vector3,
		public variables: Record<string, any>,
		/** Physics update rate in Hz (default 60). */
		public physicsRate: number = 60,
		/** Run physics in a Web Worker (default false). */
		public usePhysicsWorker: boolean = false,
		/** URL to the physics worker script. Required when usePhysicsWorker is true. */
		public physicsWorkerUrl: URL | string | undefined = undefined,
		/** Optional runtime loader configuration for stage-managed assets. */
		public assetLoaders: StageAssetLoaderConfig = {},
		/** Optional stage runtime adapter for wasm-owned simulation/rendering. */
		public runtimeAdapter: StageRuntimeAdapter | undefined = undefined,
		/** Optional debug signals for wasm runtime adapters. */
		public runtimeDebugBinding: RuntimeDebugBinding | undefined = undefined,
		/** Whether the built-in ambient + directional lights are created. */
		public defaultLighting: boolean = true,
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
		false,
		undefined,
		{},
		undefined,
		undefined,
		true,
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
		config.usePhysicsWorker ?? defaults.usePhysicsWorker,
		(config as any).physicsWorkerUrl ?? defaults.physicsWorkerUrl,
		(config as any).assetLoaders ?? defaults.assetLoaders,
		(config as any).runtimeAdapter ?? defaults.runtimeAdapter,
		(config as any).runtimeDebugBinding ?? defaults.runtimeDebugBinding,
		(config as any).defaultLighting ?? defaults.defaultLighting,
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
