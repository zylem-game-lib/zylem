import type { SimulationColliderDefinition } from '@zylem/behaviors/core';
import { Color, Euler, Group, Quaternion, Vector3 } from 'three';
import { TextureLoader, SpriteMaterial, Sprite as ThreeSprite, SRGBColorSpace } from 'three';
import {
  ClampToEdgeWrapping,
  LinearFilter,
  NearestFilter,
  type Texture,
} from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { createEntity } from './create';
import {
  DestroyContext,
  SetupContext,
  UpdateContext,
} from '../core/base-node-life-cycle';
import { DebugDelegate } from './delegates/debug';
import { standardShader } from '../graphics/shaders/standard.shader';
import { DEFAULT_TEXTURE_ANISOTROPY } from '../core/loaders/texture-loader';
import { Vec3Input, VEC3_ONE, toThreeVector3 } from '../core/vector';
import { deepMergeValues } from '../core/clone-utils';

export type SpriteImage = { name: string; file: string };
export type SpriteAnimation = {
  name: string;
  frames: string[];
  speed: number | number[];
  loop: boolean;
};

/**
 * A single texture divided into a uniform grid of frames, addressed by UV
 * offset. Prefer this over {@link SpriteImage} lists for character sheets: one
 * texture and one draw call instead of one per frame.
 */
export type SpriteSheet = {
  file: string;
  columns: number;
  rows: number;
  /** Frame names in row-major order. `null` marks an unused cell. */
  frames: Array<string | null>;
  /** Texture filtering. Defaults to `nearest`, which keeps pixel art crisp. */
  filter?: 'nearest' | 'linear';
};

type ZylemSpriteOptions = GameEntityOptions & {
  images?: SpriteImage[];
  sheet?: SpriteSheet;
  animations?: SpriteAnimation[];
  size?: Vec3Input;
  collisionSize?: Vec3Input;
};

import { commonDefaults } from './common';

const spriteDefaults: ZylemSpriteOptions = {
  ...commonDefaults,
  size: new Vector3(1, 1, 1),
  images: [],
  animations: [],
};

export class SpriteCollisionBuilder extends EntityCollisionBuilder {
  collider(options: ZylemSpriteOptions): SimulationColliderDefinition {
    const size = toThreeVector3(
      options.collisionSize,
      options.size ?? VEC3_ONE,
    );
    return {
      shape: { type: 'box', halfExtents: [size.x / 2, size.y / 2, size.z / 2] },
    };
  }
}

export class SpriteBuilder extends EntityBuilder<
  ZylemSprite,
  ZylemSpriteOptions
> {
  protected createEntity(options: Partial<ZylemSpriteOptions>): ZylemSprite {
    return new ZylemSprite(options);
  }
}

export const SPRITE_TYPE = Symbol('Sprite');

export class ZylemSprite extends GameEntity<ZylemSpriteOptions> {
  static type = SPRITE_TYPE;

  protected sprites: ThreeSprite[] = [];
  protected spriteMap: Map<string, number> = new Map();
  protected currentSpriteIndex: number = 0;
  protected animations: Map<string, any> = new Map();
  protected currentAnimation: string | null = null;
  protected currentAnimationFrame: string = '';
  protected currentAnimationIndex: number = 0;
  protected currentAnimationTime: number = 0;
  /** Set only in sheet mode; the shared texture whose UV window we shift. */
  protected sheetTexture: Texture | null = null;
  protected flippedX: boolean = false;

  constructor(options?: ZylemSpriteOptions) {
    super();
    this.options = deepMergeValues(spriteDefaults, options);
    // Add sprite-specific lifecycle callbacks (only registered once)
    this.prependSetup(this.spriteSetup.bind(this) as any);
    this.prependUpdate(this.spriteUpdate.bind(this) as any);
    this.onCleanup(this.spriteDestroy.bind(this) as any);
  }

