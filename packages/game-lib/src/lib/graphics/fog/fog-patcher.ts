import type { IUniform, Material, Scene } from 'three';

import {
	FOG_CHUNK_KEYS,
	FOG_FRAGMENT_REPLACEMENT,
	FOG_PARS_FRAGMENT_REPLACEMENT,
	FOG_PARS_VERTEX_REPLACEMENT,
	FOG_VERTEX_REPLACEMENT,
} from './fog-shader-chunks';

type OnBeforeCompileHook = (
	shader: { uniforms: Record<string, IUniform>; fragmentShader: string; vertexShader: string },
	renderer: unknown,
) => void;

/**
 * Mutable uniform values driven by the fog entity. The patcher holds one
 * instance and assigns it (by reference) to every material's `onBeforeCompile`
 * uniform map, so updates flow to all patched materials with a single write.
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

/** Marker stamped on every patched material to make idempotent re-patching cheap. */
const PATCHED_MARKER = '__zylemFogPatched';

type MaterialWithCompile = Material & {
	onBeforeCompile?: OnBeforeCompileHook;
	customProgramCacheKey?: () => string;
	needsUpdate?: boolean;
	userData: Record<string, unknown>;
	fog?: boolean;
};

/**
 * Type guard for materials that support fog. Excludes `ShaderMaterial`
 * (which does not honour `material.fog` in the standard pipeline),
 * `SpriteMaterial` (whose custom vertex pathway never defines the
 * `transformed` symbol our `<fog_vertex>` replacement reads — patching
 * it produces a shader compile error and the sprite stops rendering),
 * and any material with `fog === false` set explicitly.
 *
 * Sprites still get the stock Three.js distance fog because the original
 * `vFogDepth = -mvPosition.z` lookup keeps working; they just don't
 * receive Zylem's height mask or noise modulation, which is the right
 * call for screen-anchored UI billboards.
 */
function supportsFog(mat: Material): mat is MaterialWithCompile {
	const m = mat as MaterialWithCompile;
	if (!m) return false;
	// Three.js's built-in lit materials all expose `material.fog` and consume
	// the `fog_*` shader chunks. RawShaderMaterial / ShaderMaterial bring
	// their own shader so we leave them alone.
	if ((mat as unknown as { isShaderMaterial?: boolean; isRawShaderMaterial?: boolean }).isShaderMaterial) {
		return false;
	}
	if ((mat as unknown as { isRawShaderMaterial?: boolean }).isRawShaderMaterial) {
		return false;
	}
	if ((mat as unknown as { isSpriteMaterial?: boolean }).isSpriteMaterial) {
		return false;
	}
	if (typeof m.onBeforeCompile !== 'function' && typeof m.onBeforeCompile !== 'undefined') {
		return false;
	}
	return m.fog !== false;
}

/**
 * Patches every fog-capable material in a Three.js scene so that the
 * built-in fog pipeline is augmented with Zylem's height + noise effects.
 *
 * The patcher is intentionally lazy: it traverses the scene whenever
 * {@link FogMaterialPatcher.scan} is called (typically once per frame from
 * the fog entity's `_update`), tagging each material it touches via
 * `material.userData[PATCHED_MARKER]` so subsequent passes are O(unique
 * materials) rather than O(all materials).
 *
 * NOTE: This is the WebGL implementation. The WebGPU/TSL equivalent lives
 * in {@link ./fog-tsl.ts} and should follow the same public surface.
 */
export class FogMaterialPatcher {
	private readonly uniforms: {
		[Key in keyof FogUniformValues as `uZylemFog${Capitalize<Key>}`]: IUniform<number>;
	};
	private readonly previousCompileHooks = new WeakMap<
		MaterialWithCompile,
		OnBeforeCompileHook
	>();
	private readonly patchedMaterials = new Set<MaterialWithCompile>();
	private values: FogUniformValues;

	constructor(initial: FogUniformValues) {
		this.values = { ...initial };
		this.uniforms = {
			uZylemFogTime: { value: this.values.time },
			uZylemFogHeightEnabled: { value: this.values.heightEnabled },
			uZylemFogHeightLevel: { value: this.values.heightLevel },
			uZylemFogHeightFalloff: { value: this.values.heightFalloff },
			uZylemFogNoiseEnabled: { value: this.values.noiseEnabled },
			uZylemFogNoiseScale: { value: this.values.noiseScale },
			uZylemFogNoiseStrength: { value: this.values.noiseStrength },
			uZylemFogNoiseSpeed: { value: this.values.noiseSpeed },
		};
	}

