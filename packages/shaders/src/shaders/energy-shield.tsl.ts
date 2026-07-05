/**
 * Energy shield shader in TSL (WebGPU).
 *
 * A Halo-inspired personal energy shield: a fresnel rim that flares at
 * grazing angles, a procedural hex-cell lattice with per-cell flicker
 * (Halo Infinite's MJOLNIR look), scrolling energy sweeps, an upward
 * recharge wave (the classic shield-regen animation), and a localized
 * impact flare with an expanding ripple ring for shot feedback.
 *
 * Drive impacts from gameplay: set `uniforms.impactPoint.value` to the hit
 * direction (unit vector in the shell's local space) and animate
 * `uniforms.impactPhase.value` from 0 (hit) to 1 (dissipated). Leave
 * `impactPhase` at 1 for no impact.
 *
 * Intended use: a transparent material on a sphere (or any shell centered
 * on its local origin) surrounding the protected object.
 */
import { Color, type ColorRepresentation, Vector3 } from 'three';
import {
	Fn,
	abs,
	acos,
	cameraPosition,
	clamp,
	dot,
	exp,
	float,
	fract,
	max,
	mix,
	mod,
	normalWorld,
	normalize,
	positionLocal,
	positionWorld,
	pow,
	select,
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
import { type TSLFn, sinHash2 } from './utils.tsl';

export interface EnergyShieldOptions {
	/** Base shield color. Default electric blue */
	baseColor?: ColorRepresentation;
	/** Highlight color of the hex cells, sweeps, and wave. Default pale cyan */
	glowColor?: ColorRepresentation;
	/** Pulse animation speed. Default 10 */
	pulseSpeed?: number;
	/** Pulse strength (0 = steady, 1 = full flicker). Default 0.25 */
	pulseAmount?: number;
	/** Energy sweep animation speed. Default 1 */
	sweepSpeed?: number;
	/** Energy sweep stripe frequency. Default 1 */
	sweepFrequency?: number;
	/** Overall opacity ceiling (0-1). Default 0.78 */
	maxAlpha?: number;
	/** Brightness of the upward recharge wave (0-1). Default 0.4 */
	ringIntensity?: number;
	/** Recharge wave travel speed. Default 0.25 */
	waveSpeed?: number;
	/** Fresnel rim exponent (higher = thinner rim). Default 2.5 */
	rimPower?: number;
	/** Fresnel rim brightness. Default 1 */
	rimIntensity?: number;
	/** Hex lattice density across the shell. Default 12 */
	hexScale?: number;
	/** Brightness of the hex cell borders (0 disables). Default 0.5 */
	hexIntensity?: number;
	/** Per-cell shimmer speed. Default 2 */
	flickerSpeed?: number;
	/** Impact flash/ripple color. Default near-white */
	impactColor?: ColorRepresentation;
	/** Impact direction (unit vector, shell local space). */
	impactPoint?: Vector3;
	/** Impact lifecycle: 0 = just hit, 1 = dissipated (inert). Default 1 */
	impactPhase?: number;
	/** Impact flash/ripple brightness. Default 1.5 */
	impactIntensity?: number;
}

export interface EnergyShieldUniforms {
	baseColor: { value: Color };
	glowColor: { value: Color };
	pulseSpeed: { value: number };
	pulseAmount: { value: number };
	sweepSpeed: { value: number };
	sweepFrequency: { value: number };
	maxAlpha: { value: number };
	ringIntensity: { value: number };
	waveSpeed: { value: number };
	rimPower: { value: number };
	rimIntensity: { value: number };
	hexScale: { value: number };
	hexIntensity: { value: number };
	flickerSpeed: { value: number };
	impactColor: { value: Color };
	impactPoint: { value: Vector3 };
	impactPhase: { value: number };
	impactIntensity: { value: number };
	[key: string]: { value: any };
}

/** Distance from a hex cell center (0 at center, 0.5 at edge midpoints). */
const hexDist: TSLFn = Fn(([p]: [any]) => {
	const a: any = abs(p);
	return max(
		dot(a, normalize(vec2(1.0, 1.7320508)) as any) as any,
		a.x as any,
	);
});

/**
 * Hex tiling: returns vec4(cellOffset.xy, cellId.xy) for a point in hex
 * grid space (classic dual-offset-grid trick).
 */
const hexCoords: TSLFn = Fn(([p]: [any]) => {
	const r = vec2(1.0, 1.7320508);
	const h = vec2(0.5, 0.8660254);
	const a = mod(p, r).sub(h);
	const b = mod(p.sub(h), r).sub(h);
	const useA = dot(a, a).lessThan(dot(b, b));
	const gv = select(useA, a, b);
	return vec4(gv, p.sub(gv));
});

/**
 * Create a Halo-style energy shield shader. All options are exposed as
 * runtime uniforms on the returned `uniforms` object.
 */
export function createEnergyShield(
	options: EnergyShieldOptions = {},
): ZylemParameterizedShader<EnergyShieldUniforms> {
	const uBaseColor = uniform(new Color(options.baseColor ?? '#1485ff'));
	const uGlowColor = uniform(new Color(options.glowColor ?? '#8ce6ff'));
	const uPulseSpeed = uniform(options.pulseSpeed ?? 10.0);
	const uPulseAmount = uniform(options.pulseAmount ?? 0.25);
	const uSweepSpeed = uniform(options.sweepSpeed ?? 1.0);
	const uSweepFrequency = uniform(options.sweepFrequency ?? 1.0);
	const uMaxAlpha = uniform(options.maxAlpha ?? 0.78);
	const uRingIntensity = uniform(options.ringIntensity ?? 0.4);
	const uWaveSpeed = uniform(options.waveSpeed ?? 0.25);
	const uRimPower = uniform(options.rimPower ?? 2.5);
	const uRimIntensity = uniform(options.rimIntensity ?? 1.0);
	const uHexScale = uniform(options.hexScale ?? 12.0);
	const uHexIntensity = uniform(options.hexIntensity ?? 0.5);
	const uFlickerSpeed = uniform(options.flickerSpeed ?? 2.0);
	const uImpactColor = uniform(new Color(options.impactColor ?? '#eaf6ff'));
	const uImpactPoint = uniform(
		options.impactPoint?.clone().normalize() ?? new Vector3(0, 0, 1),
	);
	const uImpactPhase = uniform(options.impactPhase ?? 1.0);
	const uImpactIntensity = uniform(options.impactIntensity ?? 1.5);

	const colorNode = Fn(() => {
		const uvCoord = uv();
		const t = time;

		// Fresnel rim: bright at grazing angles, faint face-on
		const viewDir = normalize(cameraPosition.sub(positionWorld));
		const facing = clamp(dot(normalWorld as any, viewDir), 0.0, 1.0);
		const rim = pow(float(1.0).sub(facing), float(uRimPower) as any).mul(
			uRimIntensity,
		);

		// Hex-cell lattice with per-cell flicker
		const hc = hexCoords(uvCoord.mul(uHexScale));
		const border = smoothstep(0.38, 0.5, hexDist(hc.xy));
		const cellHash: any = sinHash2(hc.zw);
		const flick = sin(
			t.mul(uFlickerSpeed).mul(cellHash.mul(0.7).add(0.6)).add(cellHash.mul(6.2831)),
		)
			.mul(0.5)
			.add(0.5);
		const hexGlow = border
			.mul(uHexIntensity)
			.mul(flick.mul(0.6).add(0.4))
			// Cells read strongest near the rim, like MJOLNIR flare-ups
			.mul(rim.mul(0.75).add(0.25));

		// Scrolling energy sweeps
		const sweepA = sin(
			uvCoord.y
				.mul(float(24.0).mul(uSweepFrequency))
				.sub(t.mul(float(7.0).mul(uSweepSpeed))),
		);
		const sweepB = sin(
			uvCoord.x
				.mul(float(18.0).mul(uSweepFrequency))
				.add(t.mul(float(5.5).mul(uSweepSpeed))),
		);
		const energyBands = smoothstep(
			0.45,
			1.0,
			sweepA.mul(0.65).add(sweepB.mul(0.35)),
		);

		// Upward recharge wave wrapping the shell
		const waveBand: any = fract(uvCoord.y.sub(t.mul(uWaveSpeed)));
		const wave = smoothstep(0.0, 0.06, waveBand)
			.mul(smoothstep(0.18, 0.06, waveBand))
			.mul(uRingIntensity);

		// Global pulse
		const pulse = float(1.0)
			.sub(float(uPulseAmount).mul(0.5))
			.add(sin(t.mul(uPulseSpeed)).mul(float(uPulseAmount).mul(0.5)));

		// Impact flash + expanding ripple (angular distance on the shell)
		const impactDir = normalize(vec3(uImpactPoint as any));
		const localDir = normalize(positionLocal);
		const ang = acos(clamp(dot(localDir as any, impactDir as any), -1.0, 1.0));
		const phase = clamp(float(uImpactPhase), 0.0, 1.0);
		const live = float(1.0).sub(phase);
		const flash = exp(ang.mul(ang).mul(-24.0))
			.mul(live.mul(live))
			.mul(uImpactIntensity);
		const rippleRadius = phase.mul(1.2);
		const rippleWidth = float(0.05).add(phase.mul(0.1));
		const ripple = smoothstep(rippleWidth, 0.0, abs(ang.sub(rippleRadius)))
			.mul(live)
			.mul(uImpactIntensity)
			.mul(0.8);
		const impact = flash.add(ripple);

		const alpha = clamp(
			rim
				.mul(pulse)
				.add(hexGlow)
				.add(energyBands.mul(0.18).mul(rim.mul(0.6).add(0.15)))
				.add(wave)
				.add(impact),
			0.0,
			float(uMaxAlpha),
		);

		const featureMix = clamp(
			hexGlow.add(energyBands.mul(0.4)).add(wave).add(rim.mul(0.5)),
			0.0,
			1.0,
		);
		const shellColor = mix(
			vec3(uBaseColor as any) as any,
			vec3(uGlowColor as any) as any,
			featureMix as any,
		) as any;
		const color = mix(
			shellColor,
			vec3(uImpactColor as any) as any,
			clamp(impact, 0.0, 1.0),
		) as any;

		return vec4(color, alpha);
	})();

	return {
		colorNode,
		transparent: true,
		uniforms: {
			baseColor: uBaseColor,
			glowColor: uGlowColor,
			pulseSpeed: uPulseSpeed,
			pulseAmount: uPulseAmount,
			sweepSpeed: uSweepSpeed,
			sweepFrequency: uSweepFrequency,
			maxAlpha: uMaxAlpha,
			ringIntensity: uRingIntensity,
			waveSpeed: uWaveSpeed,
			rimPower: uRimPower,
			rimIntensity: uRimIntensity,
			hexScale: uHexScale,
			hexIntensity: uHexIntensity,
			flickerSpeed: uFlickerSpeed,
			impactColor: uImpactColor,
			impactPoint: uImpactPoint,
			impactPhase: uImpactPhase,
			impactIntensity: uImpactIntensity,
		},
	};
}
