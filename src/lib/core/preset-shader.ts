/* Fragment Shaders **/
import starsTest from '../graphics/shaders/fragment/stars.glsl';
import fireFragment from '../graphics/shaders/fragment/fire.glsl';
import fragmentShader from '../graphics/shaders/fragment/standard.glsl';
import debugFragment from '../graphics/shaders/fragment/debug.glsl';

/* Vertex Shaders **/
import vertexShader from '../graphics/shaders/vertex/object-shader.glsl';
import debugVertexShader from '../graphics/shaders/vertex/debug.glsl';

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

export const debugShader: ZylemShaderObject = {
	fragment: debugFragment,
	vertex: debugVertexShader
};

export type ZylemShaderType = 'standard' | 'fire' | 'star' | 'debug';

const shaderMap: Map<ZylemShaderType, ZylemShaderObject> = new Map();
shaderMap.set('standard', standardShader);
shaderMap.set('fire', fireShader);
shaderMap.set('star', starShader);
shaderMap.set('debug', debugShader);

export default shaderMap;