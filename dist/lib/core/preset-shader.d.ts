export type ZylemShaderObject = {
    fragment: string;
    vertex: string;
};
export type ZylemShaderType = 'standard' | 'fire' | 'star' | 'debug';
declare const shaderMap: Map<ZylemShaderType, ZylemShaderObject>;
export default shaderMap;
//# sourceMappingURL=preset-shader.d.ts.map