import {
	Color,
	type ColorRepresentation,
	Fog,
	FogExp2,
	Group,
	type Scene,
} from 'three';

import type { CleanupContext, UpdateContext } from '../core/base-node-life-cycle';
import { FogMaterialPatcher, type FogUniformValues } from '../graphics/fog/fog-patcher';
import { GameEntity, type GameEntityOptions } from './entity';

/** Three.js fog model. Linear uses start/end; exp² uses density. */
export type ZylemFogType = 'linear' | 'exp2';

/** Optional vertical falloff (a.k.a. ground/height fog). */
export interface ZylemFogHeightOptions {
	/** Master toggle. Defaults to `false`. */
	enabled?: boolean;
	/** World-space Y at which fog stops attenuating (becomes fully clear). */
	level?: number;
	/**
	 * Density falloff per world-unit beneath `level`. Higher values produce
	 * sharper transitions; values <= 0 disable the height contribution.
	 */
	falloff?: number;
}

/**
 * Optional 3D animated noise applied to fog density.
 *
 * Specifying a `noise` block enables noise modulation; omit it to disable.
 */
export interface ZylemFogNoiseOptions {
	/** Spatial scale of the noise; lower = larger pockets of clearer / denser fog. */
	scale?: number;
	/** Modulation strength in `[0, 1]`. 0 = no effect, 1 = full ±100% modulation. */
	strength?: number;
	/** Animation speed (world-units per second of advect). */
	speed?: number;
}

export interface ZylemFogOptions {
	/** Fog model. Default `'linear'`. */
	type?: ZylemFogType;
	/** Fog colour. Default `'#9aa3ad'` (neutral grey). */
	color?: ColorRepresentation;
	/** Exp² density coefficient. Only used when `type === 'exp2'`. Default `0.015`. */
	density?: number;
	/** Linear-fog start distance. Only used when `type === 'linear'`. Default `10`. */
	start?: number;
	/** Linear-fog end distance. Only used when `type === 'linear'`. Default `250`. */
	end?: number;
	/** Optional vertical falloff. Disabled by default. */
	height?: ZylemFogHeightOptions;
	/** Optional 3D animated noise. Disabled by default. */
	noise?: ZylemFogNoiseOptions;
	/** Display name (mostly for debug overlays). */
	name?: string;
}

export const FOG_TYPE = Symbol('Fog');

type ZylemFogGameOptions = ZylemFogOptions & GameEntityOptions;

const DEFAULT_COLOR: ColorRepresentation = '#9aa3ad';
const DEFAULT_DENSITY = 0.015;
const DEFAULT_START = 10;
const DEFAULT_END = 250;
const DEFAULT_HEIGHT_LEVEL = 5;
const DEFAULT_HEIGHT_FALLOFF = 0.2;
const DEFAULT_NOISE_SCALE = 0.05;
const DEFAULT_NOISE_STRENGTH = 0.15;
const DEFAULT_NOISE_SPEED = 0.1;

/**
 * `GameEntity` that owns a Three.js fog instance plus optional height /
 * noise modulators.
 *
 * Why not just expose `scene.fog` directly? Modelling fog as an entity:
 * - Keeps stage authoring uniform with lights, particles, etc.
 * - Gives a natural hook for cleanup when the stage tears down.
 * - Allows multiple stages / loads to swap fog cleanly via the existing
 *   entity lifecycle, including the wasm-runtime-managed stages.
 *
 * The entity attaches a tiny empty {@link Group} to the scene so that the
 * standard {@link GameEntity#_cleanup} pathway removes it from its parent
 * during destroy; the actual fog effect is wired up via
 * {@link attachToScene} which is invoked by `ZylemScene.addEntityGroup`.
 */
export class ZylemFog extends GameEntity<ZylemFogGameOptions> {
	static type = FOG_TYPE;

	/** The underlying Three.js fog instance. Populated in `create()`. */
	public threeFog: Fog | FogExp2 | null = null;

	/** Scene the fog is currently attached to (null when detached). */
	private attachedScene: Scene | null = null;

	private readonly patcher: FogMaterialPatcher;
	private patcherEnabled: boolean;

