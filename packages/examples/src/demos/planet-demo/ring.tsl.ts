/**
 * Ring shader in TSL (Three.js Shading Language)
 * WebGPU-compatible version - optimized to match simplified GLSL
 */
import {
	Fn,
	uv,
	time,
	vec2,
	vec3,
	vec4,
	float,
	floor,
	fract,
	sin,
	cos,
	dot,
	length,
	smoothstep,
	mix,
	clamp,
} from 'three/tsl';
import type { ZylemTSLShader } from '@zylem/game-lib';

// Ring palette
const ringA = vec3(0.85, 0.25, 0.15);
const ringB = vec3(0.55, 0.15, 0.10);
const ringC = vec3(0.30, 0.07, 0.05);
const dustColor = vec3(0.8, 0.35, 0.22);
const rockHighlight = vec3(0.95, 0.55, 0.35);
const speed = 0.3;

/**
 * 2D Hash function
 */
const hash = Fn(([p]: [any]) => {
	const dotResult = dot(p, vec2(127.1, 311.7));
	return fract(sin(dotResult).mul(43758.5453));
});

/**
 * 2D Value noise
 */
const noise2D = Fn(([p]: [any]) => {
	const i = floor(p);
	const f = fract(p);
	// Smooth interpolation
	const ff = f.mul(f).mul(float(3.0).sub(f.mul(2.0)));

	const a = hash(i);
	const b = hash(i.add(vec2(1, 0)));
	const c = hash(i.add(vec2(0, 1)));
	const d = hash(i.add(vec2(1, 1)));

	return mix(mix(a, b, ff.x), mix(c, d, ff.x), ff.y);
});

/**
 * 2-octave FBM (cheap)
 */
const fbm2 = Fn(([p]: [any]) => {
	const n1 = noise2D(p).mul(0.6);
	const n2 = noise2D(p.mul(2.0).add(5.7)).mul(0.4);
	return n1.add(n2);
});

/**
 * Cheaper orbital dust (no atan)
 */
const orbitalDust = Fn(([uvInput, t]: [any, any]) => {
	const c = uvInput.sub(0.5);
	const r = length(c);
	const n = fbm2(vec2(r.mul(10.0), t.mul(0.05)));
	return smoothstep(float(0.55), float(0.65), n);
});

/**
 * Main ring color node
 */
const ringColorNode = Fn(() => {
	const t = time.mul(speed);
	const uvCoord = uv();

	// Center UV for radial calculations
	const centered = uvCoord.sub(0.5);
	const radialDist = length(centered).mul(2.0);

	// Radial mask
	const innerFade = smoothstep(float(0.42), float(0.48), radialDist);
	const outerFade = smoothstep(float(0.95), float(0.88), radialDist);
	const ringMask = innerFade.mul(outerFade);

	// Bands
	const bandNoise = fbm2(vec2(radialDist.mul(5.0), float(0.0)));
	const bands = sin(radialDist.mul(24.0).add(bandNoise.mul(2.0))).mul(0.5).add(0.5);

	const baseRing1 = mix(ringA, ringB, bands);
	const baseRing2 = mix(baseRing1, ringC, bandNoise.mul(0.4));
	const baseRing = baseRing2.mul(float(0.75).add(bandNoise.mul(0.25)));

	// Dust
	const dust = orbitalDust(uvCoord, t).mul(ringMask).mul(0.008);
	const dustCol = dustColor.mul(dust);

	// Simplified rocks (no neighbor search, single cell)
	const gridP = uvCoord.mul(45.0);
	const cell = floor(gridP);
	const local = fract(gridP).sub(0.5);
	const h = hash(cell);

	// Sparse rocks - only high hash values
	const rockMask = smoothstep(float(0.84), float(0.86), h);

	// Rock position with slow orbit
	const angle = h.mul(6.28318).add(t.mul(0.03));
	const offset = vec2(cos(angle), sin(angle)).mul(0.08);
	const d = local.sub(offset);
	const dist = length(d);

	// Rock size
	const size = mix(float(0.06), float(0.12), h.mul(h));

	// Irregular edge (cheap)
	const edgeNoise = noise2D(d.mul(8.0).add(h.mul(10.0)));
	const distorted = dist.add(edgeNoise.sub(0.5).mul(size).mul(0.25));

	const rockShape = smoothstep(size, size.mul(0.6), distorted);
	const rocks = rockShape.mul(rockMask).mul(ringMask);

	// Fake lighting
	const centerFalloff = clamp(float(1.0).sub(dist.div(size)), float(0.0), float(1.0));
	const rim = smoothstep(float(0.6), float(1.0), dist.div(size));
	const shade = centerFalloff.mul(0.8).add(rim.mul(0.3));

	// Rock color
	const rockCol = mix(baseRing, rockHighlight, shade);

	// Combine
	const maskedRing = baseRing.mul(ringMask);
	const withDust = maskedRing.add(dustCol);
	const finalColor = mix(withDust, rockCol, rocks);

	// Alpha
	const alpha = clamp(
		ringMask.mul(float(0.5).add(rocks.mul(0.35)).add(dust.mul(0.2))),
		float(0.0),
		float(0.4)
	);

	return vec4(finalColor, alpha);
})();

/**
 * TSL Ring shader for WebGPU
 */
export const ringTSL: ZylemTSLShader = {
	colorNode: ringColorNode,
	transparent: true,
};
