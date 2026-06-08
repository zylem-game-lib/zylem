/**
 * Texture loader adapter for the Asset Manager
 */

import { TextureLoader, Texture, RepeatWrapping, Wrapping } from 'three';
import { LoaderAdapter, AssetLoadOptions } from '../asset-types';
import { Vec2Input, VEC2_ONE, toThreeVector2 } from '../vector';

/**
 * Default anisotropic filtering level applied to loaded textures. Without it
 * (the engine never set it, so textures defaulted to 1) tiled/repeated
 * surfaces alias into moire bands at grazing angles under the sharp WebGPU
 * pipeline. Three clamps this to the device maximum (WebGPU caps at 16), so a
 * fixed 16 is safe across backends.
 */
export const DEFAULT_TEXTURE_ANISOTROPY = 16;

export interface TextureOptions extends AssetLoadOptions {
  repeat?: Vec2Input;
  wrapS?: Wrapping;
  wrapT?: Wrapping;
  /**
   * Texture color space. Set to `SRGBColorSpace` for color/albedo maps so the
   * renderer applies the sRGB->linear decode (otherwise the texture renders
   * washed out / too bright under the WebGPU node pipeline). Leave unset for
   * data textures such as normal maps (linear).
   */
  colorSpace?: string;
  /**
   * Anisotropic filtering level. Defaults to {@link DEFAULT_TEXTURE_ANISOTROPY}.
   * Higher values reduce minification moire on tiled textures at grazing
   * angles; the value is clamped to the device maximum by Three.js.
   */
  anisotropy?: number;
}

export class TextureLoaderAdapter implements LoaderAdapter<Texture> {
  private loader: TextureLoader;

  constructor() {
    this.loader = new TextureLoader();
  }

  isSupported(url: string): boolean {
    const ext = url
      .split('.')
      .pop()
      ?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tga'].includes(
      ext || '',
    );
  }

  async load(url: string, options?: TextureOptions): Promise<Texture> {
    const texture = await this.loader.loadAsync(url, event => {
      if (options?.onProgress && event.lengthComputable) {
        options.onProgress(event.loaded / event.total);
      }
    });

    // Apply texture options
    if (options?.repeat) {
      texture.repeat.copy(toThreeVector2(options.repeat, VEC2_ONE));
    }
    texture.wrapS = options?.wrapS ?? RepeatWrapping;
    texture.wrapT = options?.wrapT ?? RepeatWrapping;
    if (options?.colorSpace !== undefined) {
      texture.colorSpace = options.colorSpace;
    }
    texture.anisotropy = options?.anisotropy ?? DEFAULT_TEXTURE_ANISOTROPY;

    return texture;
  }

  /**
   * Clone a texture for independent usage
   */
  clone(texture: Texture): Texture {
    const cloned = texture.clone();
    // clone() copies anisotropy, but set defensively in case the source was
    // created outside this adapter with the default level.
    cloned.anisotropy = texture.anisotropy || DEFAULT_TEXTURE_ANISOTROPY;
    cloned.needsUpdate = true;
    return cloned;
  }
}