	/**
	 * Set the noise/height parameter block in one call.
	 * Values are written into the shared uniform objects so already-patched
	 * materials pick the changes up on the next frame.
	 */
	setValues(next: Partial<FogUniformValues>): void {
		if (next.time !== undefined) this.uniforms.uZylemFogTime.value = next.time;
		if (next.heightEnabled !== undefined) this.uniforms.uZylemFogHeightEnabled.value = next.heightEnabled;
		if (next.heightLevel !== undefined) this.uniforms.uZylemFogHeightLevel.value = next.heightLevel;
		if (next.heightFalloff !== undefined) this.uniforms.uZylemFogHeightFalloff.value = next.heightFalloff;
		if (next.noiseEnabled !== undefined) this.uniforms.uZylemFogNoiseEnabled.value = next.noiseEnabled;
		if (next.noiseScale !== undefined) this.uniforms.uZylemFogNoiseScale.value = next.noiseScale;
		if (next.noiseStrength !== undefined) this.uniforms.uZylemFogNoiseStrength.value = next.noiseStrength;
		if (next.noiseSpeed !== undefined) this.uniforms.uZylemFogNoiseSpeed.value = next.noiseSpeed;
		Object.assign(this.values, next);
	}

	/**
	 * Advance the animated noise time. Use a delta rather than absolute time
	 * so external pauses / time-scale tweaks are naturally respected.
	 */
	tick(delta: number): void {
		this.uniforms.uZylemFogTime.value += delta;
		this.values.time = this.uniforms.uZylemFogTime.value;
	}

	/**
	 * Walk the scene graph once and patch any new fog-capable materials.
	 * Safe to call every frame; already-patched materials are skipped via
	 * a userData marker.
	 */
	scan(scene: Scene): void {
		scene.traverse((object) => {
			const material = (object as { material?: Material | Material[] }).material;
			if (!material) return;
			if (Array.isArray(material)) {
				for (const m of material) this.patchOne(m);
			} else {
				this.patchOne(material);
			}
		});
	}

	/**
	 * Restore every patched material to its prior state. Called when the fog
	 * entity is cleaned up so material caches don't keep the Zylem fog
	 * uniforms forever.
	 */
	unpatchAll(): void {
		for (const mat of this.patchedMaterials) {
			this.unpatchOne(mat);
		}
		this.patchedMaterials.clear();
	}

	private patchOne(mat: Material): void {
		if (!supportsFog(mat)) return;
		if (mat.userData[PATCHED_MARKER]) return;

		const previous = mat.onBeforeCompile;
		if (typeof previous === 'function') {
			this.previousCompileHooks.set(mat, previous);
		}

		mat.onBeforeCompile = (shader, renderer) => {
			if (previous) previous.call(mat, shader, renderer);
			shader.uniforms.uZylemFogTime = this.uniforms.uZylemFogTime;
			shader.uniforms.uZylemFogHeightEnabled = this.uniforms.uZylemFogHeightEnabled;
			shader.uniforms.uZylemFogHeightLevel = this.uniforms.uZylemFogHeightLevel;
			shader.uniforms.uZylemFogHeightFalloff = this.uniforms.uZylemFogHeightFalloff;
			shader.uniforms.uZylemFogNoiseEnabled = this.uniforms.uZylemFogNoiseEnabled;
			shader.uniforms.uZylemFogNoiseScale = this.uniforms.uZylemFogNoiseScale;
			shader.uniforms.uZylemFogNoiseStrength = this.uniforms.uZylemFogNoiseStrength;
			shader.uniforms.uZylemFogNoiseSpeed = this.uniforms.uZylemFogNoiseSpeed;

			shader.vertexShader = shader.vertexShader
				.replace(FOG_CHUNK_KEYS.parsVertex, FOG_PARS_VERTEX_REPLACEMENT)
				.replace(FOG_CHUNK_KEYS.vertex, FOG_VERTEX_REPLACEMENT);

			shader.fragmentShader = shader.fragmentShader
				.replace(FOG_CHUNK_KEYS.parsFragment, FOG_PARS_FRAGMENT_REPLACEMENT)
				.replace(FOG_CHUNK_KEYS.fragment, FOG_FRAGMENT_REPLACEMENT);
		};

		// `customProgramCacheKey` ensures Three.js compiles a fresh program
		// when our hook is added/removed so we don't accidentally re-use the
		// stock-fog compiled shader from before patching.
		const previousCacheKey = mat.customProgramCacheKey;
		mat.customProgramCacheKey = function zylemFogCacheKey() {
			const base = previousCacheKey ? previousCacheKey.call(this) : '';
			return `${base}:zylemFog:1`;
		};

		mat.userData[PATCHED_MARKER] = true;
		mat.needsUpdate = true;
		this.patchedMaterials.add(mat);
	}

	private unpatchOne(mat: MaterialWithCompile): void {
		if (!mat.userData[PATCHED_MARKER]) return;

		const previousHook = this.previousCompileHooks.get(mat);
		mat.onBeforeCompile = previousHook ?? (() => undefined);
		this.previousCompileHooks.delete(mat);

		// Force a recompile without our injected uniforms / chunks.
		mat.customProgramCacheKey = function zylemFogCacheKeyReverted() {
			return ':zylemFog:0';
		};

		delete mat.userData[PATCHED_MARKER];
		mat.needsUpdate = true;
	}
}