	constructor(options: ZylemFogOptions = {}) {
		super();
		this.options = { ...options } as ZylemFogGameOptions;

		const initialUniforms = this.resolveUniformValues(this.options);
		this.patcher = new FogMaterialPatcher(initialUniforms);
		this.patcherEnabled = isPatcherNeeded(this.options);
	}

	public override create(): this {
		super.create();
		this.threeFog = buildThreeFog(this.options);
		// Empty group placeholder so the standard cleanup path can remove
		// the entity from the scene graph. Fog itself is not an Object3D.
		this.group = new Group();
		this.group.name = this.name ? `Fog:${this.name}` : 'Fog';
		return this;
	}

	/**
	 * Hook into the host scene: stamp `scene.fog` and -- if height / noise
	 * are enabled -- start patching the scene's materials.
	 *
	 * Called by `ZylemScene.addEntityGroup` once it has identified this
	 * entity as a fog entity.
	 *
	 * @param scene The Three.js scene that will host the fog.
	 */
	public attachToScene(scene: Scene): void {
		if (!this.threeFog) return;
		this.attachedScene = scene;
		scene.fog = this.threeFog;
		if (this.patcherEnabled) {
			this.patcher.scan(scene);
		}
	}

	/**
	 * Per-frame tick. The base `GameEntity._update` is invoked first (so
	 * user `onUpdate` callbacks still run), then the patcher advances its
	 * time uniform and picks up any newly-spawned materials.
	 */
	public override _update(params: UpdateContext<this>): void {
		super._update(params);
		if (!this.attachedScene || !this.patcherEnabled) return;
		this.patcher.tick(params.delta);
		// Re-scan every frame to pick up any materials that were added
		// after the fog was attached. The marker-based skip keeps repeat
		// scans essentially free.
		this.patcher.scan(this.attachedScene);
	}

	protected override _cleanup(params: CleanupContext<this>): void {
		this.patcher.unpatchAll();
		if (this.attachedScene && this.attachedScene.fog === this.threeFog) {
			this.attachedScene.fog = null;
		}
		this.attachedScene = null;
		this.threeFog = null;
		super._cleanup(params);
	}

	private resolveUniformValues(options: ZylemFogOptions): FogUniformValues {
		const height = options.height;
		const noise = options.noise;
		return {
			time: 0,
			heightEnabled: height?.enabled ? 1 : 0,
			heightLevel: height?.level ?? DEFAULT_HEIGHT_LEVEL,
			heightFalloff: height?.falloff ?? DEFAULT_HEIGHT_FALLOFF,
			noiseEnabled: noise ? 1 : 0,
			noiseScale: noise?.scale ?? DEFAULT_NOISE_SCALE,
			noiseStrength: noise?.strength ?? DEFAULT_NOISE_STRENGTH,
			noiseSpeed: noise?.speed ?? DEFAULT_NOISE_SPEED,
		};
	}
}

function buildThreeFog(options: ZylemFogOptions): Fog | FogExp2 {
	const color = new Color(options.color ?? DEFAULT_COLOR);
	if ((options.type ?? 'linear') === 'exp2') {
		return new FogExp2(color, options.density ?? DEFAULT_DENSITY);
	}
	return new Fog(
		color,
		options.start ?? DEFAULT_START,
		options.end ?? DEFAULT_END,
	);
}

function isPatcherNeeded(options: ZylemFogOptions): boolean {
	const heightOn = Boolean(options.height?.enabled);
	const noiseOn = Boolean(options.noise);
	return heightOn || noiseOn;
}

/**
 * Create a fog entity that can be added to a stage with `stage.add(...)`.
 *
 * @example
 * Default greyish fog -- no arguments needed:
 * ```ts
 * stage.add(createFog());
 * ```
 *
 * @example
 * Exp² fog with animated, ground-hugging haze:
 * ```ts
 * stage.add(createFog({
 *   type: 'exp2',
 *   color: '#aabbcc',
 *   density: 0.015,
 *   height: { enabled: true, level: 5, falloff: 0.2 },
 *   noise: { scale: 0.05, strength: 0.15, speed: 0.1 },
 * }));
 * ```
 */
export function createFog(options: ZylemFogOptions = {}): ZylemFog {
	return new ZylemFog(options);
}
