import { objectVertexShader } from './vertex/object.shader';

const fragment = `
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
	vec4 texel = texture2D( tDiffuse, vUv );

	gl_FragColor = texel;
}
`;

export const standardShader = {
    vertex: objectVertexShader,
    fragment
};
