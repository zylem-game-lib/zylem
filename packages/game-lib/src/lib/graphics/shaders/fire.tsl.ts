/**
 * Fire / plasma shader in TSL (WebGPU). Port of the former GLSL `fire.shader`.
 *
 * Uses surface `uv()` (0..1) and the `time` node, matching the old
 * `iResolution = (1,1,1)` default so `p = uv - 0.5`.
 */
import {
	Fn,
	uv,
	time,
	vec3,
	vec4,
	float,
	floor,
	fract,
	sin,
	atan,
	length,
	mix,
	mod,
	max,
	pow,
} from 'three/tsl';
import type { ZylemTSLShader } from '../material';

/** Simplex-ish 3D value noise (port of the GLSL `snoise`). */
const snoise = Fn(([uvIn, res]: [any, any]) => {
	const s = vec3(1.0, 100.0, 1000.0);
	const u = uvIn.mul(res);

	const u0 = floor(mod(u, res)).mul(s);
	const u1 = floor(mod(u.add(vec3(1.0, 1.0, 1.0)), res)).mul(s);

	const fRaw = fract(u);
	// TSL's strict types infer this chain as a scalar; it is a vec3 at runtime,
	// so widen to `any` to allow .x/.y/.z swizzles.
	const f: any = fRaw.mul(fRaw).mul(float(3.0).sub(fRaw.mul(2.0)));

	const v = vec4(
		u0.x.add(u0.y).add(u0.z),
		u1.x.add(u0.y).add(u0.z),
		u0.x.add(u1.y).add(u0.z),
		u1.x.add(u1.y).add(u0.z),
	);

	const r = fract(sin(v.mul(0.1)).mul(1000.0));
	const r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);

	const r2 = fract(sin(v.add(u1.z).sub(u0.z).mul(0.1)).mul(1000.0));
	const r1 = mix(mix(r2.x, r2.y, f.x), mix(r2.z, r2.w, f.x), f.y);

	return mix(r0, r1, f.z).mul(2.0).sub(1.0);
});

const fireColorNode = Fn(() => {
	const p = uv().sub(0.5);

	let color = float(3.0).sub(length(p.mul(2.0)).mul(3.0));

	const coord = vec3(
		atan(p.x, p.y).div(6.2832).add(0.5),
		length(p).mul(0.4),
		0.5,
	);

	const drift = vec3(0.0, time.mul(-0.05), time.mul(0.01));
	for (let i = 1; i <= 7; i++) {
		const power = Math.pow(2.0, i);
		color = color.add(
			float(1.5 / power).mul(snoise(coord.add(drift), float(power * 16.0))),
		);
	}

	const cmax = max(color, 0.0);
	return vec4(color, pow(cmax, 2.0).mul(0.4), pow(cmax, 3.0).mul(0.15), 1.0);
})();

/**
 * TSL fire shader for WebGPU.
 */
export const fireTSL: ZylemTSLShader = {
	colorNode: fireColorNode,
	transparent: false,
};
