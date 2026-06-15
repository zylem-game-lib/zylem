/**
 * Arena skybox shader in TSL (WebGPU). Port of the former GLSL
 * `stage-background-shader.shader`.
 *
 * The view direction comes from the world-space position of the skybox cube
 * (`positionWorld`, normalized) instead of the old `vWorldPosition` varying.
 * Everything else is rebuilt in spherical coordinates: a reddish Mars sky with
 * starfield, a Milky Way band, a spiral galaxy, a small red moon, a warm
 * horizon glow, and a layered mountain/desert ground below the horizon.
 */
import {
	Fn,
	time,
	positionWorld,
	vec2,
	vec3,
	vec4,
	float,
	floor,
	fract,
	sin,
	atan,
	asin,
	abs,
	exp,
	pow,
	step,
	clamp,
	dot,
	length,
	max,
	mix,
	smoothstep,
	normalize,
} from 'three/tsl';
import type { ZylemTSLShader } from '@zylem/game-lib/graphics';

const TAU = 6.28318530718;
const PI = 3.14159265359;
const HORIZON = -0.18;

// Pre-rotated Milky Way band (theta = -0.55 rad).
const COS_T = Math.cos(-0.55);
const SIN_T = Math.sin(-0.55);

// ── hashing / noise ──────────────────────────────────────────────────────

const hash21 = Fn(([p]: [any]) => {
	const q = fract(p.mul(vec2(234.34, 435.345)));
	const q2 = q.add(dot(q, q.add(34.23)));
	return fract(q2.x.mul(q2.y));
});

const noise2 = Fn(([p]: [any]) => {
	const i = floor(p);
	const f = fract(p);

	const a = hash21(i);
	const b = hash21(i.add(vec2(1.0, 0.0)));
	const c = hash21(i.add(vec2(0.0, 1.0)));
	const d = hash21(i.add(vec2(1.0, 1.0)));

	const u = f.mul(f).mul(float(3.0).sub(f.mul(2.0)));
	return mix(a, b, u.x)
		.add(c.sub(a).mul(u.y).mul(float(1.0).sub(u.x)))
		.add(d.sub(b).mul(u.x).mul(u.y));
});

const fbm = Fn(([p]: [any]) => {
	let v = float(0.0);
	let a = float(0.5);
	let pp = p;
	v = v.add(a.mul(noise2(pp)));
	pp = pp.mul(2.02);
	a = a.mul(0.5);
	v = v.add(a.mul(noise2(pp)));
	pp = pp.mul(2.03);
	a = a.mul(0.5);
	v = v.add(a.mul(noise2(pp)));
	pp = pp.mul(2.01);
	a = a.mul(0.5);
	v = v.add(a.mul(noise2(pp)));
	return v;
});

// 1D ridged noise — used for mountain silhouette heights.
const ridged1 = Fn(([x]: [any]) => {
	const base = noise2(vec2(x, 0.0));
	return float(1.0).sub(abs(base.mul(2.0).sub(1.0)));
});

// ── palettes ──────────────────────────────────────────────────────────────

const skyColor = Fn(([h]: [any]) => {
	const top = vec3(0.005, 0.005, 0.02);
	const mid = vec3(0.025, 0.015, 0.055);
	const horizon = vec3(0.28, 0.11, 0.06);
	const c = mix(horizon, mid, smoothstep(0.0, 0.22, h));
	return mix(c, top, smoothstep(0.22, 1.0, h));
});

const desertBase = Fn(([h]: [any]) => {
	const far = vec3(0.3, 0.13, 0.07);
	const mid = vec3(0.56, 0.23, 0.09);
	const near = vec3(0.8, 0.38, 0.16);
	const c = mix(far, mid, smoothstep(0.0, 0.35, h));
	return mix(c, near, smoothstep(0.35, 0.95, h));
});

// ── stars / galaxy ──────────────────────────────────────────────────────────

const stars = Fn(([uvIn, threshold]: [any, any]) => {
	const gv = fract(uvIn).sub(0.5);
	const id = floor(uvIn);
	const n = hash21(id);
	const star = smoothstep(threshold, float(1.0), n);
	const d = length(gv);
	const sparkle = float(0.0028).div(d.mul(d).add(0.0025));
	const tw = float(0.75).add(
		sin(time.mul(n.add(0.4)).add(n.mul(TAU))).mul(0.25),
	);
	return star.mul(sparkle).mul(tw);
});

const milkyBand = Fn(([p]: [any]) => {
	const ps = vec2(p.x.mul(1.3), p.y);
	const band = exp(abs(ps.y).mul(5.5).negate());
	const n = fbm(ps.mul(3.0).add(vec2(time.mul(0.008), 0.0)));
	return band.mul(float(0.35).add(n.mul(0.75)));
});

const spiralGalaxy = Fn(([p]: [any]) => {
	const r = length(p);
	const ang = atan(p.y, p.x);
	const arms = sin(ang.mul(2.5).add(r.mul(11.0)).sub(time.mul(0.04)));
	const core = exp(r.mul(7.5).negate());
	const disc = exp(abs(r.sub(0.18)).mul(8.5).negate());
	const dust = fbm(p.mul(7.0));
	return max(core.mul(1.7), disc.mul(float(0.55).add(arms.mul(0.55))).mul(dust));
});