  public create(): this {
    // Clear previous state to prevent accumulation on reload
    this.sprites = [];
    this.spriteMap.clear();
    this.animations.clear();
    this.currentAnimation = null;
    this.currentAnimationFrame = '';
    this.currentAnimationIndex = 0;
    this.currentAnimationTime = 0;
    this.sheetTexture = null;
    this.group = undefined;

    // Recreate sprites and animations
    if (this.options?.sheet) {
      this.createSpriteFromSheet(this.options.sheet);
    } else {
      this.createSpritesFromImages(this.options?.images || []);
    }
    this.createAnimations(this.options?.animations || []);

    // Call parent create
    return super.create();
  }

  protected createSpritesFromImages(images: SpriteImage[]) {
    // Use synchronous load() which returns a texture that updates when ready
    // This maintains compatibility with the synchronous create() method
    const textureLoader = new TextureLoader();
    const size = toThreeVector3(this.options.size, VEC3_ONE);
    images.forEach((image, index) => {
      const spriteMap = textureLoader.load(image.file);
      // Sprite art is color data; tag sRGB so it isn't rendered too bright.
      spriteMap.colorSpace = SRGBColorSpace;
      spriteMap.anisotropy = DEFAULT_TEXTURE_ANISOTROPY;
      const material = new SpriteMaterial({
        map: spriteMap,
        transparent: true,
      });
      const _sprite = new ThreeSprite(material);
      _sprite.position.normalize();
      _sprite.scale.set(size.x, size.y, size.z);
      _sprite.visible = index === 0;
      this.sprites.push(_sprite);
      this.spriteMap.set(image.name, index);
    });
    this.group = new Group();
    this.group.add(...this.sprites);
  }

  protected createSpriteFromSheet(sheet: SpriteSheet) {
    const size = toThreeVector3(this.options.size, VEC3_ONE);
    const texture = new TextureLoader().load(sheet.file);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    // Pixel art has to sample unfiltered, and mipmaps would bleed neighbouring
    // cells into a frame as the camera zooms.
    const filter = sheet.filter === 'linear' ? LinearFilter : NearestFilter;
    texture.magFilter = filter;
    texture.minFilter = filter;
    texture.generateMipmaps = false;
    texture.repeat.set(1 / sheet.columns, 1 / sheet.rows);

    const material = new SpriteMaterial({ map: texture, transparent: true });
    const _sprite = new ThreeSprite(material);
    _sprite.position.normalize();
    _sprite.scale.set(size.x, size.y, size.z);

    this.sheetTexture = texture;
    this.sprites.push(_sprite);
    sheet.frames.forEach((name, index) => {
      if (name) this.spriteMap.set(name, index);
    });

    this.group = new Group();
    this.group.add(_sprite);

    const firstFrame = sheet.frames.find((name): name is string => !!name);
    if (firstFrame) this.setSprite(firstFrame);
  }

  protected createAnimations(animations: SpriteAnimation[]) {
    animations.forEach(animation => {
      const { name, frames, loop = false, speed = 1 } = animation;
      const internalAnimation = {
        frames: frames.map((frame, index) => ({
          key: frame,
          index,
          duration: typeof speed === 'number' ? speed : speed[index],
        })),
        loop,
      };
      this.animations.set(name, internalAnimation);
    });
  }

  setSprite(key: string) {
    const spriteIndex = this.spriteMap.get(key);
    const useIndex = spriteIndex ?? 0;
    this.currentSpriteIndex = useIndex;

    if (this.sheetTexture) {
      this.applySheetFrame(useIndex);
      return;
    }

    this.sprites.forEach((_sprite, i) => {
      _sprite.visible = this.currentSpriteIndex === i;
    });
  }

  /**
   * Mirror the sprite horizontally, for characters whose sheet only contains
   * one facing direction.
   *
   * In sheet mode this flips the UV window rather than the sprite scale,
   * because {@link syncSpriteMaterials} rewrites scale from `options.size`
   * every frame and would immediately undo a negative scale.
   */
  setFlipX(flip: boolean) {
    if (this.flippedX === flip) return;
    this.flippedX = flip;

    if (this.sheetTexture) {
      this.applySheetFrame(this.currentSpriteIndex);
      return;
    }

    this.sprites.forEach(_sprite => {
      _sprite.material.map?.repeat.setX(flip ? -1 : 1);
      _sprite.material.map?.offset.setX(flip ? 1 : 0);
    });
  }

  isFlippedX(): boolean {
    return this.flippedX;
  }

