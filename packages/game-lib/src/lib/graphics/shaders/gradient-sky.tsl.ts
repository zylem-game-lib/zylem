/**
 * Gradient sky shader in TSL (WebGPU).
 *
 * A simple but versatile skybox shader that renders a vertical color gradient
 * from ground to horizon to zenith. Uses `positionWorldDirection` (the
 * per-pixel view direction in the scene's background pass), giving a proper
 * hemispherical sky appearance regardless of camera orientation or position.
 *
 * Exported as a pre-built shader and as a factory function
 * ({@link createGradientSky}) that accepts custom colors.
 */
import {
	Fn,
	positionWorldDirection,
	vec3,
	vec4,
	float,
	smoothstep,
	mix,
	clamp,
	pow,
	asin,
} from 'three/tsl';
import type { ZylemTSLShader } from '../material';

const PI_HALF = Math.PI * 0.5;

/**
 * Create a gradient sky shader with custom colors.
 *
 * @param groundColor  Color below the horizon (default: dark ground)
 * @param horizonColor Color at the horizon line (default: warm orange)
 * @param zenithColor  Color directly above (default: deep blue/black)
 */
export function createGradientSky(
	groundColor: [number, number, number] = [0.15, 0.1, 0.08],
	horizonColor: [number, number, number] = [0.45, 0.25, 0.15],
	zenithColor: [number, number, number] = [0.02, 0.02, 0.08],
): ZylemTSLShader {
	const colorNode = Fn(() => {
		// In a scene backgroundNode, positionWorldDirection is the per-pixel
		// view direction.
		const rd = positionWorldDirection;

		// Elevation: -1 (nadir) to +1 (zenith)
		const elev = asin(clamp(rd.y, -1.0, 1.0)).div(PI_HALF);

		// Sky region (above horizon)
		const skyT = smoothstep(0.0, 1.0, clamp(elev, 0.0, 1.0));
		const sky = mix(
			vec3(horizonColor[0], horizonColor[1], horizonColor[2]),
			vec3(zenithColor[0], zenithColor[1], zenithColor[2]),
			pow(skyT, float(1.5)),
		);

		// Ground region (below horizon)
		const groundT = smoothstep(0.0, 1.0, clamp(elev.negate(), 0.0, 1.0));
		const ground = mix(
			vec3(horizonColor[0], horizonColor[1], horizonColor[2]),
			vec3(groundColor[0], groundColor[1], groundColor[2]),
			pow(groundT, float(0.8)),
		);

		// Select sky vs ground
		const col = elev.greaterThanEqual(float(0.0)).select(sky, ground);

		return vec4(col, float(1.0));
	})();

	return {
		colorNode,
		transparent: false,
	};
}

/**
 * Default gradient sky: dark space above, warm horizon glow, dark ground below.
 * Suitable as a general-purpose game skybox.
 */
export const gradientSkyTSL: ZylemTSLShader = createGradientSky();
