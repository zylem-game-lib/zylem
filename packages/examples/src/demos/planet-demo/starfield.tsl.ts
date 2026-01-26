/**
 * Starfield shader in TSL (Three.js Shading Language)
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
	dot,
	length,
	mix,
	max,
} from 'three/tsl';
import type { ZylemTSLShader } from '@zylem/game-lib';

// Star colors
const starColorWarm = vec3(1.0, 0.9, 0.7);
const starColorCool = vec3(0.7, 0.85, 1.0);
const starColorWhite = vec3(1.0, 1.0, 1.0);
const backgroundColor = vec3(0.01, 0.01, 0.03);

/**
 * Hash function for pseudo-random values
 */
const hash = Fn(([p]: [any]) => {
	const dotResult = dot(p, vec2(127.1, 311.7));
	return fract(sin(dotResult).mul(43758.5453));
});

/**
 * Cheap star layer (1 star per cell, no neighbor search)
 */
const starLayer = Fn(([uvInput, scale, t]: [any, any, any]) => {
	const grid = uvInput.mul(scale);
	const id = floor(grid);
	const f = fract(grid).sub(0.5);

	const h = hash(id);

	// Sparse stars - only high hash values
	// Using smoothstep as mask instead of early return
	const sparseMask = max(float(0.0), h.sub(0.85).mul(6.666)); // ~= h > 0.85

	// Jittered star position
	const starPosX = hash(id.add(1.3)).sub(0.5);
	const starPosY = hash(id.add(2.1)).sub(0.5);
	const starPos = vec2(starPosX, starPosY);
	const d = f.sub(starPos);

	const dist = length(d);

	// Star size
	const size = mix(float(0.015), float(0.03), h);

	// Cheap brightness falloff
	const core = max(float(0.0), float(1.0).sub(dist.div(size)));
	const glow = max(float(0.0), float(1.0).sub(dist.div(size.mul(4.0)))).mul(0.15);

	// Twinkle (single sine)
	const twinkle = float(0.6).add(sin(t.mul(float(0.6).add(h)).add(h.mul(6.28))).mul(0.4));

	return core.add(glow).mul(twinkle).mul(sparseMask);
});

/**
 * Main starfield color node
 */
const starfieldColorNode = Fn(() => {
	const t = time;
	const uvCoord = uv();

	// Background
	let color = vec3(backgroundColor);

	// Subtle nebula tint (cheap)
	const nebula = sin(uvCoord.x.mul(2.0).add(t.mul(0.02)))
		.mul(sin(uvCoord.y.mul(1.5).sub(t.mul(0.01))))
		.mul(0.5)
		.add(0.5);
	color = color.add(vec3(0.01, 0.005, 0.02).mul(nebula));

	// Star layers
	const starsA = starLayer(uvCoord, float(60.0), t);
	const starsB = starLayer(uvCoord.add(0.37), float(120.0), t.mul(0.8));
	const starsC = starLayer(uvCoord.add(0.71), float(240.0), t.mul(0.6));

	const allStars = starsA.add(starsB.mul(0.6)).add(starsC.mul(0.35));

	// Star color
	const colorMix = hash(floor(uvCoord.mul(60.0)));
	const starCol = mix(starColorWarm, starColorCool, colorMix);
	const finalStarCol = mix(starCol, starColorWhite, float(0.5));

	color = color.add(finalStarCol.mul(allStars));

	return vec4(color, float(1.0));
})();

/**
 * TSL Starfield shader for WebGPU
 */
export const starfieldTSL: ZylemTSLShader = {
	colorNode: starfieldColorNode,
	transparent: false,
};
