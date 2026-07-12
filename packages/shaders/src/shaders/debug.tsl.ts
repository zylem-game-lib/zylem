/**
 * Debug wireframe shader in TSL (WebGPU). Port of the former GLSL
 * `debug.shader`.
 *
 * Caveat: the original drew a true triangle wireframe from a per-vertex
 * barycentric attribute. The engine does not currently generate that
 * attribute, so this TSL version approximates a wireframe using the screen-
 * space derivative (`fwidth`) of the surface `uv()` quad edges.
 */
import { Fn, float, fwidth, min, mix, smoothstep, uv, vec3, vec4 } from 'three/tsl';
import type { ZylemTSLShader } from '../types';

const baseColor = vec3(0.2, 0.2, 0.25);
const wireframeColor = vec3(0.6, 0.9, 1.0);
const wireframeThickness = 1.0;

const debugColorNode = Fn(() => {
	const uvc = uv();

	// Distance to the nearest edge of the [0,1] uv quad.
	const dist = min(min(uvc.x, float(1.0).sub(uvc.x)), min(uvc.y, float(1.0).sub(uvc.y)));

	// Constant-width line via screen-space derivative.
	const w = fwidth(dist).mul(wireframeThickness).max(1e-5);
	const edge = smoothstep(float(0.0), w, dist);

	const finalColor = mix(wireframeColor, baseColor, edge);
	return vec4(finalColor, 1.0);
})();

/**
 * TSL debug wireframe shader for WebGPU.
 */
export const debugTSL: ZylemTSLShader = {
	colorNode: debugColorNode,
	transparent: false,
};
