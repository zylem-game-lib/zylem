import { objectVertexShader } from '@zylem/game-lib';

const fragment = `
precision highp float;

uniform float iTime;
varying vec2 vUv;

// Star colors
const vec3 starColorWarm = vec3(1.0, 0.9, 0.7);
const vec3 starColorCool = vec3(0.7, 0.85, 1.0);
const vec3 starColorWhite = vec3(1.0, 1.0, 1.0);
const vec3 backgroundColor = vec3(0.01, 0.01, 0.03);

// Hash functions for star placement
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash3(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

// Star layer - creates static stars with twinkling
float starLayer(vec2 uv, float scale, float time) {
    float brightness = 0.0;
    
    vec2 gridUV = uv * scale;
    vec2 id = floor(gridUV);
    vec2 f = fract(gridUV) - 0.5;
    
    // Check neighboring cells
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(float(x), float(y));
            vec2 cellId = id + offset;
            
            float h = hash(cellId);
            
            // Only some cells have stars
            if (h > 0.85) {
                // Star position within cell
                vec2 starPos = offset + vec2(hash(cellId + 0.1), hash(cellId + 0.2)) - 0.5;
                starPos -= f;
                
                float d = length(starPos);
                
                // Star size varies
                float starSize = 0.01 + hash(cellId + 0.3) * 0.02;
                
                // Twinkle - slow pulsing glow
                float twinkleSpeed = 0.5 + hash(cellId + 0.4) * 1.5;
                float twinklePhase = hash(cellId + 0.5) * 6.28;
                float twinkle = 0.5 + 0.5 * sin(time * twinkleSpeed + twinklePhase);
                
                // Second slower twinkle layer
                float slowTwinkle = 0.7 + 0.3 * sin(time * 0.2 + twinklePhase * 2.0);
                twinkle *= slowTwinkle;
                
                // Star brightness falloff
                float starBrightness = smoothstep(starSize, 0.0, d);
                
                // Glow around bright stars
                float glow = smoothstep(starSize * 4.0, 0.0, d) * 0.15;
                
                brightness += (starBrightness + glow) * twinkle;
            }
        }
    }
    
    return brightness;
}

void main() {
    float time = iTime;
    
    // Use spherical UV mapping for skybox
    vec2 uv = vUv;
    
    // Deep space background
    vec3 color = backgroundColor;
    
    // Very subtle nebula-like color variation
    float nebulaTime = time * 0.02;
    float nebula = sin(uv.x * 3.0 + nebulaTime) * sin(uv.y * 2.0 - nebulaTime * 0.5);
    nebula = nebula * 0.5 + 0.5;
    color += vec3(0.01, 0.005, 0.02) * nebula;
    
    // Multiple star layers at different scales
    float stars1 = starLayer(uv, 50.0, time);
    float stars2 = starLayer(uv + 0.33, 100.0, time * 0.8);
    float stars3 = starLayer(uv + 0.67, 200.0, time * 0.6);
    
    // Dim distant stars
    float stars4 = starLayer(uv + 0.5, 400.0, time * 0.4) * 0.3;
    
    // Color variation for stars
    float colorMix = hash(floor(uv * 50.0));
    vec3 starCol = mix(starColorWarm, starColorCool, colorMix);
    starCol = mix(starCol, starColorWhite, 0.5);
    
    // Combine star layers
    float allStars = stars1 + stars2 * 0.7 + stars3 * 0.4 + stars4;
    color += starCol * allStars;
    
    // Occasional bright star with color
    float brightStars = starLayer(uv + 0.1, 25.0, time);
    vec3 brightColor = mix(starColorWarm, starColorCool, hash(floor(uv * 25.0)));
    color += brightColor * brightStars * 1.5;
    
    gl_FragColor = vec4(color, 1.0);
}
`;

export const starfieldShader = {
    vertex: objectVertexShader,
    fragment
};
