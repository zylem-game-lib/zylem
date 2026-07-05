/**
 * Holographic material in TSL (WebGPU).
 *
 * Port of Anderson Mancini's HolographicMaterialVanilla
 * (https://github.com/ektogamat/threejs-vanilla-holographic-material):
 * screen-space scanlines with per-UV RGB jitter, a fresnel rim, and an
 * optional signal-blink flicker, composited additively by default.
 *
 * Intended use: a transparent material on any mesh.
 */
import {
	AdditiveBlending,
	type Blending,
	Color,
	type ColorRepresentation,
	FrontSide,
	type Side,
} from 'three';
import {
	Fn,
	cameraPosition,
	clamp,
	cos,
	dot,
	float,
	fract,
	max,
	mix,
	modelWorldMatrix,
	normalWorld,
	normalize,
	positionLocal,
	positionWorld,
	screenUV,
	sin,
	smoothstep,
	time,
	uniform,
	uv,
	vec2,
	vec3,
	vec4,
} from 'three/tsl';
import type { ZylemParameterizedShader } from '../types';
import type { TSLFn } from './utils.tsl';

export interface HolographicOptions {
	/** Hologram tint. Default cyan (#00d5ff) */
	hologramColor?: ColorRepresentation;
	/** Overall hologram alpha. Default 1 */
	hologramOpacity?: number;
	/** Base brightness of the hologram body. Default 1 */
	hologramBrightness?: number;
	/** Fresnel rim cap/opacity. Default 1 */
	fresnelOpacity?: number;
	/** Fresnel rim strength. Default 0.45 */
	fresnelAmount?: number;
	/** Scanline density. Default 8 */
	scanlineSize?: number;
	/** Signal/animation speed (also drives blinking). Default 1 */
	signalSpeed?: number;
	/**
	 * Glitch strength (0 = off). Displaces horizontal slices of the mesh in
	 * intermittent bursts and tears the body color while a burst is active.
	 * The vertex displacement needs reasonably tessellated geometry (spheres
	 * are fine; a 1x1x1 box won't visibly bend). Default 0
	 */
	glitchIntensity?: number;
	/** How often glitch bursts occur (time multiplier). Default 1 */
	glitchFrequency?: number;
	/** Enable the signal-blink flicker. Baked. Default true */
	enableBlinking?: boolean;
	/** Blink only the fresnel rim instead of the body. Baked. Default true */
	blinkFresnelOnly?: boolean;
	/** three.js blending mode. Baked. Default AdditiveBlending */
	blendMode?: Blending;
	/** three.js render side. Baked. Default FrontSide */
	side?: Side;
	/** Depth test. Baked. Default false (overlay look, as the original) */
	depthTest?: boolean;
}

export interface HolographicUniforms {
	hologramColor: { value: Color };
	hologramOpacity: { value: number };
	hologramBrightness: { value: number };
	fresnelOpacity: { value: number };
	fresnelAmount: { value: number };
	scanlineSize: { value: number };
	signalSpeed: { value: number };
	glitchIntensity: { value: number };
	glitchFrequency: { value: number };
	[key: string]: { value: any };
}

/** The original's random(): fract(cos(dot(ab, vec2(12.9898, 78.233))) * 43758.5453). */
const holoRandom: TSLFn = Fn(([a, b]: [any, any]) => {
	return fract(
		cos(dot(vec2(a, b) as any, vec2(12.9898, 78.233))).mul(43758.5453),
	);
});

/**
 * Intermittent glitch burst envelope (Bruno Simon / Mancini style): stacked
 * sines over `time - worldY`, smoothstepped so bursts occur in horizontal
 * bands that sweep the mesh and are inactive most of the time.
 */
const glitchBurst: TSLFn = Fn(([glitchTime]: [any]) => {
	const strength = sin(glitchTime)
		.add(sin((glitchTime as any).mul(3.45)))
		.add(sin((glitchTime as any).mul(8.76)))
		.div(3.0);
	return smoothstep(0.3, 1.0, strength as any);
});

/**
 * Create a holographic shader. All visual parameters are runtime uniforms;
 * blinking behavior and material state (blend mode, side, depth test) are
 * baked at creation.
 */
