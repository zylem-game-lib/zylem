import {
	AmbientLight,
	type ColorRepresentation,
	DirectionalLight,
	Group,
	HemisphereLight,
	type Light,
	Object3D,
	PointLight,
	SpotLight,
} from 'three';

import type { CleanupContext } from '../core/base-node-life-cycle';
import { GameEntity, type GameEntityOptions } from './entity';

type Vec3 = { x: number; y: number; z: number };

/**
 * Shadow-camera / shadow-map options shared across the light types that
 * support casting shadows (directional, point, spot).
 *
 * The orthographic frustum fields (`left` / `right` / `top` / `bottom`) only
 * apply to directional lights -- TypeScript enforces this via the tagged
 * union below -- but we keep a single shape for ergonomic reuse.
 */
export interface LightShadowOptions {
	/** Shadow map resolution (square). Defaults: directional 2048, point/spot 1024. */
	mapSize?: number;
	/** Shadow camera near plane. Default 0.1. */
	near?: number;
	/** Shadow camera far plane. Default 500. */
	far?: number;
	/** Shadow bias (negative values can help acne). */
	bias?: number;
	/** PCF blur radius. */
	radius?: number;
	/** Directional-only: orthographic frustum left bound. Default -100. */
	left?: number;
	/** Directional-only: orthographic frustum right bound. Default 100. */
	right?: number;
	/** Directional-only: orthographic frustum top bound. Default 100. */
	top?: number;
	/** Directional-only: orthographic frustum bottom bound. Default -100. */
	bottom?: number;
}

interface BaseLightOptions {
	name?: string;
	/** Light colour. Default `#ffffff`. */
	color?: ColorRepresentation;
	/** Scalar intensity multiplier. Default `1`. */
	intensity?: number;
	/** World-space position. Default `{0,0,0}`. Not meaningful for ambient. */
	position?: Vec3;
}

export interface AmbientLightOptions extends BaseLightOptions {
	type: 'ambient';
}

export interface HemisphereLightOptions extends BaseLightOptions {
	type: 'hemisphere';
	/** Sky colour. Falls back to `color` if omitted, else `#ffffff`. */
	skyColor?: ColorRepresentation;
	/** Ground colour. Default `#000000`. */
	groundColor?: ColorRepresentation;
}

export interface DirectionalLightOptions extends BaseLightOptions {
	type: 'directional';
	/** World-space point the light aims at. Default origin. */
	target?: Vec3;
	/** Enable shadow casting. Default `false`. */
	castShadow?: boolean;
	/** Shadow camera / map tuning. */
	shadow?: LightShadowOptions;
}

export interface PointLightOptions extends BaseLightOptions {
	type: 'point';
	/** Maximum range of the light (0 = infinite). */
	distance?: number;
	/** Physical falloff exponent. Default `2` (three.js default). */
	decay?: number;
	castShadow?: boolean;
	/** Shadow options (directional-only frustum fields are ignored). */
	shadow?: Omit<LightShadowOptions, 'left' | 'right' | 'top' | 'bottom'>;
}

export interface SpotLightOptions extends BaseLightOptions {
	type: 'spot';
	/** World-space point the cone aims at. Default origin. */
	target?: Vec3;
	/** Maximum range of the light (0 = infinite). */
	distance?: number;
	/** Physical falloff exponent. Default `2`. */
	decay?: number;
	/** Cone angle in radians. Default `Math.PI / 3`. */
	angle?: number;
	/** Penumbra softness in `[0, 1]`. Default `0`. */
	penumbra?: number;
	castShadow?: boolean;
	/** Shadow options (directional-only frustum fields are ignored). */
	shadow?: Omit<LightShadowOptions, 'left' | 'right' | 'top' | 'bottom'>;
}

export type ZylemLightOptions =
	| AmbientLightOptions
	| HemisphereLightOptions
	| DirectionalLightOptions
	| PointLightOptions
	| SpotLightOptions;

export const LIGHT_TYPE = Symbol('Light');

