/**
 * Ship shield shader in TSL (WebGPU). Port of the former GLSL `shield.shader`.
 *
 * Renders an animated energy bubble: pulsing edge glow, diagonal energy
 * sweeps, a concentric ring, and a soft halo, with alpha driven per-fragment.
 */
import {
	Fn,
	uv,
	time,
	vec2,
	vec3,
	vec4,
	float,
	sin,
	smoothstep,
	length,
	mix,
	clamp,
} from 'three/tsl';
import type { ZylemTSLShader } from '@zylem/game-lib/graphics';

/** Thin antialiased ring centered at uv (0.5, 0.5). */
const ringMask = Fn(([uvCoord, radius, thickness]: [any, any, any]) => {
	const dist = length(uvCoord.sub(vec2(0.5, 0.5)));
	const outer = smoothstep(radius.add(thickness), radius, dist);
	const inner = smoothstep(radius, radius.sub(thickness), dist);
	return outer.mul(inner);
});

const shieldColorNode = Fn(() => {
	const uvCoord = uv();
	const dist = length(uvCoord.sub(vec2(0.5, 0.5)));

	const edgeGlow = smoothstep(0.42, 0.18, dist).mul(
		float(1.0).sub(smoothstep(0.18, 0.0, dist)),
	);
	const pulse = float(0.7).add(sin(time.mul(10.0)).mul(0.3));
	const sweepA = sin(uvCoord.y.mul(24.0).sub(time.mul(7.0)));
	const sweepB = sin(uvCoord.x.mul(18.0).add(time.mul(5.5)));
	const energyBands = smoothstep(
		0.45,
		1.0,
		sweepA.mul(0.65).add(sweepB.mul(0.35)),
	);
	const concentric = ringMask(
		uvCoord,
		float(0.33).add(sin(time.mul(4.0)).mul(0.015)),
		float(0.035),
	);
	const halo = smoothstep(0.48, 0.22, dist).mul(0.18);

	const alpha = edgeGlow
		.mul(float(0.45).add(energyBands.mul(0.45)))
		.mul(pulse)
		.add(concentric.mul(0.4))
		.add(halo)
		.mul(smoothstep(0.5, 0.08, dist));

	const base = vec3(0.08, 0.52, 1.0);
	const glow = vec3(0.55, 0.9, 1.0);
	const color = mix(base, glow, energyBands.mul(0.7).add(concentric.mul(0.3)));

	return vec4(color, clamp(alpha, 0.0, 0.78));
})();

export const shipShieldTSL: ZylemTSLShader = {
	colorNode: shieldColorNode,
	transparent: true,
};
