import { objectVertexShader } from '@zylem/game-lib';

const fragment = `
#include <common>

precision highp float;

uniform float iTime;
varying vec2 vUv;

// ---- Ring palette ----
const vec3 ringA = vec3(0.85, 0.25, 0.15);
const vec3 ringB = vec3(0.55, 0.15, 0.10);
const vec3 ringC = vec3(0.30, 0.07, 0.05);

const vec3 dustColor = vec3(0.8, 0.35, 0.22);
const vec3 rockHighlight = vec3(0.95, 0.55, 0.35);

const float speed = 0.3;

// --------------------------------------------------
// Cheap hash / noise
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1, 0));
    float c = hash(i + vec2(0, 1));
    float d = hash(i + vec2(1, 1));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// 2-octave FBM (cheap)
float fbm2(vec2 p) {
    float v = 0.0;
    v += 0.6 * noise(p);
    v += 0.4 * noise(p * 2.0 + 5.7);
    return v;
}

// --------------------------------------------------
// Simplified rocks (no FBM, no normals)
float orbitingRocks(vec2 uv, float time, out float shade) {
    vec2 p = uv * 45.0;
    vec2 cell = floor(p);
    vec2 local = fract(p) - 0.5;

    float h = hash(cell);

    // Early sparse rejection
    if (h < 0.85) {
        shade = 0.0;
        return 0.0;
    }

    float angle = h * 6.28318 + time * 0.03;
    vec2 offset = vec2(cos(angle), sin(angle)) * 0.08;

    vec2 d = local - offset;
    float dist = length(d);

    float size = mix(0.06, 0.12, h * h);

    // Irregular edge (cheap)
    float edgeNoise = noise(d * 8.0 + h * 10.0);
    float distorted = dist + (edgeNoise - 0.5) * size * 0.25;

    float mask = smoothstep(size, size * 0.6, distorted);

    // Fake lighting
    float centerFalloff = clamp(1.0 - dist / size, 0.0, 1.0);
    float rim = smoothstep(0.6, 1.0, dist / size);

    shade = centerFalloff * 0.8 + rim * 0.3;

    return mask;
}

// --------------------------------------------------
// Cheaper orbital dust (no atan)
float orbitalDust(vec2 uv, float time) {
    vec2 c = uv - 0.5;
    float r = length(c);

    float n = fbm2(vec2(r * 10.0, time * 0.05));
    return smoothstep(0.55, 0.65, n);
}

// --------------------------------------------------
void main() {
    float time = iTime * speed;
    vec2 uv = vUv;

    vec2 centered = uv - 0.5;
    float radialDist = length(centered) * 2.0;

    // ---- Radial mask ----
    float innerFade = smoothstep(0.42, 0.48, radialDist);
    float outerFade = smoothstep(0.95, 0.88, radialDist);
    float ringMask = innerFade * outerFade;

    // ---- Bands ----
    float bandNoise = fbm2(vec2(radialDist * 5.0, 0.0));
    float bands = sin(radialDist * 24.0 + bandNoise * 2.0) * 0.5 + 0.5;

    vec3 baseRing = mix(ringA, ringB, bands);
    baseRing = mix(baseRing, ringC, bandNoise * 0.4);
    baseRing *= 0.75 + 0.25 * bandNoise;

    // ---- Dust ----
    float dust = orbitalDust(uv, time) * ringMask * 0.008;
    vec3 dustCol = dustColor * dust;

    // ---- Rocks ----
    float rockShade;
    float rocks = orbitingRocks(uv, time, rockShade) * ringMask;
    vec3 rockCol = mix(baseRing, rockHighlight, rockShade);

    // ---- Combine ----
    vec3 finalColor = baseRing * ringMask;
    finalColor += dustCol;
    finalColor = mix(finalColor, rockCol, rocks);

    float alpha = ringMask * (0.5 + rocks * 0.35 + dust * 0.2);
    alpha = clamp(alpha, 0.0, 0.4);

    gl_FragColor = vec4(finalColor, alpha);
}
`;

export const ringShader = {
    vertex: objectVertexShader,
    fragment
};
