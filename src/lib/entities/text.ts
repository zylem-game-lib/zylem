import { Color, Group, Sprite as ThreeSprite, SpriteMaterial, CanvasTexture, LinearFilter, Vector2, PerspectiveCamera, OrthographicCamera, ClampToEdgeWrapping } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { createEntity } from './create';
import { UpdateContext, SetupContext } from '../core/base-node-life-cycle';
import { ZylemCamera } from '../camera/zylem-camera';
import { DebugDelegate } from './delegates/debug';

type ZylemTextOptions = GameEntityOptions & {
	text?: string;
	fontFamily?: string;
	fontSize?: number;
	fontColor?: Color | string;
	backgroundColor?: Color | string | null;
	padding?: number;
	stickToViewport?: boolean;
	screenPosition?: Vector2;
	zDistance?: number;
};

const textDefaults: ZylemTextOptions = {
	position: undefined,
	text: '',
	fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
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
		this.options = { ...textDefaults, ...options } as ZylemTextOptions;
		this.group = new Group();
		this.createSprite();
		this.lifeCycleDelegate = {
			setup: [this.textSetup.bind(this) as any],
			update: [this.textUpdate.bind(this) as any],
		};
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

	private redrawText(_text: string) {
		if (!this._canvas || !this._ctx) return;
		const fontSize = this.options.fontSize ?? 18;
		const fontFamily = this.options.fontFamily ?? (textDefaults.fontFamily as string);
		const padding = this.options.padding ?? 4;
		this._ctx.font = `${fontSize}px ${fontFamily}`;
		const metrics = this._ctx.measureText(_text);
		const textWidth = Math.ceil(metrics.width);
		const textHeight = Math.ceil(fontSize * 1.4);
		const nextW = Math.max(2, textWidth + padding * 2);
		const nextH = Math.max(2, textHeight + padding * 2);
		const sizeChanged = nextW !== this._lastCanvasW || nextH !== this._lastCanvasH;
		this._canvas.width = nextW;
		this._canvas.height = nextH;
		this._lastCanvasW = nextW;
		this._lastCanvasH = nextH;

		this._ctx.font = `${fontSize}px ${fontFamily}`;
		this._ctx.textBaseline = 'top';
		this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
		if (this.options.backgroundColor) {
			this._ctx.fillStyle = this.toCssColor(this.options.backgroundColor);
			this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
		}
		this._ctx.fillStyle = this.toCssColor(this.options.fontColor ?? '#FFFFFF');
		this._ctx.fillText(_text, padding, padding);

		if (this._texture) {
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
		}
	}

	private textUpdate(params: UpdateContext<ZylemTextOptions>) {
		if (!this._sprite) return;
		if (this.options.stickToViewport && this._cameraRef) {
			this.updateStickyTransform();
		}
	}

	private updateStickyTransform() {
		if (!this._sprite || !this._cameraRef) return;
		const camera = this._cameraRef.camera;
		const dom = this._cameraRef.renderer.domElement;
		const width = dom.clientWidth;
		const height = dom.clientHeight;
		const px = (this.options.screenPosition ?? new Vector2(24, 24)).x;
		const py = (this.options.screenPosition ?? new Vector2(24, 24)).y;
		const zDist = Math.max(0.001, this.options.zDistance ?? 1);

		let worldHalfW = 1;
		let worldHalfH = 1;
		if ((camera as PerspectiveCamera).isPerspectiveCamera) {
			const pc = camera as PerspectiveCamera;
			const halfH = Math.tan((pc.fov * Math.PI) / 180 / 2) * zDist;
			const halfW = halfH * pc.aspect;
			worldHalfW = halfW;
			worldHalfH = halfH;
		} else if ((camera as OrthographicCamera).isOrthographicCamera) {
			const oc = camera as OrthographicCamera;
			worldHalfW = (oc.right - oc.left) / 2;
			worldHalfH = (oc.top - oc.bottom) / 2;
		}

		const ndcX = (px / width) * 2 - 1;
		const ndcY = 1 - (py / height) * 2;
		const localX = ndcX * worldHalfW;
		const localY = ndcY * worldHalfH;
		this.group?.position.set(localX, localY, -zDist);

		if (this._canvas) {
			const planeH = worldHalfH * 2;
			const unitsPerPixel = planeH / height;
			const pixelH = this._canvas.height;
			const scaleY = Math.max(0.0001, pixelH * unitsPerPixel);
			const aspect = this._canvas.width / this._canvas.height;
			const scaleX = scaleY * aspect;
			this._sprite.scale.set(scaleX, scaleY, 1);
		}
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
}

type TextOptions = BaseNode | Partial<ZylemTextOptions>;

export async function text(...args: Array<TextOptions>): Promise<ZylemText> {
	return createEntity<ZylemText, ZylemTextOptions>({
		args,
		defaultConfig: { ...textDefaults },
		EntityClass: ZylemText,
		BuilderClass: TextBuilder,
		entityType: ZylemText.type,
	});
}


