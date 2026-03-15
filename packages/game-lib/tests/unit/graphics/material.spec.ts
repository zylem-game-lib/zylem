import {
  Color,
  MeshPhongMaterial,
  MeshStandardMaterial,
  ShaderMaterial,
  Vector2,
} from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { describe, expect, it, vi } from 'vitest';
import { color } from 'three/tsl';

import { assetManager } from '../../../src/lib/core/asset-manager';
import { deepMergeValues } from '../../../src/lib/core/clone-utils';
import { commonDefaults } from '../../../src/lib/entities/common';
import { MaterialBuilder } from '../../../src/lib/graphics/material';
import { standardShader } from '../../../src/lib/graphics/shaders/standard.shader';
import { objectVertexShader } from '../../../src/lib/graphics/shaders/vertex/object.shader';

const customGLSLShader = {
  vertex: objectVertexShader,
  fragment: `
    void main() {
      gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
  `,
};

const customTSLShader = {
  colorNode: color('#00ff00'),
};

describe('MaterialBuilder vector inputs', () => {
  it('normalizes repeat inputs before loading textures', async () => {
		const loadTexture = vi
			.spyOn(assetManager, 'loadTexture')
			.mockResolvedValue({} as any);

		const builder = new MaterialBuilder();
		builder.build(
			{
				path: 'grass.png',
				repeat: { x: 4 },
			},
			Symbol('material-test'),
		);

		expect(loadTexture).toHaveBeenCalledTimes(1);
		const repeat = loadTexture.mock.calls[0]?.[1]?.repeat as Vector2;
		expect(repeat).toBeInstanceOf(Vector2);
    expect(repeat.toArray()).toEqual([4, 1]);
  });

  it('keeps texture materials active when default shader and color are merged in', () => {
    vi.spyOn(assetManager, 'loadTexture').mockResolvedValue({} as any);

    const builder = new MaterialBuilder();
    builder.build(
      {
        path: 'grass.png',
        repeat: { x: 2, y: 3 },
        color: new Color('#ffffff'),
        shader: standardShader,
      },
      Symbol('material-texture-priority'),
    );

    expect(builder.materials).toHaveLength(1);
    expect(builder.materials[0]).toBeInstanceOf(MeshPhongMaterial);
  });

  it('keeps texture materials active when defaults deep-clone the standard shader', () => {
    vi.spyOn(assetManager, 'loadTexture').mockResolvedValue({} as any);

    const merged = deepMergeValues(commonDefaults, {
      material: {
        path: 'wood.png',
      },
    });
    const builder = new MaterialBuilder();
    builder.build(
      merged.material ?? {},
      Symbol('material-merged-standard-shader'),
    );

    expect(merged.material?.shader).not.toBe(standardShader);
    expect(builder.materials).toHaveLength(1);
    expect(builder.materials[0]).toBeInstanceOf(MeshPhongMaterial);
  });

  it('keeps merged GLSL shader materials active when defaults include a color', () => {
    const merged = deepMergeValues(commonDefaults, {
      material: {
        shader: customGLSLShader,
      },
    });

    const builder = new MaterialBuilder();
    builder.build(merged.material ?? {}, Symbol('material-custom-glsl'));

    expect(builder.materials).toHaveLength(1);
    expect(builder.materials[0]).toBeInstanceOf(ShaderMaterial);
  });

  it('keeps merged TSL shader materials active when defaults include a color', () => {
    const merged = deepMergeValues(commonDefaults, {
      material: {
        shader: customTSLShader,
      },
    });

    const builder = new MaterialBuilder();
    builder.build(merged.material ?? {}, Symbol('material-custom-tsl'));

    expect(builder.materials).toHaveLength(1);
    expect(builder.materials[0]).toBeInstanceOf(MeshBasicNodeMaterial);
  });

  it('treats the merged default standard shader as a normal color material when no texture is present', () => {
    const merged = deepMergeValues(commonDefaults, {
      material: {
        color: new Color('#ff0000'),
      },
    });

    const builder = new MaterialBuilder();
    builder.build(merged.material ?? {}, Symbol('material-default-standard'));

    expect(builder.materials).toHaveLength(1);
    expect(builder.materials[0]).toBeInstanceOf(MeshStandardMaterial);
  });
});
