export type ZylemShaderObject = {
    fragment: string;
    vertex: string;
};
export declare const starShader: ZylemShaderObject;
export declare const fireShader: ZylemShaderObject;
export declare const standardShader: ZylemShaderObject;
export declare const debugShader: ZylemShaderObject;
export type ZylemShaderType = 'standard' | 'fire' | 'star' | 'debug';
declare const shaderMap: Map<ZylemShaderType, ZylemShaderObject>;
export default shaderMap;
//# sourceMappingURL=preset-shader.d.ts.map