import { objectVertexShader } from '@zylem/game-lib';

const fragment = `
precision highp float;

uniform float iTime;
varying vec2 vUv;

// Star colors
const vec3 starColorWarm  = vec3(1.0, 0.9, 0.7);
const vec3 starColorCool  = vec3(0.7, 0.85, 1.0);
const vec3 starColorWhite = vec3(1.0);
const vec3 backgroundColor = vec3(0.01, 0.01, 0.03);

// --------------------------------------------------
// Hash
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// --------------------------------------------------
// Cheap star layer (1 star per cell)
float starLayer(vec2 uv, float scale, float time) {
    vec2 grid = uv * scale;
    vec2 id = floor(grid);
    vec2 f = fract(grid) - 0.5;

    float h = hash(id);

    // Sparse stars
    if (h < 0.85) return 0.0;

    // Jittered star position
    vec2 starPos = vec2(hash(id + 1.3), hash(id + 2.1)) - 0.5;
    vec2 d = f - starPos;

    float dist = length(d);

    // --------------------------------------------------
    // Size tiers
    bool bigStar = h > 0.985;        // ~1.5% chance
    bool midStar = h > 0.94;         // medium stars

    float baseSize = mix(0.012, 0.02, h);

    float size = baseSize;
    if (midStar) size *= 1.1;
    if (bigStar) size *= 2.5;

    // Core + glow
    float core = max(0.0, 1.0 - dist / size);

    float glowRadius = size * (bigStar ? 8.0 : 4.0);
    float glowStrength = bigStar ? 0.35 : 0.15;

    float glow = max(0.0, 1.0 - dist / glowRadius) * glowStrength;

    // Twinkle (big stars twinkle slower)
    float twinkleSpeed = bigStar ? 0.4 : 0.8;
    float twinkle = 0.6 + 0.4 * sin(time * (twinkleSpeed + h) + h * 6.28);

    return (core + glow) * twinkle;
}

void main() {
    float time = iTime;
    vec2 uv = vUv;

    // ---- Background ----
    vec3 color = backgroundColor;

    // Subtle nebula tint (cheap)
    float nebula = sin(uv.x * 2.0 + time * 0.02)
                 * sin(uv.y * 1.5 - time * 0.01);
    nebula = nebula * 0.5 + 0.5;
    color += vec3(0.01, 0.005, 0.02) * nebula;

    // ---- Star layers ----
    float starsA = starLayer(uv, 60.0, time);
    float starsB = starLayer(uv + 0.37, 120.0, time * 0.8);
    float starsC = starLayer(uv + 0.71, 240.0, time * 0.6);

    float allStars = starsA + starsB * 0.6 + starsC * 0.35;

    // ---- Star color ----
    float colorMix = hash(floor(uv * 60.0));
    vec3 starCol = mix(starColorWarm, starColorCool, colorMix);
    starCol = mix(starCol, starColorWhite, 0.5);

    color += starCol * allStars;

    gl_FragColor = vec4(color, 1.0);
}
`;

export const starfieldShader = {
    vertex: objectVertexShader,
    fragment
};
