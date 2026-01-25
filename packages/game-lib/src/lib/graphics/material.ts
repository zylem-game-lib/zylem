import {
	Color,
	Material,
	MeshPhongMaterial,
	MeshStandardMaterial,
	RepeatWrapping,
	ShaderMaterial,
	Vector2,
	Vector3
} from 'three';
import { shortHash, sortedStringify } from '../core/utility/strings';
import { standardShader } from './shaders/standard.shader';
import { assetManager } from '../core/asset-manager';

export type ZylemShaderObject = { fragment: string, vertex: string };

export interface MaterialOptions {
	path?: string;
	repeat?: Vector2;
	shader?: ZylemShaderObject;
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

	build(options: Partial<MaterialOptions>, entityType: symbol): void {
		const { path, repeat, color, shader } = options;
		// If shader is provided, use it; otherwise execute standard logic
		if (shader) {
			this.withShader(shader);
		} else if (path) {
			// If path provided but no shader, standard texture logic applies
			this.setTexture(path, repeat);
		}
		
		if (color) {
			// standard color material if no custom shader
			this.withColor(color);
		}

		if (this.materials.length === 0) {
			this.setColor(new Color('#ffffff'));
		}
		this.batchMaterial(options, entityType);
	}

	withColor(color: Color): this {
		this.setColor(color);
		return this;
	}

	withShader(shader: ZylemShaderObject): this {
		this.setShader(shader);
		return this;
	}

	/**
	 * Set texture - loads in background (deferred).
	 * Material is created immediately with null map, texture applies when loaded.
	 */
	setTexture(texturePath: TexturePath = null, repeat: Vector2 = new Vector2(1, 1)): void {
		if (!texturePath) {
			return;
		}
		// Create material immediately with null map
		const material = new MeshPhongMaterial({
			map: null,
		});
		this.materials.push(material);

		// Load texture in background and apply when ready
		assetManager.loadTexture(texturePath as string, { 
			clone: true,
			repeat 
		}).then(texture => {
			texture.wrapS = RepeatWrapping;
			texture.wrapT = RepeatWrapping;
			material.map = texture;
			material.needsUpdate = true;
		});
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

	setShader(customShader: ZylemShaderObject) {
		const { fragment, vertex } = customShader ?? standardShader;

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
			transparent: true,
		});
		this.materials.push(shader);
	}
}
