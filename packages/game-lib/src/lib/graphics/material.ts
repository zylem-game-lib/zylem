import { Color, Material, Vector2, Vector3 } from 'three';
import {
	MeshPhongMaterial,
	MeshStandardMaterial,
	RepeatWrapping,
	ShaderMaterial,
} from 'three';
import {
	MeshBasicNodeMaterial,
	MeshStandardNodeMaterial,
} from 'three/webgpu';
import { shortHash, sortedStringify } from '../core/utility/strings';
import { standardShader } from './shaders/standard.shader';
import { assetManager } from '../core/asset-manager';

/**
 * GLSL shader object (traditional approach for WebGL)
 */
export type ZylemShaderObject = { fragment: string; vertex: string };

/**
 * TSL shader type (for WebGPU)
 * colorNode should be a TSL node that returns the fragment color
 */
export type ZylemTSLShader = {
	colorNode: any; // TSL node - use any since Three.js types are still evolving
	transparent?: boolean;
};

/**
 * Combined shader type supporting both GLSL and TSL
 */
export type ZylemShader = ZylemShaderObject | ZylemTSLShader;

/**
 * Check if a shader is a TSL shader
 */
export function isTSLShader(shader: ZylemShader): shader is ZylemTSLShader {
	return 'colorNode' in shader;
}

/**
 * Check if a shader is a GLSL shader
 */
export function isGLSLShader(shader: ZylemShader): shader is ZylemShaderObject {
	return 'fragment' in shader && 'vertex' in shader;
}

export interface MaterialOptions {
	path?: string;
	repeat?: Vector2;
	shader?: ZylemShader;
	color?: Color;
	/**
	 * When true, prefer TSL/NodeMaterial (for WebGPU)
	 * When false, prefer GLSL/ShaderMaterial (for WebGL)
	 */
	useTSL?: boolean;
}

type BatchGeometryMap = Map<symbol, number>;

interface BatchMaterialMapObject {
	geometryMap: BatchGeometryMap;
	material: Material;
}

type BatchKey = ReturnType<typeof shortHash>;

export type TexturePath = string | null;

export class MaterialBuilder {
	static batchMaterialMap: Map<BatchKey, BatchMaterialMapObject> = new Map();

	materials: Material[] = [];

	/** Whether to use TSL/NodeMaterial (for WebGPU compatibility) */
	private useTSL: boolean;

	constructor(useTSL: boolean = false) {
		this.useTSL = useTSL;
	}

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
			MaterialBuilder.batchMaterialMap.set(batchKey, {
				geometryMap: new Map([[entityType, 1]]),
				material: this.materials[0],
			});
		}
	}

	build(options: Partial<MaterialOptions>, entityType: symbol): void {
		const { path, repeat, color, shader, useTSL } = options;
		
		// Override TSL preference if specified in options
		const shouldUseTSL = useTSL ?? this.useTSL;

		// If shader is provided, use it
		if (shader) {
			if (isTSLShader(shader)) {
				// TSL shader provided directly
				this.setTSLShader(shader);
			} else if (isGLSLShader(shader)) {
				// GLSL shader provided
				if (shouldUseTSL) {
					console.warn('MaterialBuilder: GLSL shader provided but TSL mode requested. Using GLSL.');
				}
				this.setShader(shader);
			}
		} else if (path) {
			// Texture path provided
			this.setTexture(path, repeat, shouldUseTSL);
		}

		if (color) {
			this.withColor(color, shouldUseTSL);
		}

		if (this.materials.length === 0) {
			this.setColor(new Color('#ffffff'), shouldUseTSL);
		}
		this.batchMaterial(options, entityType);
	}

	withColor(color: Color, useTSL: boolean = false): this {
		this.setColor(color, useTSL);
		return this;
	}

	withShader(shader: ZylemShaderObject): this {
		this.setShader(shader);
		return this;
	}

	withTSLShader(shader: ZylemTSLShader): this {
		this.setTSLShader(shader);
		return this;
	}

	/**
	 * Set texture - loads in background (deferred).
	 * Material is created immediately with null map, texture applies when loaded.
	 */
	setTexture(texturePath: TexturePath = null, repeat: Vector2 = new Vector2(1, 1), useTSL: boolean = false): void {
		if (!texturePath) {
			return;
		}

		if (useTSL) {
			// For TSL/WebGPU, use NodeMaterial
			const material = new MeshStandardNodeMaterial();
			this.materials.push(material);

			// Load texture in background and apply when ready
			assetManager.loadTexture(texturePath as string, {
				clone: true,
				repeat,
			}).then((texture) => {
				texture.wrapS = RepeatWrapping;
				texture.wrapT = RepeatWrapping;
				material.map = texture;
				material.needsUpdate = true;
			});
		} else {
			// For WebGL, use traditional material
			const material = new MeshPhongMaterial({
				map: null,
			});
			this.materials.push(material);

			// Load texture in background and apply when ready
			assetManager
				.loadTexture(texturePath as string, {
					clone: true,
					repeat,
				})
				.then((texture) => {
					texture.wrapS = RepeatWrapping;
					texture.wrapT = RepeatWrapping;
					material.map = texture;
					material.needsUpdate = true;
				});
		}
	}

	setColor(color: Color, useTSL: boolean = false) {
		if (useTSL) {
			// TSL/WebGPU compatible material
			const material = new MeshStandardNodeMaterial();
			material.color = color;
			this.materials.push(material);
		} else {
			// WebGL compatible material
			const material = new MeshStandardMaterial({
				color: color,
				emissiveIntensity: 0.5,
				lightMapIntensity: 0.5,
				fog: true,
			});
			this.materials.push(material);
		}
	}

	/**
	 * Set GLSL shader (WebGL only)
	 */
	setShader(customShader: ZylemShaderObject) {
		const { fragment, vertex } = customShader ?? standardShader;

		const shader = new ShaderMaterial({
			uniforms: {
				iResolution: { value: new Vector3(1, 1, 1) },
				iTime: { value: 0 },
				tDiffuse: { value: null },
				tDepth: { value: null },
				tNormal: { value: null },
			},
			vertexShader: vertex,
			fragmentShader: fragment,
			transparent: true,
		});
		this.materials.push(shader);
	}

	/**
	 * Set TSL shader (WebGPU compatible)
	 */
	setTSLShader(tslShader: ZylemTSLShader) {
		const material = new MeshBasicNodeMaterial();
		material.colorNode = tslShader.colorNode;
		if (tslShader.transparent) {
			material.transparent = true;
		}
		this.materials.push(material);
	}
}

// Re-export TSL utilities for shader authoring
export {
	uniform,
	uv,
	time,
	vec3,
	vec4,
	float,
	Fn,
} from 'three/tsl';
