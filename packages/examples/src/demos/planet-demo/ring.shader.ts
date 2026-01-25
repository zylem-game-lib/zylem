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
// Hash / noise helpers
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec3 p) {
    return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453);
}

float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}

float rockNoise(vec2 p) {
    // Low-frequency noise for shape breakup
    return fbm(vec3(p * 6.0, 0.0));
}

// --------------------------------------------------
// Small, slow orbiting rocks with fake 3D shading
float orbitingRocks(vec2 uv, float time, out float rockShade) {
    vec2 p = uv * 55.0;
    vec2 cell = floor(p);
    vec2 local = fract(p) - 0.5;

    float h = hash(cell);

    // Sparse rocks
    if (h < 0.82) {
        rockShade = 0.0;
        return 0.0;
    }

    // Very slow orbital motion
    float angle = h * 6.28318 + time * (0.025 + h * 0.05);
    vec2 offset = vec2(cos(angle), sin(angle)) * 0.10;

    vec2 d = local - offset;
    float dist = length(d);

    // Rock size
    float size = mix(0.06, 0.14, pow(h, 3.0));

    // --------- SHAPE BREAKUP ----------
    // Irregular silhouette
    float n = rockNoise(d + h * 10.0);
    float distortedDist = dist + (n - 0.5) * size * 0.35;

    float mask = smoothstep(size, size * 0.55, distortedDist);

    // --------- FAKE 3D NORMAL ----------
    float z = sqrt(max(0.0, 1.0 - (distortedDist / size) * (distortedDist / size)));
    vec3 normal = normalize(vec3(d / size, z));

    // Randomized light direction per rock
    float rot = h * 6.28318;
    vec3 lightDir = normalize(vec3(cos(rot), sin(rot), 0.7));

    float diffuse = clamp(dot(normal, lightDir), 0.0, 1.0);

    // Faceted lighting response
    float facet = pow(diffuse, mix(1.0, 2.5, h));
    rockShade = mix(0.35, 1.0, facet);

    // Rim / edge highlight (breaks "dot" look)
    float rim = pow(1.0 - z, 2.0);
    rockShade += rim * 0.25;

    return mask;
}


// --------------------------------------------------
// Calm orbital dust (angular drift only)
float orbitalDust(vec2 uv, float time) {
    vec2 centered = uv - 0.5;
    float r = length(centered);
    float a = atan(centered.y, centered.x);

    // Angular phase drift (no boiling)
    float phase = a + time * 0.015;
    float n = fbm(vec3(r * 8.0, phase, 0.0));

    return smoothstep(0.50, 0.62, n);
}

// --------------------------------------------------
void main() {
    float time = iTime * speed;
    vec2 uv = vUv;

    vec2 centered = uv - 0.5;
    float radialDist = length(centered) * 2.0;

    // ---- Strong radial mask with transparent edges ----
    float innerFade = smoothstep(0.40, 0.48, radialDist);
    float outerFade = smoothstep(0.95, 0.85, radialDist);
    float ringMask = innerFade * outerFade;

    // ---- Static banded structure (no time) ----
    float bandNoise = fbm(vec3(radialDist * 5.0, 0.0, 0.0));
    float bands =
        sin(radialDist * 26.0 + bandNoise * 3.0) * 0.5 + 0.5;

    vec3 baseRing = mix(ringA, ringB, bands);
    baseRing = mix(baseRing, ringC, bandNoise * 0.5);
    baseRing *= 0.7 + 0.3 * bandNoise;

    // ---- Dust layer ----
    float dust = orbitalDust(uv, time) * ringMask * 0.01;
    vec3 dustCol = dustColor * dust * 0.25;

    // ---- Rocks ----
    float rockShade;
    float rocks = orbitingRocks(uv, time, rockShade) * ringMask;
    vec3 rockCol = baseRing * rockShade;
    rockCol = mix(rockCol, rockHighlight, rocks * 0.6);

    // ---- Combine (IMPORTANT: mask color) ----
    vec3 finalColor = baseRing * ringMask;
    finalColor += dustCol;
    finalColor = mix(finalColor, rockCol, rocks);

    // ---- Alpha ----
    float alpha = ringMask * (0.55 + dust * 0.2 + rocks * 0.35);
    alpha = clamp(alpha, 0.0, 0.4);

    gl_FragColor = vec4(finalColor, alpha);
}
`;

export const ringShader = {
    vertex: objectVertexShader,
    fragment
};
