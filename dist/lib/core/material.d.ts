import { Color, Material, Vector2 } from "three";
export type TexturePath = string | null;
export interface CreateMaterialsOptions {
    texture: TexturePath;
    color: Color;
    repeat: Vector2;
}
export declare class ZylemMaterial {
    _color: Color;
    _texture: TexturePath;
    _repeat: Vector2;
    materials: Material[];
    createMaterials({ texture, color, repeat }: CreateMaterialsOptions): void;
    applyTexture(texturePath: TexturePath, repeat?: Vector2): void;
    applyMaterial(color: Color): void;
    applyShader(shaderName: 'test', customShader: string): void;
}
