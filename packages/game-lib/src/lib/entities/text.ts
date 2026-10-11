import {
  Color,
  Group,
  Sprite as ThreeSprite,
  SpriteMaterial,
  CanvasTexture,
  LinearFilter,
  Vector2,
  PerspectiveCamera,
  OrthographicCamera,
  ClampToEdgeWrapping,
} from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { createEntity } from './create';
import { UpdateContext, SetupContext } from '../core/base-node-life-cycle';
import { ZylemCamera } from '../camera/zylem-camera';
import { DebugDelegate } from './delegates/debug';
import { Vec2Input, toThreeVector2 } from '../core/vector';
import { deepMergeValues } from '../core/clone-utils';
import {
  anchorFractions,
  anchoredPoint,
  placeOnViewport,
  viewportSize,
  type ScreenAnchor,
  type ScreenPoint,
  type ViewportSize,
} from './screen-anchor';

type ZylemTextOptions = GameEntityOptions & {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: Color | string;
  backgroundColor?: Color | string | null;
  padding?: number;
  stickToViewport?: boolean;
  /**
   * Viewport point the text is positioned from. When set, `screenPosition` is
   * a pixel offset from it (+x right, +y down) and the text aligns to the same
   * point, so `top-right` text ends at that corner. Without it,
   * `screenPosition` is the text's centre, in pixels or as 0..1 fractions of
   * the viewport.
   */
  screenAnchor?: ScreenAnchor;
  screenPosition?: Vec2Input;
  zDistance?: number;
};

const textDefaults: ZylemTextOptions = {
  position: undefined,
  text: '',
  fontFamily:
    'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 18,
  fontColor: '#FFFFFF',
  backgroundColor: null,
  padding: 4,
  stickToViewport: true,
  screenPosition: new Vector2(24, 24),
  zDistance: 1,
};

export class TextBuilder extends EntityBuilder<ZylemText, ZylemTextOptions> {
  protected createEntity(options: Partial<ZylemTextOptions>): ZylemText {
    return new ZylemText(options);
  }
}

export const TEXT_TYPE = Symbol('Text');

export class ZylemText extends GameEntity<ZylemTextOptions> {
  static type = TEXT_TYPE;

  private _sprite: ThreeSprite | null = null;
  private _texture: CanvasTexture | null = null;
  private _canvas: HTMLCanvasElement | null = null;
  private _ctx: CanvasRenderingContext2D | null = null;
  private _cameraRef: ZylemCamera | null = null;
  private _lastCanvasW: number = 0;
  private _lastCanvasH: number = 0;

  constructor(options?: ZylemTextOptions) {
    super();
    this.options = deepMergeValues(textDefaults, options) as ZylemTextOptions;
    this.options.screenPosition = toThreeVector2(
      this.options.screenPosition,
      textDefaults.screenPosition,
    );
    // Add text-specific lifecycle callbacks (only registered once)
    this.prependSetup(this.textSetup.bind(this) as any);
    this.prependUpdate(this.textUpdate.bind(this) as any);
    this.onCleanup(this.textDestroy.bind(this) as any);
  }

  public create(): this {
    // Clear previous state to prevent issues on reload
    this._sprite = null;
    this._texture = null;
    this._canvas = null;
    this._ctx = null;
    this._lastCanvasW = 0;
    this._lastCanvasH = 0;
    this.group = new Group();

    // Recreate the sprite
    this.createSprite();

    // Call parent create
    return super.create();
  }

  private createSprite() {
    this._canvas = document.createElement('canvas');
    this._ctx = this._canvas.getContext('2d');
    this._texture = new CanvasTexture(this._canvas);
    this._texture.minFilter = LinearFilter;
    this._texture.magFilter = LinearFilter;
    const material = new SpriteMaterial({
      map: this._texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      alphaTest: 0.5,
    });
    this._sprite = new ThreeSprite(material);
    this.group?.add(this._sprite);
    this.redrawText(this.options.text ?? '');
  }

  private measureAndResizeCanvas(
    text: string,
    fontSize: number,
    fontFamily: string,
    padding: number,
  ) {
    if (!this._canvas || !this._ctx) return { sizeChanged: false };
    this._ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = this._ctx.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = Math.ceil(fontSize * 1.4);
    const nextW = Math.max(2, textWidth + padding * 2);
    const nextH = Math.max(2, textHeight + padding * 2);
    const sizeChanged =
      nextW !== this._lastCanvasW || nextH !== this._lastCanvasH;
    this._canvas.width = nextW;
    this._canvas.height = nextH;
    this._lastCanvasW = nextW;
    this._lastCanvasH = nextH;
    return { sizeChanged };
  }

  private drawCenteredText(text: string, fontSize: number, fontFamily: string) {
    if (!this._canvas || !this._ctx) return;
    this._ctx.font = `${fontSize}px ${fontFamily}`;
    this._ctx.textAlign = 'center';
    this._ctx.textBaseline = 'middle';
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    if (this.options.backgroundColor) {
      this._ctx.fillStyle = this.toCssColor(this.options.backgroundColor);
      this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }
    this._ctx.fillStyle = this.toCssColor(this.options.fontColor ?? '#FFFFFF');
    this._ctx.fillText(text, this._canvas.width / 2, this._canvas.height / 2);
  }

