import { Color, Material, Vector2 } from 'three';
import { shortHash } from '../core/utility';
import { ZylemShaderType } from '../core/preset-shader';
export interface MaterialOptions {
    path?: string;
    repeat?: Vector2;
    shader?: ZylemShaderType;
    color?: Color;
}
type BatchGeometryMap = Map<symbol, number>;
interface BatchMaterialMapObject {
    geometryMap: BatchGeometryMap;
    material: Material;
}
type BatchKey = ReturnType<typeof shortHash>;
export type TexturePath = string | null;
export declare class MaterialBuilder {
    static batchMaterialMap: Map<BatchKey, BatchMaterialMapObject>;
    materials: Material[];
    batchMaterial(options: Partial<MaterialOptions>, entityType: symbol): void;
    build(options: Partial<MaterialOptions>, entityType: symbol): Promise<void>;
    withColor(color: Color): this;
    withShader(shaderType: ZylemShaderType): this;
    setTexture(texturePath?: TexturePath, repeat?: Vector2): Promise<void>;
    setColor(color: Color): void;
    setShader(customShader: ZylemShaderType): void;
}
export {};
