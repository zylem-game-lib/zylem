import { debugVertexShader } from './vertex/debug.shader';

const fragment = `
varying vec3 vBarycentric;
uniform vec3 baseColor;
uniform vec3 wireframeColor;
uniform float wireframeThickness;

float edgeFactor() {
    vec3 d = fwidth(vBarycentric);
    vec3 a3 = smoothstep(vec3(0.0), d * wireframeThickness, vBarycentric);
    return min(min(a3.x, a3.y), a3.z);
}

void main() {
    float edge = edgeFactor();

    vec3 wireColor = wireframeColor;

    vec3 finalColor = mix(wireColor, baseColor, edge);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export const debugShader = {
    vertex: debugVertexShader,
    fragment
};
