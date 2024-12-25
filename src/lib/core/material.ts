import {
	Color,
	Material,
	MeshPhongMaterial,
	MeshStandardMaterial,
	RepeatWrapping,
	Shader,
	ShaderMaterial,
	TextureLoader,
	Vector2,
	Vector3
} from 'three';

import { ZylemBlueColor } from '../interfaces/utility';
import shaderMap, { ZylemShaderObject, ZylemShaderType } from './preset-shader';

export type TexturePath = string | null;

export interface CreateMaterialsOptions {
	texture: TexturePath;
	color: Color;
	repeat: Vector2;
	shader: ZylemShaderType;
}

export type ZylemMaterialType = (Material & Partial<Shader>) & { isShaderMaterial?: boolean };

export class ZylemMaterial {
	_color: Color = ZylemBlueColor;
	_texture: TexturePath = null;
	_repeat: Vector2 = new Vector2(1, 1);
	_shader: ZylemShaderType = 'standard';
	materials: ZylemMaterialType[] = [];

	async createMaterials({ texture, color, repeat, shader }: CreateMaterialsOptions) {
		if (!this.materials) {
			this.materials = [];
		}
		this.applyMaterial(color);
		if (texture) {
			await this.applyTexture(texture, repeat);
		}
		if (shader && shader !== 'standard') {
			this.applyShader(shader);
		}
	}

	async applyTexture(texturePath: TexturePath, repeat: Vector2 = new Vector2(1, 1)) {
		const loader = new TextureLoader();
		const texture = await loader.loadAsync(texturePath as string);
		texture.repeat = repeat;
		texture.wrapS = RepeatWrapping;
		texture.wrapT = RepeatWrapping;
		const material = new MeshPhongMaterial({
			map: texture,
		});
		this.materials.push(material);
		return texture;
	}

	applyMaterial(color: Color) {
		const material = new MeshStandardMaterial({
			color: color,
			emissiveIntensity: 0.5,
			lightMapIntensity: 0.5,
			fog: true,
		});

		this.materials.push(material);
	}

	applyShader(customShader: ZylemShaderType) {
		const { fragment, vertex } = shaderMap.get(customShader) ?? shaderMap.get('standard') as ZylemShaderObject;

		const shader = new ShaderMaterial({
			uniforms: {
				iResolution: { value: new Vector3(1, 1, 1) },
				iTime: { value: 0 },
				tDiffuse: { value: null },
				tDepth: { value: null },
				tNormal: { value: null }
			},
			vertexShader: vertex,
			fragmentShader: fragment,
		});
		this.materials.push(shader);
	}
}