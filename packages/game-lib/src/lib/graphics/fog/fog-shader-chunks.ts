/**
 * GLSL fragments injected into every material with `fog: true` so that the
 * built-in Three.js fog (`Fog`, `FogExp2`) can be modulated by world-space
 * vertical falloff (height fog) and an animated 3D noise field.
 *
 * The chunks are written so that:
 * - When neither height nor noise is enabled, the patched shader behaves
 *   identically to stock Three.js fog (modulo a couple of cheap uniform reads).
 * - The vertex shader emits a `vFogWorldPos` varying that downstream chunks
 *   can sample without depending on the fragment shader's world position
 *   chunk (which isn't on by default for `MeshStandardMaterial`).
 *
 * The GLSL patcher lives in {@link ./fog-patcher.ts}. A separate TSL/WebGPU
 * implementation is stubbed in {@link ./fog-tsl.ts} for future migration --
 * keep the two branches symmetric when adding features here.
 */

/**
 * Replacement for the stock `<fog_pars_vertex>` chunk.
 * Adds a `vFogWorldPos` varying alongside Three.js's `vFogDepth`.
 */
export const FOG_PARS_VERTEX_REPLACEMENT = /* glsl */ `
#ifdef USE_FOG
	varying float vFogDepth;
	varying vec3 vFogWorldPos;
#endif
`;

/**
 * Replacement for the stock `<fog_vertex>` chunk.
 * Emits both the standard fog depth and the entity's world-space position.
 *
 * Note: relies on `transformed` (set up by `<begin_vertex>` / `<skinning_vertex>`)
 * and `mvPosition` (set up by `<project_vertex>`). Both run before `<fog_vertex>`
 * in the standard chunk order, so this is safe to inject as-is.
 */
export const FOG_VERTEX_REPLACEMENT = /* glsl */ `
#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
	vFogWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
#endif
`;

/**
 * Replacement for the stock `<fog_pars_fragment>` chunk.
 * Declares the same uniforms Three.js provides for built-in fog, then adds
 * Zylem-specific height/noise uniforms and a small 3D value-noise helper.
 *
 * The value-noise hash is deterministic, cheap, and produces a smooth
 * volumetric look when combined with `vFogWorldPos`. It is intentionally
 * less expensive than simplex/Worley noise so it stays viable on lower-end
 * mobile GPUs.
 */
export const FOG_PARS_FRAGMENT_REPLACEMENT = /* glsl */ `
#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	varying vec3 vFogWorldPos;

	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif

	// Zylem-specific uniforms (shared by reference across all patched materials)
	uniform float uZylemFogTime;
	uniform float uZylemFogHeightEnabled;
	uniform float uZylemFogHeightLevel;
	uniform float uZylemFogHeightFalloff;
	uniform float uZylemFogNoiseEnabled;
	uniform float uZylemFogNoiseScale;
	uniform float uZylemFogNoiseStrength;
	uniform float uZylemFogNoiseSpeed;

	float zylemFogHash(vec3 p) {
		p = fract(p * vec3(443.8975, 397.2973, 491.1871));
		p += dot(p, p.yzx + 19.27);
		return fract((p.x + p.y) * p.z);
	}

	float zylemFogValueNoise(vec3 p) {
		vec3 i = floor(p);
		vec3 f = fract(p);
		vec3 u = f * f * (3.0 - 2.0 * f);

		float n000 = zylemFogHash(i + vec3(0.0, 0.0, 0.0));
		float n100 = zylemFogHash(i + vec3(1.0, 0.0, 0.0));
		float n010 = zylemFogHash(i + vec3(0.0, 1.0, 0.0));
		float n110 = zylemFogHash(i + vec3(1.0, 1.0, 0.0));
		float n001 = zylemFogHash(i + vec3(0.0, 0.0, 1.0));
		float n101 = zylemFogHash(i + vec3(1.0, 0.0, 1.0));
		float n011 = zylemFogHash(i + vec3(0.0, 1.0, 1.0));
		float n111 = zylemFogHash(i + vec3(1.0, 1.0, 1.0));

		float nx00 = mix(n000, n100, u.x);
		float nx10 = mix(n010, n110, u.x);
		float nx01 = mix(n001, n101, u.x);
		float nx11 = mix(n011, n111, u.x);
		float nxy0 = mix(nx00, nx10, u.y);
		float nxy1 = mix(nx01, nx11, u.y);
		return mix(nxy0, nxy1, u.z);
	}
#endif
`;

/**
 * Replacement for the stock `<fog_fragment>` chunk.
 *
 * Computes the standard distance-based factor (linear or exp²), then folds
 * in height & noise modulators when enabled. The modulators clamp the
 * factor into `[0, 1]` so the final `mix()` stays well-behaved regardless
 * of user-supplied falloff numbers.
 */
export const FOG_FRAGMENT_REPLACEMENT = /* glsl */ `
#ifdef USE_FOG
	#ifdef FOG_EXP2
		float zylemFogFactor = 1.0 - exp(- fogDensity * fogDensity * vFogDepth * vFogDepth);
	#else
		float zylemFogFactor = smoothstep(fogNear, fogFar, vFogDepth);
	#endif

	if (uZylemFogHeightEnabled > 0.5) {
		// Above 'level' the world is clear; below it the density ramps up
		// at 'falloff' per world-space unit. Falloff is clamped to avoid
		// pathological values from authoring code.
		float heightDelta = uZylemFogHeightLevel - vFogWorldPos.y;
		float heightMask = clamp(heightDelta * max(uZylemFogHeightFalloff, 0.0), 0.0, 1.0);
		zylemFogFactor *= heightMask;
	}

	if (uZylemFogNoiseEnabled > 0.5) {
		vec3 noisePos = vFogWorldPos * uZylemFogNoiseScale
			+ vec3(uZylemFogTime * uZylemFogNoiseSpeed, 0.0, uZylemFogTime * uZylemFogNoiseSpeed * 0.5);
		float n = zylemFogValueNoise(noisePos);
		// Map noise from [0,1] to [-strength, +strength] modulation and add.
		float modulation = (n - 0.5) * 2.0 * clamp(uZylemFogNoiseStrength, 0.0, 1.0);
		zylemFogFactor = clamp(zylemFogFactor + zylemFogFactor * modulation, 0.0, 1.0);
	}

	gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, zylemFogFactor);
#endif
`;

/** Sentinel keys for the original Three.js fog chunks we replace. */
export const FOG_CHUNK_KEYS = {
	parsVertex: '#include <fog_pars_vertex>',
	vertex: '#include <fog_vertex>',
	parsFragment: '#include <fog_pars_fragment>',
	fragment: '#include <fog_fragment>',
} as const;
