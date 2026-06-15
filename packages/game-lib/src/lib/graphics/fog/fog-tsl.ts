import { Color, type Scene, type Fog, type FogExp2 } from 'three';
import {
	Fn,
	fog,
	positionWorld,
	positionView,
	uniform,
	float,
	vec3,
	clamp,
	mix,
	max,
	smoothstep,
	floor,
	fract,
	dot,
} from 'three/tsl';

/**
 * Mutable fog parameter block shared between the fog entity and the patcher.
 * `time` is advanced per-frame; the rest mirror the authored height/noise
 * options resolved by {@link ../entities/fog.ts#ZylemFog}.
 */
export interface FogUniformValues {
	time: number;
	heightEnabled: number;
	heightLevel: number;
	heightFalloff: number;
	noiseEnabled: number;
	noiseScale: number;
	noiseStrength: number;
	noiseSpeed: number;
}

/**
 * WebGPU / TSL fog patcher.
 *
 * Drives Zylem's height + noise fog on the WebGPU renderer. Instead of GLSL
 * `onBeforeCompile` chunk injection (unsupported on WebGPU) it composes a
 * single TSL fog node and assigns it to `scene.fogNode`.
 *
 * Three.js reads `scene.fogNode` in preference to the node it auto-generates
 * from `scene.fog`, so one assignment re-skins fog for every node material in
 * the scene. The node reproduces the WebGL implementation:
 * - distance factor: `rangeFogFactor` (linear) or `densityFogFactor` (exp²);
 * - height mask: clear above `level`, ramping by `falloff` per unit below it;
 * - 3D value-noise modulation animated by the shared `time` uniform.
 */
export class FogTSLPatcher {
	private values: FogUniformValues;

	/** Live uniform nodes, mutated by {@link setValues} / {@link tick}. */
	private readonly u = {
		time: uniform(0),
		heightEnabled: uniform(0),
		heightLevel: uniform(0),
		heightFalloff: uniform(0),
		noiseEnabled: uniform(0),
		noiseScale: uniform(0),
		noiseStrength: uniform(0),
		noiseSpeed: uniform(0),
	};

	/** Scene whose `fogNode` we own; null until {@link scan} attaches it. */
	private attachedScene: Scene | null = null;

	constructor(initial: FogUniformValues) {
		this.values = { ...initial };
		this.syncUniforms();
	}

	setValues(next: Partial<FogUniformValues>): void {
		Object.assign(this.values, next);
		this.syncUniforms();
	}

	tick(delta: number): void {
		this.values.time += delta;
		this.u.time.value = this.values.time;
	}

	/**
	 * Compose (once) and attach the fog node to `scene.fogNode`. Idempotent;
	 * cheap to call every frame. Requires `scene.fog` to already be set so we
	 * can read the distance-fog parameters.
	 */
	scan(scene: Scene): void {
		if (this.attachedScene === scene) return;
		const sceneFog = scene.fog;
		if (!sceneFog) return;

		(scene as Scene & { fogNode?: unknown }).fogNode = this.buildFogNode(sceneFog);
		this.attachedScene = scene;
	}

	unpatchAll(): void {
		if (this.attachedScene) {
			(this.attachedScene as Scene & { fogNode?: unknown }).fogNode = null;
			this.attachedScene = null;
		}
	}

	private syncUniforms(): void {
		this.u.time.value = this.values.time;
		this.u.heightEnabled.value = this.values.heightEnabled;
		this.u.heightLevel.value = this.values.heightLevel;
		this.u.heightFalloff.value = this.values.heightFalloff;
		this.u.noiseEnabled.value = this.values.noiseEnabled;
		this.u.noiseScale.value = this.values.noiseScale;
		this.u.noiseStrength.value = this.values.noiseStrength;
		this.u.noiseSpeed.value = this.values.noiseSpeed;
	}

	private buildFogNode(sceneFog: Fog | FogExp2) {
		const isExp2 = (sceneFog as FogExp2).isFogExp2 === true;
		const colorNode = uniform(new Color((sceneFog as Fog | FogExp2).color));

		// View-space depth (positive in front of the camera).
		const viewZ = positionView.z.negate();
		const distanceFactor = isExp2
			? this.exp2Factor(uniform((sceneFog as FogExp2).density), viewZ)
			: smoothstep(uniform((sceneFog as Fog).near), uniform((sceneFog as Fog).far), viewZ);

		// Height mask: above `level` clear, ramps up by `falloff` per unit below.
		const heightDelta = this.u.heightLevel.sub(positionWorld.y);
		const heightMask = clamp(heightDelta.mul(max(this.u.heightFalloff, 0.0)), 0.0, 1.0);
		const heightFactor = mix(distanceFactor, distanceFactor.mul(heightMask), this.u.heightEnabled);

		// Animated 3D value-noise modulation.
		const noisePos = positionWorld
			.mul(this.u.noiseScale)
			.add(vec3(this.u.time.mul(this.u.noiseSpeed), 0.0, this.u.time.mul(this.u.noiseSpeed).mul(0.5)));
		const n = fogValueNoise(noisePos);
		const modulation = n.sub(0.5).mul(2.0).mul(clamp(this.u.noiseStrength, 0.0, 1.0));
		const noisedFactor = clamp(heightFactor.add(heightFactor.mul(modulation)), 0.0, 1.0);
		const finalFactor = mix(heightFactor, noisedFactor, this.u.noiseEnabled);

		return fog(colorNode, finalFactor);
	}

	/** Exp² distance factor: `1 - exp(-(density² · viewZ²))`. */
	private exp2Factor(density: any, viewZ: any) {
		return density.mul(density).mul(viewZ).mul(viewZ).negate().exp().oneMinus();
	}
}

/** Deterministic 3D hash, port of the GLSL `zylemFogHash`. */
const fogHash = Fn(([p]: [any]) => {
	// `any` widening: TSL's strict types infer these vec3 chains as scalars,
	// which blocks the .x/.y/.z/.yzx swizzles that are valid at runtime.
	const h0: any = fract(p.mul(vec3(443.8975, 397.2973, 491.1871)));
	const h1: any = h0.add(dot(h0, h0.yzx.add(19.27)));
	return fract(h1.x.add(h1.y).mul(h1.z));
});

/** Smooth 3D value noise, port of the GLSL `zylemFogValueNoise`. */
const fogValueNoise = Fn(([p]: [any]) => {
	const i = floor(p);
	const f = fract(p);
	const u: any = f.mul(f).mul(float(3.0).sub(f.mul(2.0)));

	const n000 = fogHash(i.add(vec3(0.0, 0.0, 0.0)));
	const n100 = fogHash(i.add(vec3(1.0, 0.0, 0.0)));
	const n010 = fogHash(i.add(vec3(0.0, 1.0, 0.0)));
	const n110 = fogHash(i.add(vec3(1.0, 1.0, 0.0)));
	const n001 = fogHash(i.add(vec3(0.0, 0.0, 1.0)));
	const n101 = fogHash(i.add(vec3(1.0, 0.0, 1.0)));
	const n011 = fogHash(i.add(vec3(0.0, 1.0, 1.0)));
	const n111 = fogHash(i.add(vec3(1.0, 1.0, 1.0)));

	const nx00 = mix(n000, n100, u.x);
	const nx10 = mix(n010, n110, u.x);
	const nx01 = mix(n001, n101, u.x);
	const nx11 = mix(n011, n111, u.x);
	const nxy0 = mix(nx00, nx10, u.y);
	const nxy1 = mix(nx01, nx11, u.y);
	return mix(nxy0, nxy1, u.z);
});