  private updateTexture(sizeChanged: boolean) {
    if (!this._texture || !this._canvas) return;
    if (sizeChanged) {
      this._texture.dispose();
      this._texture = new CanvasTexture(this._canvas);
      this._texture.minFilter = LinearFilter;
      this._texture.magFilter = LinearFilter;
      this._texture.wrapS = ClampToEdgeWrapping;
      this._texture.wrapT = ClampToEdgeWrapping;
    }
    this._texture.image = this._canvas;
    this._texture.needsUpdate = true;
    if (this._sprite && this._sprite.material) {
      (this._sprite.material as any).map = this._texture;
      this._sprite.material.needsUpdate = true;
    }
  }

  private redrawText(_text: string) {
    if (!this._canvas || !this._ctx) return;
    const fontSize = this.options.fontSize ?? 18;
    const fontFamily =
      this.options.fontFamily ?? (textDefaults.fontFamily as string);
    const padding = this.options.padding ?? 4;

    const { sizeChanged } = this.measureAndResizeCanvas(
      _text,
      fontSize,
      fontFamily,
      padding,
    );
    this.drawCenteredText(_text, fontSize, fontFamily);
    this.updateTexture(Boolean(sizeChanged));

    if (this.options.stickToViewport && this._cameraRef) {
      this.updateStickyTransform();
    } else {
      this.updateWorldSpriteScale();
    }
  }

  private toCssColor(color: Color | string): string {
    if (typeof color === 'string') return color;
    const c = color instanceof Color ? color : new Color(color as any);
    return `#${c.getHexString()}`;
  }

  private textSetup(params: SetupContext<ZylemTextOptions>) {
    this._cameraRef = (params.camera as unknown) as ZylemCamera | null;
    if (this.options.stickToViewport && this._cameraRef) {
      (this._cameraRef.camera as any).add(this.group);
      this.updateStickyTransform();
    }
  }

  private textUpdate(params: UpdateContext<ZylemTextOptions>) {
    if (!this._sprite) return;
    if (this.options.stickToViewport && this._cameraRef) {
      this.updateStickyTransform();
    }
  }

  /** Where the text's pivot goes on screen, in pixels from the top-left. */
  private screenPoint(viewport: ViewportSize): ScreenPoint {
    const position = toThreeVector2(
      this.options.screenPosition,
      textDefaults.screenPosition,
    );
    if (this.options.screenAnchor) {
      return anchoredPoint(this.options.screenAnchor, position, viewport);
    }
    const isFractionX = position.x >= 0 && position.x <= 1;
    const isFractionY = position.y >= 0 && position.y <= 1;
    return {
      x: isFractionX ? position.x * viewport.width : position.x,
      y: isFractionY ? position.y * viewport.height : position.y,
    };
  }

  private updateWorldSpriteScale() {
    if (!this._canvas || !this._sprite) return;
    const aspect = this._canvas.width / Math.max(1, this._canvas.height);
    const fontSize = Math.max(1, this.options.fontSize ?? 18);
    const scaleY = Math.max(0.25, fontSize / 32);
    const scaleX = scaleY * aspect;
    this._sprite.scale.set(scaleX, scaleY, 1);
  }

  private updateStickyTransform() {
    if (!this._sprite || !this._cameraRef || !this._canvas) return;
    const viewport = viewportSize(this._cameraRef);
    const placement = placeOnViewport({
      camera: this._cameraRef.camera as PerspectiveCamera | OrthographicCamera,
      viewport,
      point: this.screenPoint(viewport),
      pivot: this.options.screenAnchor
        ? anchorFractions(this.options.screenAnchor)
        : { x: 0.5, y: 0.5 },
      size: { width: this._canvas.width, height: this._canvas.height },
      zDistance: this.options.zDistance ?? 1,
    });
    this._sprite.scale.set(placement.scale.x, placement.scale.y, 1);
    this.group?.position.set(
      placement.position.x,
      placement.position.y,
      placement.position.z,
    );
  }

  updateText(_text: string) {
    this.options.text = _text;
    this.redrawText(_text);
    if (this.options.stickToViewport && this._cameraRef) {
      this.updateStickyTransform();
    }
  }

  buildInfo(): Record<string, any> {
    const delegate = new DebugDelegate(this as any);
    const baseInfo = delegate.buildDebugInfo();

    return {
      ...baseInfo,
      type: String(ZylemText.type),
      text: this.options.text ?? '',
      sticky: this.options.stickToViewport,
    };
  }

  /**
   * Dispose of Three.js resources when the entity is destroyed.
   */
  private textDestroy(): void {
    // Dispose texture
    this._texture?.dispose();

    // Dispose sprite material
    if (this._sprite?.material) {
      (this._sprite.material as SpriteMaterial).dispose();
    }

    // Remove sprite from group
    if (this._sprite) {
      this._sprite.removeFromParent();
    }

    // Remove group from parent (camera or scene)
    this.group?.removeFromParent();

    // Clear references
    this._sprite = null;
    this._texture = null;
    this._canvas = null;
    this._ctx = null;
    this._cameraRef = null;
  }
}

type TextOptions = BaseNode | Partial<ZylemTextOptions>;

export function createText(...args: Array<TextOptions>): ZylemText {
  return createEntity<ZylemText, ZylemTextOptions>({
    args,
    defaultConfig: { ...textDefaults },
    EntityClass: ZylemText,
    BuilderClass: TextBuilder,
    entityType: ZylemText.type,
    cloneFactory: options => createText(options ?? {}),
  });
}
