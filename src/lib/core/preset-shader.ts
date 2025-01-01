/* Fragment Shaders **/
import starsTest from '../graphics/shaders/fragment/stars.glsl';
import fireFragment from '../graphics/shaders/fragment/fire.glsl';
import fragmentShader from '../graphics/shaders/fragment/standard.glsl';

/* Vertex Shaders **/
import vertexShader from '../graphics/shaders/vertex/object-shader.glsl';

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
};

export type ZylemShaderType = 'standard' | 'fire' | 'star';

const shaderMap: Map<ZylemShaderType, ZylemShaderObject> = new Map();
shaderMap.set('standard', standardShader);
shaderMap.set('fire', fireShader);
shaderMap.set('star', starShader);

export default shaderMap;