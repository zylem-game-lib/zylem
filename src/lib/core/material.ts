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
} from "three";

import { ZylemBlueColor } from "../interfaces/utility";
import fragmentShader from '../rendering/shaders/fragment/fire.glsl';
import vertexShader from '../rendering/shaders/vertex/object-shader.glsl';

const shaderDictionary = {
	test: {
		vertexShader,
		fragmentShader
	}
}

export type TexturePath = string | null;

export interface CreateMaterialsOptions {
	texture: TexturePath;
	color: Color;
	repeat: Vector2;
	shader: string;
}

export type ZylemMaterialType = (Material & Partial<Shader>) & { isShaderMaterial?: boolean };

export class ZylemMaterial {
	_color: Color = ZylemBlueColor;
	_texture: TexturePath = null;
	_repeat: Vector2 = new Vector2(1, 1);
	_shader: string = '';
	materials: ZylemMaterialType[] = [];

	async createMaterials({ texture, color, repeat, shader }: CreateMaterialsOptions) {
		if (!this.materials) {
			this.materials = [];
		}
		this.applyMaterial(color);
		if (texture) {
			await this.applyTexture(texture, repeat);
		}
		if (shader) {
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

	applyShader(customShader: string = 'test') {
		const { vertexShader, fragmentShader } = shaderDictionary.test;

		const shader = new ShaderMaterial({
			uniforms: {
				iResolution: { value: new Vector3(1, 1, 1) },
				iTime: { value: 0 },
				tDiffuse: { value: null },
				tDepth: { value: null },
				tNormal: { value: null }
			},
			vertexShader,
			fragmentShader,
		});
		this.materials.push(shader);
	}
}