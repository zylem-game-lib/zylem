import {
	Color,
	Material,
	MeshPhongMaterial,
	MeshStandardMaterial,
	RepeatWrapping,
	ShaderMaterial,
	TextureLoader,
	Vector2,
	Vector3
} from 'three';
import { shortHash, sortedStringify } from '../core/utility/strings';
import shaderMap, { ZylemShaderObject, ZylemShaderType } from '../core/preset-shader';

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
};

type BatchKey = ReturnType<typeof shortHash>;

export type TexturePath = string | null;

export class MaterialBuilder {
	static batchMaterialMap: Map<BatchKey, BatchMaterialMapObject> = new Map();

	materials: Material[] = [];

	batchMaterial(options: Partial<MaterialOptions>, entityType: symbol) {
		const batchKey = shortHash(sortedStringify(options));
		const mappedObject = MaterialBuilder.batchMaterialMap.get(batchKey);
		if (mappedObject) {
			const count = mappedObject.geometryMap.get(entityType);
			if (count) {
				mappedObject.geometryMap.set(entityType, count + 1);
			} else {
				mappedObject.geometryMap.set(entityType, 1);
			}
		} else {
			MaterialBuilder.batchMaterialMap.set(
				batchKey, {
				geometryMap: new Map([[entityType, 1]]),
				material: this.materials[0]
			});
		}
	}

	async build(options: Partial<MaterialOptions>, entityType: symbol) {
		const { path, repeat, color, shader } = options;
		if (shader) this.withShader(shader);
		if (color) this.withColor(color);
		await this.setTexture(path ?? null, repeat);
		if (this.materials.length === 0) {
			this.setColor(new Color('#ffffff'));
		}
		this.batchMaterial(options, entityType);
	}

	withColor(color: Color): this {
		this.setColor(color);
		return this;
	}

	withShader(shaderType: ZylemShaderType): this {
		this.setShader(shaderType);
		return this;
	}

	async setTexture(texturePath: TexturePath = null, repeat: Vector2 = new Vector2(1, 1)) {
		if (!texturePath) {
			return;
		}
		const loader = new TextureLoader();
		const texture = await loader.loadAsync(texturePath as string);
		texture.repeat = repeat;
		texture.wrapS = RepeatWrapping;
		texture.wrapT = RepeatWrapping;
		const material = new MeshPhongMaterial({
			map: texture,
		});
		this.materials.push(material);
	}

	setColor(color: Color) {
		const material = new MeshStandardMaterial({
			color: color,
			emissiveIntensity: 0.5,
			lightMapIntensity: 0.5,
			fog: true,
		});

		this.materials.push(material);
	}

	setShader(customShader: ZylemShaderType) {
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