const DEFAULT_POSITION: Vec3 = { x: 0, y: 0, z: 0 };
const DEFAULT_COLOR: ColorRepresentation = 0xffffff;

const DEFAULT_DIRECTIONAL_SHADOW: Required<LightShadowOptions> = {
	mapSize: 2048,
	near: 0.1,
	far: 500,
	bias: 0,
	radius: 1,
	left: -100,
	right: 100,
	top: 100,
	bottom: -100,
};

const DEFAULT_POINT_SPOT_SHADOW: Required<
	Omit<LightShadowOptions, 'left' | 'right' | 'top' | 'bottom'>
> = {
	mapSize: 1024,
	near: 0.1,
	far: 500,
	bias: 0,
	radius: 1,
};

type ZylemLightGameOptions = ZylemLightOptions & GameEntityOptions;

/**
 * `GameEntity` wrapper around a `THREE.Light` (plus its optional target) so
 * lights can be added to a stage via the standard `stage.add(...)` pipeline.
 *
 * The underlying light lives inside `this.group` at the group's local origin,
 * and the group's world position is set to `options.position` when the stage
 * attaches the entity to the scene. For directional and spot lights, an
 * optional target `Object3D` is added as a sibling inside the same group at a
 * local offset of `target - position`, so moving the group also moves the
 * aim point.
 */
export class ZylemLight extends GameEntity<ZylemLightGameOptions> {
	static type = LIGHT_TYPE;

	/** The underlying THREE.js light instance. Populated in `create()`. */
	public light: Light | null = null;

	/** The target `Object3D` for directional / spot lights, when configured. */
	public lightTarget: Object3D | null = null;

	constructor(options: ZylemLightOptions) {
		super();
		this.options = { ...(options as ZylemLightGameOptions) };
	}

	public override create(): this {
		super.create();

		const group = new Group();
		const { light, target } = buildThreeLight(this.options);
		group.add(light);
		if (target) {
			group.add(target);
		}

		this.group = group;
		this.light = light;
		this.lightTarget = target;
		return this;
	}

	/**
	 * Dispose the shadow map render target before delegating to the engine's
	 * standard cleanup (which removes the group from its parent scene).
	 */
	protected override _cleanup(params: CleanupContext<this>): void {
		const shadowMap = (this.light as { shadow?: { map?: { dispose?: () => void } | null } } | null)?.shadow?.map;
		shadowMap?.dispose?.();
		this.light = null;
		this.lightTarget = null;
		super._cleanup(params);
	}
}

function buildThreeLight(options: ZylemLightOptions): {
	light: Light;
	target: Object3D | null;
} {
	switch (options.type) {
		case 'ambient':
			return { light: buildAmbientLight(options), target: null };
		case 'hemisphere':
			return { light: buildHemisphereLight(options), target: null };
		case 'directional':
			return buildDirectionalLight(options);
		case 'point':
			return { light: buildPointLight(options), target: null };
		case 'spot':
			return buildSpotLight(options);
	}
}

function buildAmbientLight(options: AmbientLightOptions): AmbientLight {
	const light = new AmbientLight(
		options.color ?? DEFAULT_COLOR,
		options.intensity ?? 1,
	);
	if (options.name) light.name = options.name;
	return light;
}

function buildHemisphereLight(options: HemisphereLightOptions): HemisphereLight {
	const sky = options.skyColor ?? options.color ?? DEFAULT_COLOR;
	const ground = options.groundColor ?? 0x000000;
	const light = new HemisphereLight(sky, ground, options.intensity ?? 1);
	if (options.name) light.name = options.name;
	return light;
}

function buildDirectionalLight(options: DirectionalLightOptions): {
	light: DirectionalLight;
	target: Object3D | null;
} {
	const light = new DirectionalLight(
		options.color ?? DEFAULT_COLOR,
		options.intensity ?? 1,
	);
	if (options.name) light.name = options.name;

	configureDirectionalShadow(light, options.castShadow ?? false, options.shadow);

	const target = resolveTargetObject(options.position, options.target);
	if (target) {
		light.target = target;
	}
	return { light, target };
}

