import {
  type Blending,
  Color,
  Material,
  RepeatWrapping,
  type Side,
  SRGBColorSpace,
} from 'three';
import { MeshBasicNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu';
import { shortHash, sortedStringify } from '../core/utility/strings';
import { standardShader } from './shaders/standard.shader';
import { assetManager } from '../core/asset-manager';
import { Vec2Input, VEC2_ONE, toThreeVector2 } from '../core/vector';

/**
 * GLSL shader object (traditional WebGL approach).
 *
 * @deprecated game-lib renders with WebGPU, which cannot compile raw GLSL
 * `ShaderMaterial`. Author custom shaders as {@link ZylemTSLShader} (TSL)
 * instead. A GLSL shader passed to a material now logs a warning and renders
 * with a default node material.
 */
export type ZylemShaderObject = { fragment: string; vertex: string };

/**
 * TSL shader type (for WebGPU)
 * colorNode should be a TSL node that returns the fragment color
 */
export type ZylemTSLShader = {
  colorNode: any; // TSL node - use any since Three.js types are still evolving
  /**
   * Optional TSL node overriding vertex positions (e.g. wave displacement).
   * Requires geometry with enough vertices to displace (e.g. a subdivided
   * plane).
   */
  positionNode?: any;
  /** Optional TSL node overriding the surface normal. */
  normalNode?: any;
  transparent?: boolean;
  /** Optional three.js blending mode (e.g. `AdditiveBlending`). */
  blending?: Blending;
  /** Optional three.js render side (e.g. `DoubleSide`). */
  side?: Side;
  /** Optional depth test override (e.g. `false` for overlay holograms). */
  depthTest?: boolean;
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

function isDefaultStandardShader(
  shader: ZylemShader | undefined,
): shader is ZylemShaderObject {
  return (
    !!shader &&
    isGLSLShader(shader) &&
    shader.vertex === standardShader.vertex &&
    shader.fragment === standardShader.fragment
  );
}

export interface MaterialOptions {
  path?: string;
  normalMap?: string;
  repeat?: Vec2Input;
  shader?: ZylemShader;
  color?: Color;
  /** Opacity from 0 (fully transparent) to 1 (fully opaque). */
  opacity?: number;
  /**
   * @deprecated game-lib is WebGPU-only and always builds TSL node materials.
   * This flag is ignored.
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

type OpacityCapableMaterial = Material & {
  opacity: number;
  transparent: boolean;
  needsUpdate: boolean;
};

export class MaterialBuilder {
  static batchMaterialMap: Map<BatchKey, BatchMaterialMapObject> = new Map();

  /**
   * Clear the static batch material cache.
   * Should be called during game disposal to prevent stale material references
   * from persisting across demo/stage switches.
   */
  static clearBatchCache(): void {
    MaterialBuilder.batchMaterialMap.clear();
  }

  materials: Material[] = [];

  /**
   * Retained for backward compatibility. game-lib is WebGPU-only and always
   * builds TSL node materials, so this no longer changes behavior.
   *
   * @deprecated
   */
  private useTSL: boolean;

  constructor(useTSL: boolean = true) {
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
    const { path, normalMap, repeat, color, shader, opacity } = options;

    // game-lib is WebGPU-only: always build TSL node materials.
    const usesDefaultStandardShader = isDefaultStandardShader(shader);
    const shouldUseCustomShader = Boolean(shader) && !usesDefaultStandardShader;
    const shouldUseTextureMaterial =
      Boolean(path) && (!shader || usesDefaultStandardShader);

    if (shouldUseTextureMaterial) {
      this.setTexture(path ?? null, repeat, true, opacity, color);
    } else if (shouldUseCustomShader && shader) {
      // If shader is provided, use it
      if (isTSLShader(shader)) {
        // TSL shader provided directly
        this.setTSLShader(shader, opacity);
      } else if (isGLSLShader(shader)) {
        // GLSL shaders cannot compile on the WebGPU renderer. Warn and fall
        // back to a default node material so the entity still renders.
        console.warn(
          'MaterialBuilder: GLSL shaders are not supported on the WebGPU renderer. ' +
            'Author custom shaders as TSL (ZylemTSLShader). Falling back to a default node material.',
        );
        this.setColor(color ?? new Color('#ffffff'), true, opacity);
      }
    } else if (path) {
      // Texture path provided
      this.setTexture(path, repeat, true, opacity, color);
    }

    if (color && !shouldUseTextureMaterial && !shouldUseCustomShader) {
      this.withColor(color, true, opacity);
    }

    if (this.materials.length === 0) {
      this.setColor(new Color('#ffffff'), true, opacity);
    }

    // Apply normal map if present (to the last added material)
    if (normalMap && this.materials.length > 0) {
      this.setNormalMap(normalMap, repeat);
    }

    this.batchMaterial(options, entityType);
  }

  withColor(color: Color, useTSL: boolean = false, opacity?: number): this {
    this.setColor(color, useTSL, opacity);
    return this;
  }

  withShader(shader: ZylemShaderObject, opacity?: number): this {
    this.setShader(shader, opacity);
    return this;
  }

  withTSLShader(shader: ZylemTSLShader, opacity?: number): this {
    this.setTSLShader(shader, opacity);
    return this;
  }

  private applyOpacity(
    material: OpacityCapableMaterial,
    opacity?: number,
    forceTransparent: boolean = false,
  ): void {
    if (opacity !== undefined) {
      material.opacity = opacity;
    }
    material.transparent =
      forceTransparent || (opacity !== undefined && opacity < 1);
    material.needsUpdate = true;
  }

  /**
   * Set texture - loads in background (deferred).
   * Material is created immediately with null map, texture applies when loaded.
   */
  setTexture(
    texturePath: TexturePath = null,
    repeat: Vec2Input = VEC2_ONE,
    _useTSL: boolean = true,
    opacity?: number,
    color?: Color,
  ): void {
    if (!texturePath) {
      return;
    }

    // WebGPU: always use a TSL node material.
    const material = new MeshStandardNodeMaterial();
    if (color) {
      material.color = color;
    }
    this.applyOpacity(material as OpacityCapableMaterial, opacity);
    this.materials.push(material);

    // Load texture in background and apply when ready. Color/albedo maps are
    // tagged sRGB so the renderer applies the sRGB->linear decode; without it
    // textures render washed out / too bright under the WebGPU node pipeline.
    assetManager
      .loadTexture(texturePath as string, {
        clone: true,
        repeat: toThreeVector2(repeat, VEC2_ONE),
        colorSpace: SRGBColorSpace,
      })
      .then(texture => {
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        material.map = texture;
        material.needsUpdate = true;
      });
  }

  /**
   * Set normal map for the current material
   */
  setNormalMap(normalMapPath: string, repeat: Vec2Input = VEC2_ONE): void {
    const material = this.materials[this.materials.length - 1];
    if (!material) return;

    assetManager
      .loadTexture(normalMapPath, {
        clone: true,
        repeat: toThreeVector2(repeat, VEC2_ONE),
      })
      .then(texture => {
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;

        if (material instanceof MeshStandardNodeMaterial) {
          material.normalMap = texture;
          material.needsUpdate = true;
        }
      });
  }

  setColor(color: Color, _useTSL: boolean = true, opacity?: number) {
    // WebGPU: always use a TSL node material.
    const material = new MeshStandardNodeMaterial();
    material.color = color;
    this.applyOpacity(material as OpacityCapableMaterial, opacity);
    this.materials.push(material);
  }

  /**
   * @deprecated GLSL shaders cannot compile on the WebGPU renderer. This now
   * logs a warning and creates a default node material so the entity still
   * renders. Author custom shaders as {@link ZylemTSLShader} (TSL) and use
   * {@link withTSLShader} / `material.shader` instead.
   */
  setShader(_customShader: ZylemShaderObject, opacity?: number) {
    console.warn(
      'MaterialBuilder.setShader: GLSL shaders are not supported on the WebGPU renderer. ' +
        'Author custom shaders as TSL (ZylemTSLShader). Falling back to a default node material.',
    );
    this.setColor(new Color('#ffffff'), true, opacity);
  }

  /**
   * Set TSL shader (WebGPU compatible)
   */
  setTSLShader(tslShader: ZylemTSLShader, opacity?: number) {
    this.materials.push(createNodeMaterialFromTSL(tslShader, opacity));
  }
}

/**
 * Build a standalone WebGPU node material ({@link MeshBasicNodeMaterial}) from
 * a {@link ZylemTSLShader}. Useful for runtime material swapping outside the
 * entity material pipeline (e.g. demos that toggle shader "looks").
 */
export function createNodeMaterialFromTSL(
  tslShader: ZylemTSLShader,
  opacity?: number,
): MeshBasicNodeMaterial {
  const material = new MeshBasicNodeMaterial();
  material.colorNode = tslShader.colorNode;
  if (tslShader.positionNode) {
    material.positionNode = tslShader.positionNode;
  }
  if (tslShader.normalNode) {
    material.normalNode = tslShader.normalNode;
  }
  if (tslShader.blending !== undefined) {
    material.blending = tslShader.blending;
  }
  if (tslShader.side !== undefined) {
    material.side = tslShader.side;
  }
  if (tslShader.depthTest !== undefined) {
    material.depthTest = tslShader.depthTest;
  }
  if (opacity !== undefined) {
    (material as unknown as OpacityCapableMaterial).opacity = opacity;
  }
  material.transparent =
    Boolean(tslShader.transparent) || (opacity !== undefined && opacity < 1);
  material.needsUpdate = true;
  return material;
}

// Re-export TSL utilities for shader authoring
export { uniform, uv, time, vec3, vec4, float, Fn } from 'three/tsl';
