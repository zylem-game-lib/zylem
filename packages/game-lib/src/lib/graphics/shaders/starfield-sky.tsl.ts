/**
 * Starfield skybox shader in TSL (WebGPU).
 *
 * A procedural starfield rendered as a scene `backgroundNode` skybox. Uses
 * `positionWorldDirection` (the per-pixel view direction in the background
 * pass) to derive spherical coordinates, producing a seamless star pattern
 * in every direction. Includes twinkling, multiple star layers at different
 * densities, and a subtle nebula tint.
 *
 * This is the game-lib built-in version intended for use as a
 * `backgroundShader`. It differs from the examples `starfield.tsl.ts`
 * (which uses flat `uv()` coordinates) by operating on the view direction
 * for proper skybox rendering.
 */
import {
	Fn,
	time,
	positionWorldDirection,
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
	atan,
	asin,
	clamp,
} from 'three/tsl';
import type { ZylemTSLShader } from '../material';

const TAU = 6.28318530718;
const PI = 3.14159265359;

// Star color palette
const starColorWarm = vec3(1.0, 0.9, 0.7);
const starColorCool = vec3(0.7, 0.85, 1.0);
const starColorWhite = vec3(1.0, 1.0, 1.0);
const bgColor = vec3(0.01, 0.01, 0.03);

/**
 * Hash function for pseudo-random values from a 2D input.
 */
const hash = Fn(([p]: [any]) => {
	const dotResult = dot(p, vec2(127.1, 311.7));
	return fract(sin(dotResult).mul(43758.5453));
});

/**
 * Single star layer: one star per grid cell with jitter, brightness falloff,
 * and twinkle animation.
 */
const starLayer = Fn(([skyUV, scale, t]: [any, any, any]) => {
	const grid = skyUV.mul(scale);
	const id = floor(grid);
	const f = fract(grid).sub(0.5);

	const h = hash(id);

	// Sparse stars: only high hash values produce a star
	const sparseMask = max(float(0.0), h.sub(0.85).mul(6.666));

	// Jittered star position within cell
	const starPosX = hash(id.add(1.3)).sub(0.5);
	const starPosY = hash(id.add(2.1)).sub(0.5);
	const starPos = vec2(starPosX, starPosY);
	const d = f.sub(starPos);

	const dist = length(d);

	// Star size varies with hash
	const size = mix(float(0.015), float(0.03), h);

	// Brightness falloff: sharp core + soft glow
	const core = max(float(0.0), float(1.0).sub(dist.div(size)));
	const glow = max(float(0.0), float(1.0).sub(dist.div(size.mul(4.0)))).mul(0.15);

	// Twinkle animation
	const twinkle = float(0.6).add(
		sin(t.mul(float(0.6).add(h)).add(h.mul(6.28))).mul(0.4),
	);

	return core.add(glow).mul(twinkle).mul(sparseMask);
});

/**
 * Main starfield skybox color node.
 */
const starfieldSkyColorNode = Fn(() => {
	// In a backgroundNode, positionWorldDirection is the normalized
	// per-pixel view direction.
	const rd = positionWorldDirection;
	const t = time;

	// Convert world direction to spherical UV coordinates
	const lon = atan(rd.z, rd.x);
	const lat = asin(clamp(rd.y, -1.0, 1.0));
	const skyUV = vec2(lon.div(TAU).add(0.5), lat.div(PI).add(0.5));

	// Background color
	let color: any = vec3(bgColor);

	// Subtle nebula tint
	const nebula = sin(skyUV.x.mul(2.0).add(t.mul(0.02)))
		.mul(sin(skyUV.y.mul(1.5).sub(t.mul(0.01))))
		.mul(0.5)
		.add(0.5);
	color = color.add(vec3(0.01, 0.005, 0.02).mul(nebula));

	// Multiple star layers at different densities
	const starsA = starLayer(skyUV, float(60.0), t);
	const starsB = starLayer(skyUV.add(0.37), float(120.0), t.mul(0.8));
	const starsC = starLayer(skyUV.add(0.71), float(240.0), t.mul(0.6));

	const allStars = starsA.add(starsB.mul(0.6)).add(starsC.mul(0.35));

	// Star color variation
	const colorMix = hash(floor(skyUV.mul(60.0)));
	const starCol = mix(starColorWarm, starColorCool, colorMix);
	const finalStarCol = mix(starCol, starColorWhite, float(0.5));

	color = color.add(finalStarCol.mul(allStars));

	return vec4(color, float(1.0));
})();

/**
 * TSL starfield skybox shader for WebGPU.
 * Uses world-space position for proper 3D skybox rendering.
 */
export const starfieldSkyTSL: ZylemTSLShader = {
	colorNode: starfieldSkyColorNode,
	transparent: false,
};