  private applySheetFrame(index: number) {
    const sheet = this.options.sheet;
    const texture = this.sheetTexture;
    if (!sheet || !texture) return;

    const column = index % sheet.columns;
    const row = Math.floor(index / sheet.columns);
    const cellWidth = 1 / sheet.columns;
    const cellHeight = 1 / sheet.rows;

    texture.repeat.x = this.flippedX ? -cellWidth : cellWidth;
    texture.offset.x = this.flippedX
      ? (column + 1) * cellWidth
      : column * cellWidth;
    // Three's UV origin is bottom-left, but frames are packed top-down.
    texture.offset.y = 1 - (row + 1) * cellHeight;
  }

  /**
   * Advance a named clip. Call once per frame from an update loop; `delta` is
   * seconds, so scaling it scales playback rate.
   */
  setAnimation(name: string, delta: number) {
    const animation = this.animations.get(name);
    if (!animation) return;

    const { loop, frames } = animation;
    if (frames.length === 0) return;

    // Frame index is per-clip, so it has to reset on a switch. Carrying it
    // over would index past the end of a shorter clip.
    if (name !== this.currentAnimation) {
      this.currentAnimation = name;
      this.currentAnimationIndex = 0;
      this.currentAnimationTime = 0;
    } else {
      this.currentAnimationTime += delta;
    }

    for (;;) {
      const duration = frames[this.currentAnimationIndex].duration;
      // A non-positive duration would spin forever; hold the frame instead.
      if (!(duration > 0) || this.currentAnimationTime < duration) break;
      this.currentAnimationTime -= duration;

      if (this.currentAnimationIndex + 1 < frames.length) {
        this.currentAnimationIndex++;
      } else if (loop) {
        this.currentAnimationIndex = 0;
      } else {
        this.currentAnimationTime = 0;
        break;
      }
    }

    this.currentAnimationFrame = frames[this.currentAnimationIndex].key;
    this.setSprite(this.currentAnimationFrame);
  }

  private getCurrentRotationQuaternion(): {
    x: number;
    y: number;
    z: number;
    w: number;
  } | null {
    if (this.transformStore?.dirty.rotation) {
      return this.transformStore.rotation;
    }

    return this.body?.rotation?.() ?? null;
  }

  private syncSpriteMaterials(): void {
    const q = this.getCurrentRotationQuaternion();

    this.sprites.forEach(_sprite => {
      if (_sprite.material && q) {
        const quat = new Quaternion(q.x, q.y, q.z, q.w);
        const euler = new Euler().setFromQuaternion(quat, 'XYZ');
        _sprite.material.rotation = euler.z;
      }
      const size = toThreeVector3(this.options.size, VEC3_ONE);
      _sprite.scale.set(size.x, size.y, size.z);
    });
  }

  spriteSetup(_params: SetupContext<ZylemSpriteOptions>): void {
    this.syncSpriteMaterials();
  }

  spriteUpdate(params: UpdateContext<ZylemSpriteOptions>): void {
    this.syncSpriteMaterials();
  }

  spriteDestroy(params: DestroyContext<ZylemSpriteOptions>): void {
    this.sprites.forEach(_sprite => {
      _sprite.removeFromParent();
    });
    this.group?.remove(...this.sprites);
    this.group?.removeFromParent();
    this.sheetTexture?.dispose();
    this.sheetTexture = null;
  }

  buildInfo(): Record<string, any> {
    const delegate = new DebugDelegate(this as any);
    const baseInfo = delegate.buildDebugInfo();
    return {
      ...baseInfo,
      type: String(ZylemSprite.type),
    };
  }
}

type SpriteOptions = BaseNode | Partial<ZylemSpriteOptions>;

export function createSprite(...args: Array<SpriteOptions>): ZylemSprite {
  return createEntity<ZylemSprite, ZylemSpriteOptions>({
    args,
    defaultConfig: spriteDefaults,
    EntityClass: ZylemSprite,
    BuilderClass: SpriteBuilder,
    CollisionBuilderClass: SpriteCollisionBuilder,
    entityType: ZylemSprite.type,
    cloneFactory: options => createSprite(options ?? {}),
  });
}
