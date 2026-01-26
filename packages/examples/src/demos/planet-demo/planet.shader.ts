import { objectVertexShader } from '@zylem/game-lib';

const fragment = `
#include <common>

precision highp float;

uniform float iTime;
varying vec2 vUv;

// ---- Constants ----
const vec3 colorA = vec3(0.02, 0.10, 0.60);
const vec3 colorB = vec3(0.03, 0.22, 0.80);
const vec3 colorC = vec3(0.05, 0.30, 0.95);
const float speed = 0.3;

// --------------------------------------------------
// Cheaper 3D hash
float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

// Value noise (3D)
float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(
            mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
            mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x),
            f.y
        ),
        mix(
            mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
            mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x),
            f.y
        ),
        f.z
    );
}

// Reduced FBM (4 octaves)
float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(x);
        x = x * 2.0 + 1.7;
        a *= 0.5;
    }
    return v;
}

vec3 uvTo3D(vec2 uv) {
    float theta = uv.x * 6.2831853;
    float phi   = uv.y * 3.1415926;

    return vec3(
        sin(phi) * cos(theta),
        sin(phi) * sin(theta),
        cos(phi)
    );
}

void main() {
    float time = iTime * speed;

    vec3 pos = uvTo3D(vUv);

    // Animate cheaply
    vec3 t = vec3(cos(time * 0.2), sin(time * 0.2), sin(time * 0.2));
    pos += t;

    // Single FBM
    float n = fbm(pos + time * 0.02);

    // Derived variation (no second FBM)
    vec3 q = vec3(n, sin(n * 3.0), cos(n * 3.0));

    vec3 col = mix(colorA, colorB, clamp(q.x, 0.0, 1.0));
    col = mix(col, colorC, clamp(q.y * 0.5 + 0.5, 0.0, 1.0));

    float light = smoothstep(0.2, 0.8, n);
    col *= light * 0.9 + 0.3;

    gl_FragColor = vec4(col, 1.0);
}
`;

export const planetShader = {
    vertex: objectVertexShader,
    fragment
};
