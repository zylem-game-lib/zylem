import { objectVertexShader } from '@zylem/game-lib';

/**
 * Arena skybox shader.
 *
 * The engine's skybox pipeline substitutes its own vertex shader and exposes
 * `vWorldPosition` (world-space vertex position on the 100000-unit cube) and
 * a single uniform `iTime`. We derive the view direction by normalising
 * `vWorldPosition`, then build everything in spherical coordinates so the
 * sky + ground seam hugs a true horizon line rather than a cube face.
 *
 * Visual target: reddish Mars surface with three distinct mountain-silhouette
 * bands fading into atmospheric haze, a dense starfield, a bright spiral
 * galaxy, a Milky Way band cutting diagonally, and a small red moon.
 */
const fragment = `
precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;

uniform float iTime;

#define TAU 6.28318530718
#define PI  3.14159265359

// ────────────────────────────── hashing / noise ──────────────────────────────

float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
}

float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a) * u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    v += a * noise2(p); p *= 2.02; a *= 0.5;
    v += a * noise2(p); p *= 2.03; a *= 0.5;
    v += a * noise2(p); p *= 2.01; a *= 0.5;
    v += a * noise2(p);
    return v;
}

// 1D ridged noise — used for mountain silhouette heights.
float ridged1(float x) {
    float base = noise2(vec2(x, 0.0));
    return 1.0 - abs(base * 2.0 - 1.0);
}

// ────────────────────────────── palettes ──────────────────────────────

vec3 skyColor(float h) {
    vec3 top     = vec3(0.005, 0.005, 0.020);
    vec3 mid     = vec3(0.025, 0.015, 0.055);
    vec3 horizon = vec3(0.280, 0.110, 0.060);

    vec3 c = mix(horizon, mid, smoothstep(0.0, 0.22, h));
    c = mix(c, top, smoothstep(0.22, 1.0, h));
    return c;
}

vec3 desertBase(float h) {
    vec3 far  = vec3(0.30, 0.13, 0.07);
    vec3 mid  = vec3(0.56, 0.23, 0.09);
    vec3 near = vec3(0.80, 0.38, 0.16);

    vec3 c = mix(far, mid, smoothstep(0.0, 0.35, h));
    c = mix(c, near, smoothstep(0.35, 0.95, h));
    return c;
}

// ────────────────────────────── stars ──────────────────────────────

// Soft-glow stars on a wrap-safe grid. 'threshold' controls density;
// higher values = sparser, brighter stars.
float stars(vec2 uv, float threshold) {
    vec2 gv = fract(uv) - 0.5;
    vec2 id = floor(uv);

    float n = hash21(id);
    float star = smoothstep(threshold, 1.0, n);

    float d = length(gv);
    float sparkle = 0.0028 / (d * d + 0.0025);

    // Slow per-star twinkle keyed off the cell hash.
    float tw = 0.75 + 0.25 * sin(iTime * (0.4 + n) + n * TAU);
    return star * sparkle * tw;
}

// ────────────────────────────── galaxy ──────────────────────────────

float milkyBand(vec2 p) {
    p.x *= 1.3;
    float band = exp(-abs(p.y) * 5.5);
    float n = fbm(p * 3.0 + vec2(iTime * 0.008, 0.0));
    return band * (0.35 + 0.75 * n);
}

float spiralGalaxy(vec2 p) {
    float r = length(p);
    float a = atan(p.y, p.x);

    float arms  = sin(a * 2.5 + r * 11.0 - iTime * 0.04);
    float core  = exp(-r * 7.5);
    float disc  = exp(-abs(r - 0.18) * 8.5);
    float dust  = fbm(p * 7.0);
    return max(core * 1.7, disc * (0.55 + 0.55 * arms) * dust);
}

// ────────────────────────────── landscape ──────────────────────────────

float mountainHeight(float x, float scale, float amp, float base) {
    // Blend fbm with a ridged variant so the crest line has sharper peaks.
    float f  = fbm(vec2(x * scale, 0.0));
    float rd = ridged1(x * scale * 1.7);
    return base + (f * 0.6 + rd * 0.4 - 0.5) * amp;
}

// ────────────────────────────── main ──────────────────────────────

void main() {
    // Direction from world origin to this skybox texel. The skybox cube is
    // scaled to 100000 units, so vWorldPosition dominates any camera
    // offset and normalising gives a stable view direction.
    vec3 rd = normalize(vWorldPosition);

    // Equirectangular mapping for star / galaxy / mountain lookups.
    float lon = atan(rd.z, rd.x);
    float lat = asin(clamp(rd.y, -1.0, 1.0));

    vec2 sky;
    sky.x = lon / TAU + 0.5;
    sky.y = lat / PI  + 0.5;

    // Elevation in [-1, 1]: -1 = straight down, 0 = horizon, 1 = zenith.
    float elev = lat / (PI * 0.5);

    // Horizon sits slightly below centre so the sky reads as ~60% of view.
    const float HORIZON = -0.18;

    vec3 col = vec3(0.0);

    if (elev > HORIZON) {
        // ═══════════════════════════ SKY ═══════════════════════════
        float h = clamp((elev - HORIZON) / (1.0 - HORIZON), 0.0, 1.0);
        col = skyColor(h);

        // Dense, multi-scale starfield. Coordinates come from the
        // equirectangular uv so stars wrap cleanly around the dome.
        float s  = 0.0;
        s += stars(sky * 320.0, 0.994) * 1.4;
        s += stars(sky * 180.0 + 0.37, 0.988) * 1.0;
        s += stars(sky *  85.0 + 0.71, 0.978) * 0.8;
        col += vec3(s);

        // Milky-way band — rotated so it cuts diagonally from upper-left
        // down through the scene, echoing the reference backdrop.
        vec2 mw = (sky - vec2(0.30, 0.58)) * 3.0;
        float theta = -0.55;
        mat2 rot = mat2(cos(theta), -sin(theta), sin(theta), cos(theta));
        mw = rot * mw;

        float band = milkyBand(mw);
        col += vec3(0.22, 0.15, 0.32) * band * 1.7;
        col += vec3(0.45, 0.30, 0.22) * band * 0.75;
        // Extra fine stars inside the band for texture.
        col += vec3(0.95, 0.92, 0.98) * band * stars(sky * 560.0, 0.982) * 1.2;

        // Prominent purple spiral galaxy, anchored lower-left of the sky.
        vec2 gP = (sky - vec2(0.36, 0.68)) * 4.0;
        float galaxy = spiralGalaxy(gP);
        col += vec3(0.85, 0.42, 0.95) * galaxy * 1.4;           // magenta arms
        col += vec3(0.95, 0.58, 0.80) * galaxy * 0.6;           // pink mid
        col += vec3(1.00, 0.85, 0.70)                           // hot core
               * pow(max(0.0, 1.0 - length(gP) * 5.5), 8.0) * 2.4;

        // Small red moon in the upper-right.
        vec2 moonP = (sky - vec2(0.78, 0.60)) * vec2(4.5, 2.5);
        float moonD = length(moonP);
        float moon  = smoothstep(0.14, 0.11, moonD);
        float shade = clamp(
            dot(normalize(vec3(moonP, 0.25)), normalize(vec3(-0.7, 0.3, 1.0))),
            0.0, 1.0);
        col = mix(col, vec3(0.60, 0.26, 0.18) * (0.35 + 0.65 * shade), moon);
        col += vec3(0.32, 0.12, 0.09) * smoothstep(0.30, 0.14, moonD) * 0.35;

        // Warm horizon glow — sells the Mars sunset atmosphere.
        float glow = exp(-abs(elev - HORIZON) * 14.0);
        col += vec3(0.55, 0.22, 0.10) * glow * 0.55;
    } else {
        // ═══════════════════════════ MARS SURFACE ═══════════════════════════
        // Distance from horizon, normalised so groundH = 0 at horizon and
        // 1 at the bottom of the view.
        float groundH = clamp((HORIZON - elev) / (HORIZON + 1.0), 0.0, 1.0);
        col = desertBase(groundH);

        // Three layered mountain silhouettes. Furthest layer is tiny and
        // hazy; nearest layer is taller and more saturated. Each layer
        // uses an independent ridged-noise crest across longitude.
        float m1 = mountainHeight(lon + 0.00, 1.6, 0.050, HORIZON - 0.015);
        float m2 = mountainHeight(lon + 1.70, 1.1, 0.085, HORIZON - 0.055);
        float m3 = mountainHeight(lon + 3.30, 0.7, 0.120, HORIZON - 0.100);

        vec3 mountFar  = vec3(0.26, 0.12, 0.07);
        vec3 mountMid  = vec3(0.38, 0.17, 0.08);
        vec3 mountNear = vec3(0.50, 0.22, 0.10);

        float k1 = smoothstep(0.0, 0.006, m1 - elev);
        float k2 = smoothstep(0.0, 0.006, m2 - elev);
        float k3 = smoothstep(0.0, 0.008, m3 - elev);

        col = mix(col, mountFar,  k1);
        col = mix(col, mountMid,  k2);
        col = mix(col, mountNear, k3);

        // Coarse rock texture across the whole ground.
        float rocks = fbm(sky * vec2(42.0, 22.0));
        col *= 0.88 + rocks * 0.24;

        // High-frequency pebbles speckling the surface.
        float peb = hash21(sky * 420.0);
        col *= 0.94 + step(0.92, peb) * 0.18;

        // Subtle warm haze right above the surface to sell distance.
        float haze = exp(-abs(elev - HORIZON) * 18.0);
        col = mix(col, vec3(0.48, 0.22, 0.11), haze * 0.35);

        // Gentle vignette pulling the eye toward the horizon.
        float vig = 1.0 + elev * 0.6;
        col *= clamp(vig, 0.6, 1.0);
    }

    // Gentle filmic curve.
    col = pow(col, vec3(0.92));

    gl_FragColor = vec4(col, 1.0);
}`;

export const arenaShader = {
	vertex: objectVertexShader,
	fragment,
};
