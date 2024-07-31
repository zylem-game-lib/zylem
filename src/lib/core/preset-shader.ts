/* Fragment Shaders **/
import starsTest from '../rendering/shaders/fragment/stars.glsl';
import fireFragment from '../rendering/shaders/fragment/fire.glsl';
import fragmentShader from '../rendering/shaders/fragment/standard.glsl';

/* Vertex Shaders **/
import vertexShader from '../rendering/shaders/vertex/object-shader.glsl';

export type ZylemShaderObject = { fragment: string, vertex: string };

export const starShader: ZylemShaderObject = {
	fragment: starsTest,
	vertex: vertexShader
};

export const fireShader: ZylemShaderObject = {
	fragment: fireFragment,
	vertex: vertexShader
};

export const standardShader: ZylemShaderObject = {
	fragment: fragmentShader,
	vertex: vertexShader
}

export type ZylemShaderType = 'standard' | 'fire' | 'star';

const shaderMap: Map<ZylemShaderType, ZylemShaderObject> = new Map();
shaderMap.set('standard', standardShader);
shaderMap.set('fire', fireShader);
shaderMap.set('star', starShader);

export default shaderMap;