function buildPointLight(options: PointLightOptions): PointLight {
	const light = new PointLight(
		options.color ?? DEFAULT_COLOR,
		options.intensity ?? 1,
		options.distance,
		options.decay,
	);
	if (options.name) light.name = options.name;
	configurePointOrSpotShadow(light, options.castShadow ?? false, options.shadow);
	return light;
}

function buildSpotLight(options: SpotLightOptions): {
	light: SpotLight;
	target: Object3D | null;
} {
	const light = new SpotLight(
		options.color ?? DEFAULT_COLOR,
		options.intensity ?? 1,
		options.distance,
		options.angle,
		options.penumbra,
		options.decay,
	);
	if (options.name) light.name = options.name;
	configurePointOrSpotShadow(light, options.castShadow ?? false, options.shadow);

	const target = resolveTargetObject(options.position, options.target);
	if (target) {
		light.target = target;
	}
	return { light, target };
}

/**
 * Build a sibling `Object3D` for directional/spot lights to aim at. We compute
 * a local offset so the group (which will be world-placed at `options.position`
 * by the scene) positions the target correctly in world space.
 *
 * Returns `null` when `targetWorld` is omitted -- the light keeps THREE's
 * implicit origin target.
 */
function resolveTargetObject(
	positionWorld: Vec3 | undefined,
	targetWorld: Vec3 | undefined,
): Object3D | null {
	if (!targetWorld) return null;
	const pos = positionWorld ?? DEFAULT_POSITION;
	const target = new Object3D();
	target.position.set(
		targetWorld.x - pos.x,
		targetWorld.y - pos.y,
		targetWorld.z - pos.z,
	);
	return target;
}

function configureDirectionalShadow(
	light: DirectionalLight,
	enabled: boolean,
	overrides: LightShadowOptions | undefined,
): void {
	if (!enabled) {
		light.castShadow = false;
		return;
	}
	light.castShadow = true;
	const shadow = { ...DEFAULT_DIRECTIONAL_SHADOW, ...(overrides ?? {}) };
	light.shadow.mapSize.set(shadow.mapSize, shadow.mapSize);
	light.shadow.camera.near = shadow.near;
	light.shadow.camera.far = shadow.far;
	light.shadow.camera.left = shadow.left;
	light.shadow.camera.right = shadow.right;
	light.shadow.camera.top = shadow.top;
	light.shadow.camera.bottom = shadow.bottom;
	light.shadow.bias = shadow.bias;
	light.shadow.radius = shadow.radius;
	light.shadow.camera.updateProjectionMatrix();
}

function configurePointOrSpotShadow(
	light: PointLight | SpotLight,
	enabled: boolean,
	overrides: Omit<LightShadowOptions, 'left' | 'right' | 'top' | 'bottom'> | undefined,
): void {
	if (!enabled) {
		light.castShadow = false;
		return;
	}
	light.castShadow = true;
	const shadow = { ...DEFAULT_POINT_SPOT_SHADOW, ...(overrides ?? {}) };
	light.shadow.mapSize.set(shadow.mapSize, shadow.mapSize);
	light.shadow.camera.near = shadow.near;
	light.shadow.camera.far = shadow.far;
	light.shadow.bias = shadow.bias;
	light.shadow.radius = shadow.radius;
	light.shadow.camera.updateProjectionMatrix();
}

/**
 * Create a light entity that can be added to a stage with `stage.add(...)`.
 *
 * The `type` discriminant narrows the accepted option keys, so TypeScript
 * surfaces an error if you try to set, say, `angle` on an ambient light.
 *
 * @example
 * ```ts
 * stage.add(createLight({ type: 'ambient', intensity: 1.5 }));
 * stage.add(createLight({
 *   type: 'directional',
 *   position: { x: 8, y: 12, z: 6 },
 *   target: { x: 0, y: 0, z: 0 },
 *   castShadow: true,
 * }));
 * ```
 */
export function createLight(options: ZylemLightOptions): ZylemLight {
	return new ZylemLight(options);
}
