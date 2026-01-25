import { objectVertexShader } from '@zylem/game-lib';

const fragment = `
#include <common>

precision highp float;

uniform float iTime;
varying vec2 vUv;

// ---- Constants ----
const vec3 colorA = vec3(0.02, 0.10, 0.45); // deep shadow blue
const vec3 colorB = vec3(0.03, 0.22, 0.80); // core Zylem blue
const vec3 colorC = vec3(0.05, 0.30, 0.95); // highlight / glow blue
const bool discomode = false;
const float speed = 0.3;

float rand(vec4 p) {
    return fract(
        sin(dot(p, vec4(1234.0, 2345.0, 3456.0, 4567.0))) * 5678.0
    );
}

float smoothnoise(vec4 p) {
    const vec2 e = vec2(0.0, 1.0);
    vec4 i = floor(p);
    vec4 f = fract(p);

    f = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(
            mix(mix(rand(i + e.xxxx), rand(i + e.yxxx), f.x),
                mix(rand(i + e.xyxx), rand(i + e.yyxx), f.x), f.y),
            mix(mix(rand(i + e.xxyx), rand(i + e.yxyx), f.x),
                mix(rand(i + e.xyyx), rand(i + e.yyyx), f.x), f.y),
            f.z
        ),
        mix(
            mix(mix(rand(i + e.xxxy), rand(i + e.yxxy), f.x),
                mix(rand(i + e.xyxy), rand(i + e.yyxy), f.x), f.y),
            mix(mix(rand(i + e.xxyy), rand(i + e.yxyy), f.x),
                mix(rand(i + e.xyyy), rand(i + e.yyyy), f.x), f.y),
            f.z
        ),
        f.w
    );
}

float fbm(vec3 x) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(1.0);

    for (int i = 0; i < 10; i++) {
        v += a * smoothnoise(
            vec4(x, cos(iTime * speed * 0.002) * 200.0)
        );
        x = x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

vec3 uvTo3D(vec2 uv) {
    float theta = uv.x * 6.28318530718;
    float phi   = uv.y * 3.14159265359;

    return vec3(
        sin(phi) * cos(theta),
        sin(phi) * sin(theta),
        cos(phi)
    );
}

void main() {
    float time = iTime * speed;

    vec3 col_a = colorA;
    vec3 col_b = colorB;
    vec3 col_c = colorC;

    if (discomode) {
        col_a = vec3(sin(time), sin(time + 7.0), cos(time));
        col_b = vec3(cos(time), cos(time + 7.0), sin(time));
        col_c = vec3(sin(time), cos(time), sin(time + 0.5));
    }

    vec3 pos = uvTo3D(vUv);

    pos += vec3(
        cos(time / 5.0),
        sin(time / 5.0),
        sin(time / 5.0)
    );

    float fbmm = fbm(pos);
    vec3 q = vec3(fbmm, sin(fbmm), cos(fbmm));
    vec3 r = q;

    float v = fbm(pos + 5.0 * r + time * 0.005);

    vec3 res_color = mix(col_a, col_b, clamp(r.x, 0.0, 1.0));
    res_color = mix(res_color, col_c, clamp(q.x, 0.0, 1.0));

    float poss = v * 2.0 - 1.0;
    res_color = mix(res_color, vec3(1.0), clamp(poss, 0.0, 1.0));
    res_color = mix(res_color, vec3(0.0), clamp(-poss, 0.0, 1.0));

    res_color /= max(max3(res_color), 1e-3);

    float vv = clamp(v, 0.0, 1.0);
    float intensity =
        clamp(0.4 * vv * vv * vv + vv * vv + 0.5 * vv, 0.0, 1.0) * 0.9 + 0.1;

    gl_FragColor = vec4(res_color * intensity, 1.0);
}
`;

export const planetShader = {
    vertex: objectVertexShader,
    fragment
};
