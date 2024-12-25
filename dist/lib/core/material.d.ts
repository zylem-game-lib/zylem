import { Color, Material, Shader, Vector2 } from 'three';
import { ZylemShaderType } from './preset-shader';
export type TexturePath = string | null;
export interface CreateMaterialsOptions {
    texture: TexturePath;
    color: Color;
    repeat: Vector2;
    shader: ZylemShaderType;
}
export type ZylemMaterialType = (Material & Partial<Shader>) & {
    isShaderMaterial?: boolean;
};
export declare class ZylemMaterial {
	_color: Color;
	_texture: TexturePath;
	_repeat: Vector2;
	_shader: ZylemShaderType;
	materials: ZylemMaterialType[];
	createMaterials({ texture, color, repeat, shader }: CreateMaterialsOptions): Promise<void>;
	applyTexture(texturePath: TexturePath, repeat?: Vector2): Promise<import('three').Texture>;
	applyMaterial(color: Color): void;
	applyShader(customShader: ZylemShaderType): void;
}