const mountainHeight = Fn(([x, scale, amp, base]: [any, any, any, any]) => {
	const f = fbm(vec2(x.mul(scale), 0.0));
	const rd = ridged1(x.mul(scale).mul(1.7));
	return base.add(f.mul(0.6).add(rd.mul(0.4)).sub(0.5).mul(amp));
});

// ── main ──────────────────────────────────────────────────────────────────

const arenaColorNode = Fn(() => {
	const rd = normalize(positionWorld);

	const lon = atan(rd.z, rd.x);
	const lat = asin(clamp(rd.y, -1.0, 1.0));

	const sky = vec2(lon.div(TAU).add(0.5), lat.div(PI).add(0.5));
	const elev = lat.div(PI * 0.5);

	// ── SKY ──
	const h = clamp(elev.sub(HORIZON).div(1.0 - HORIZON), 0.0, 1.0);
	let skyC = skyColor(h);

	const s = stars(sky.mul(320.0), float(0.994))
		.mul(1.4)
		.add(stars(sky.mul(180.0).add(0.37), float(0.988)).mul(1.0))
		.add(stars(sky.mul(85.0).add(0.71), float(0.978)).mul(0.8));
	skyC = skyC.add(vec3(s, s, s));

	const mw0 = sky.sub(vec2(0.3, 0.58)).mul(3.0);
	const mw = vec2(
		mw0.x.mul(COS_T).add(mw0.y.mul(SIN_T)),
		mw0.x.mul(-SIN_T).add(mw0.y.mul(COS_T)),
	);
	const band = milkyBand(mw);
	skyC = skyC
		.add(vec3(0.22, 0.15, 0.32).mul(band).mul(1.7))
		.add(vec3(0.45, 0.3, 0.22).mul(band).mul(0.75))
		.add(
			vec3(0.95, 0.92, 0.98)
				.mul(band)
				.mul(stars(sky.mul(560.0), float(0.982)))
				.mul(1.2),
		);

	const gP = sky.sub(vec2(0.36, 0.68)).mul(4.0);
	const galaxy = spiralGalaxy(gP);
	skyC = skyC
		.add(vec3(0.85, 0.42, 0.95).mul(galaxy).mul(1.4))
		.add(vec3(0.95, 0.58, 0.8).mul(galaxy).mul(0.6))
		.add(
			vec3(1.0, 0.85, 0.7)
				.mul(pow(max(float(0.0), float(1.0).sub(length(gP).mul(5.5))), float(8.0)))
				.mul(2.4),
		);

	const moonP = sky.sub(vec2(0.78, 0.6)).mul(vec2(4.5, 2.5));
	const moonD = length(moonP);
	const moon = smoothstep(0.14, 0.11, moonD);
	const shade = clamp(
		dot(
			normalize(vec3(moonP.x, moonP.y, 0.25)),
			normalize(vec3(-0.7, 0.3, 1.0)),
		),
		0.0,
		1.0,
	);
	skyC = mix(skyC, vec3(0.6, 0.26, 0.18).mul(float(0.35).add(shade.mul(0.65))), moon);
	skyC = skyC.add(vec3(0.32, 0.12, 0.09).mul(smoothstep(0.3, 0.14, moonD)).mul(0.35));

	const glow = exp(abs(elev.sub(HORIZON)).mul(14.0).negate());
	skyC = skyC.add(vec3(0.55, 0.22, 0.1).mul(glow).mul(0.55));

	// ── MARS SURFACE ──
	const groundH = clamp(float(HORIZON).sub(elev).div(HORIZON + 1.0), 0.0, 1.0);
	let groundC = desertBase(groundH);

	const m1 = mountainHeight(lon.add(0.0), float(1.6), float(0.05), float(HORIZON - 0.015));
	const m2 = mountainHeight(lon.add(1.7), float(1.1), float(0.085), float(HORIZON - 0.055));
	const m3 = mountainHeight(lon.add(3.3), float(0.7), float(0.12), float(HORIZON - 0.1));

	const k1 = smoothstep(0.0, 0.006, m1.sub(elev));
	const k2 = smoothstep(0.0, 0.006, m2.sub(elev));
	const k3 = smoothstep(0.0, 0.008, m3.sub(elev));

	groundC = mix(groundC, vec3(0.26, 0.12, 0.07), k1);
	groundC = mix(groundC, vec3(0.38, 0.17, 0.08), k2);
	groundC = mix(groundC, vec3(0.5, 0.22, 0.1), k3);

	const rocks = fbm(sky.mul(vec2(42.0, 22.0)));
	groundC = groundC.mul(float(0.88).add(rocks.mul(0.24)));

	const peb = hash21(sky.mul(420.0));
	groundC = groundC.mul(float(0.94).add(step(0.92, peb).mul(0.18)));

	const haze = exp(abs(elev.sub(HORIZON)).mul(18.0).negate());
	groundC = mix(groundC, vec3(0.48, 0.22, 0.11), haze.mul(0.35));

	const vig = float(1.0).add(elev.mul(0.6));
	groundC = groundC.mul(clamp(vig, 0.6, 1.0));

	// Select sky vs ground by horizon, then a gentle filmic curve.
	const col = elev.greaterThan(float(HORIZON)).select(skyC, groundC);
	const graded = pow(col, vec3(0.92, 0.92, 0.92));

	return vec4(graded, float(1.0));
})();

/**
 * TSL arena skybox shader for WebGPU.
 */
export const arenaTSL: ZylemTSLShader = {
	colorNode: arenaColorNode,
	transparent: false,
};
