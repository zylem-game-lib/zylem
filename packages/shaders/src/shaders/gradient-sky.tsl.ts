/**
 * Gradient sky shader in TSL (WebGPU).
 *
 * Renders a vertical color gradient from ground to horizon to zenith using
 * the per-pixel view direction in the scene's background pass.
 */
import {
	Fn,
	asin,
	clamp,
	float,
	mix,
	positionWorldDirection,
	pow,
	smoothstep,
	vec3,
	vec4,
} from 'three/tsl';
import type { ZylemTSLShader } from '../types';

const PI_HALF = Math.PI * 0.5;

/**
 * Create a gradient sky shader with custom colors.
 *
 * @param groundColor Color below the horizon.
 * @param horizonColor Color at the horizon line.
 * @param zenithColor Color directly above.
 */
export function createGradientSky(
	groundColor: [number, number, number] = [0.15, 0.1, 0.08],
	horizonColor: [number, number, number] = [0.45, 0.25, 0.15],
	zenithColor: [number, number, number] = [0.02, 0.02, 0.08]
): ZylemTSLShader {
	const colorNode = Fn(() => {
		const rd = positionWorldDirection;
		const elev = asin(clamp(rd.y, -1.0, 1.0)).div(PI_HALF);

		const skyT = smoothstep(0.0, 1.0, clamp(elev, 0.0, 1.0));
		const sky = mix(
			vec3(horizonColor[0], horizonColor[1], horizonColor[2]),
			vec3(zenithColor[0], zenithColor[1], zenithColor[2]),
			pow(skyT, float(1.5))
		);

		const groundT = smoothstep(0.0, 1.0, clamp(elev.negate(), 0.0, 1.0));
		const ground = mix(
			vec3(horizonColor[0], horizonColor[1], horizonColor[2]),
			vec3(groundColor[0], groundColor[1], groundColor[2]),
			pow(groundT, float(0.8))
		);

		const color = elev.greaterThanEqual(float(0.0)).select(sky, ground);
		return vec4(color, float(1.0));
	})();

	return {
		colorNode,
		transparent: false,
	};
}

/**
 * Default gradient sky with a warm horizon and dark ground and zenith.
 */
export const gradientSkyTSL: ZylemTSLShader = createGradientSky();