export function createHolographic(
	options: HolographicOptions = {},
): ZylemParameterizedShader<HolographicUniforms> {
	const uHologramColor = uniform(
		new Color(options.hologramColor ?? '#00d5ff'),
	);
	const uHologramOpacity = uniform(options.hologramOpacity ?? 1.0);
	const uHologramBrightness = uniform(options.hologramBrightness ?? 1.0);
	const uFresnelOpacity = uniform(options.fresnelOpacity ?? 1.0);
	const uFresnelAmount = uniform(options.fresnelAmount ?? 0.45);
	const uScanlineSize = uniform(options.scanlineSize ?? 8.0);
	const uSignalSpeed = uniform(options.signalSpeed ?? 1.0);
	const uGlitchIntensity = uniform(options.glitchIntensity ?? 0.0);
	const uGlitchFrequency = uniform(options.glitchFrequency ?? 1.0);

	const enableBlinking = options.enableBlinking ?? true;
	const blinkFresnelOnly = options.blinkFresnelOnly ?? true;

	// Vertex glitch: displace X/Z of horizontal slices during bursts. Uses
	// the world position of the *original* vertex (modelWorldMatrix *
	// positionLocal) so it doesn't feed back into itself.
	const positionNode = Fn(() => {
		const t = time.mul(uGlitchFrequency);
		const worldPos = modelWorldMatrix.mul(vec4(positionLocal, 1.0));
		const burst = glitchBurst(t.sub(worldPos.y))
			.mul(0.25)
			.mul(uGlitchIntensity);
		const dx = holoRandom(worldPos.x.add(t), worldPos.z)
			.sub(0.5)
			.mul(burst);
		const dz = holoRandom(worldPos.z.add(t), worldPos.x)
			.sub(0.5)
			.mul(burst);
		return positionLocal.add(vec3(dx, 0.0, dz) as any);
	})();

	const colorNode = Fn(() => {
		const uvCoord = uv();
		// The original projects vPos to NDC and remaps to 0..1 — that is
		// exactly the built-in screen UV.
		const myUV = screenUV;
		const t = time;

		// Hologram body: tint with brightness/height-mixed alpha
		const bodyAlpha = mix(float(uHologramBrightness), uvCoord.y, 0.5);
		const holo = vec4(vec3(uHologramColor as any), bodyAlpha).toVar();

		// Scanline stack over screen Y
		const scan1 = sin(
			t.mul(uSignalSpeed).mul(20.8).sub(myUV.y.mul(60.0).mul(uScanlineSize)),
		).mul(20.0);
		const scanlines = float(10.0)
			.add(scan1)
			.mul(
				smoothstep(
					cos(t.mul(uSignalSpeed).add(myUV.y.mul(uScanlineSize))).mul(1.3),
					0.78,
					0.9,
				),
			)
			.mul(max(float(0.25), sin(t.mul(uSignalSpeed))));

		// Per-UV RGB jitter composited into the body. While a glitch burst is
		// sweeping this fragment's height, amplify the jitter so the body
		// visibly tears in sync with the vertex displacement.
		const fragBurst = glitchBurst(
			t.mul(uGlitchFrequency).sub(positionWorld.y),
		).mul(uGlitchIntensity);
		const tear = float(1.0).add(fragBurst.mul(6.0));
		const r = holoRandom(uvCoord.x, uvCoord.y);
		const b = holoRandom(uvCoord.y.mul(0.9), uvCoord.y.mul(0.2));
		holo.assign(
			holo.add(
				vec4(r.mul(scanlines), b.mul(scanlines), r, 1.0)
					.div(84.0)
					.mul(tear),
			),
		);
		const scanlineMix = mix(vec4(0.0), holo, holo.a);

		// Fresnel rim
		const viewDirectionW = normalize(cameraPosition.sub(positionWorld));
		const fresnelDot = dot(viewDirectionW, normalWorld as any).mul(
			float(1.6).sub(uFresnelOpacity.div(2.0)),
		);
		const fresnelEffect = clamp(
			float(uFresnelAmount).sub(fresnelDot),
			0.0,
			float(uFresnelOpacity),
		);

		// Signal blink flicker
		const blinkValue = enableBlinking
			? float(0.6).sub(uSignalSpeed)
			: float(1.0);
		const blink = clamp(
			fract(cos(t.mul(uSignalSpeed).mul(0.02)).mul(43758.5453123)),
			blinkValue,
			1.0,
		);

		const finalColor = blinkFresnelOnly
			? scanlineMix.rgb.add(fresnelEffect.mul(blink))
			: scanlineMix.rgb.mul(blink).add(fresnelEffect);

		return vec4(finalColor, uHologramOpacity);
	})();

	return {
		colorNode,
		positionNode,
		transparent: true,
		blending: options.blendMode ?? AdditiveBlending,
		side: options.side ?? FrontSide,
		depthTest: options.depthTest ?? false,
		uniforms: {
			hologramColor: uHologramColor,
			hologramOpacity: uHologramOpacity,
			hologramBrightness: uHologramBrightness,
			fresnelOpacity: uFresnelOpacity,
			fresnelAmount: uFresnelAmount,
			scanlineSize: uScanlineSize,
			signalSpeed: uSignalSpeed,
			glitchIntensity: uGlitchIntensity,
			glitchFrequency: uGlitchFrequency,
		},
	};
}
