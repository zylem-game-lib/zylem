/**
 * Star / kaleidoscope bloom shader in TSL (WebGPU). Port of the former GLSL
 * `star.shader`.
 *
 * Credit: https://www.shadertoy.com/view/mtyGWy
 *
 * Uses surface `uv()` (0..1) normalized to [-1, 1] (matching the old
 * `iResolution = (1,1,1)` default) and the `time` node for animation.
 */
import {
	Fn,
	uv,
	time,
	vec3,
	vec4,
	float,
	fract,
	length,
	exp,
	sin,
	cos,
	abs,
	pow,
} from 'three/tsl';
import type { ZylemTSLShader } from '../material';

/** Cosine gradient palette (iq). */
const palette = Fn(([t]: [any]) => {
	const a = vec3(0.5, 0.5, 0.5);
	const b = vec3(0.5, 0.5, 0.5);
	const c = vec3(1.0, 1.0, 1.0);
	const d = vec3(0.263, 0.416, 0.557);
	return a.add(b.mul(cos(c.mul(t).add(d).mul(6.28318))));
});

const starColorNode = Fn(() => {
	const uv0 = uv().mul(2.0).sub(1.0);
	const len0 = length(uv0);

	let p: any = uv0;
	let finalColor: any = vec3(0.0, 0.0, 0.0);

	for (let i = 0; i < 4; i++) {
		p = fract(p.mul(1.5)).sub(0.5);

		let d: any = length(p).mul(exp(len0.negate()));
		const col = palette(len0.add(i * 0.4).add(time.mul(0.4)));

		d = sin(d.mul(5.0).add(time)).div(5.0);
		d = abs(d);
		d = pow(float(0.01).div(d), 1.2);

		finalColor = finalColor.add(col.mul(d));
	}

	return vec4(finalColor, 1.0);
})();

/**
 * TSL star shader for WebGPU.
 */
export const starTSL: ZylemTSLShader = {
	colorNode: starColorNode,
	transparent: false,
};
