import { Color, Group, Sprite as ThreeSprite, SpriteMaterial, CanvasTexture, LinearFilter, Vector2, PerspectiveCamera, OrthographicCamera, ClampToEdgeWrapping, ShaderMaterial, Mesh, PlaneGeometry, Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { createEntity } from './create';
import { UpdateContext, SetupContext } from '../core/base-node-life-cycle';
import { ZylemCamera } from '../camera/zylem-camera';
import { DebugDelegate } from './delegates/debug';

type ZylemRectOptions = GameEntityOptions & {
	width?: number;
	height?: number;
	fillColor?: Color | string | null;
	strokeColor?: Color | string | null;
	strokeWidth?: number;
	radius?: number;
	padding?: number;
	stickToViewport?: boolean;
	screenPosition?: Vector2;
	zDistance?: number;
	anchor?: Vector2; // 0-100 per axis, default top-left (0,0)
	bounds?: {
		screen?: { x: number; y: number; width: number; height: number };
		world?: { left: number; right: number; top: number; bottom: number; z?: number };
	};
};

const rectDefaults: ZylemRectOptions = {
	position: undefined,
	width: 120,
	height: 48,
	fillColor: '#FFFFFF',
	strokeColor: null,
	strokeWidth: 0,
	radius: 0,
	padding: 0,
	stickToViewport: true,
	screenPosition: new Vector2(24, 24),
	zDistance: 1,
	anchor: new Vector2(0, 0),
};

export class RectBuilder extends EntityBuilder<ZylemRect, ZylemRectOptions> {
	protected createEntity(options: Partial<ZylemRectOptions>): ZylemRect {
		return new ZylemRect(options);
	}
}

export const RECT_TYPE = Symbol('Rect');

export class ZylemRect extends GameEntity<ZylemRectOptions> {
	static type = RECT_TYPE;

	private _sprite: ThreeSprite | null = null;
	private _mesh: Mesh | null = null;
	private _texture: CanvasTexture | null = null;
	private _canvas: HTMLCanvasElement | null = null;
	private _ctx: CanvasRenderingContext2D | null = null;
	private _cameraRef: ZylemCamera | null = null;
	private _lastCanvasW: number = 0;
	private _lastCanvasH: number = 0;

	constructor(options?: ZylemRectOptions) {
		super();
		this.options = { ...rectDefaults, ...options } as ZylemRectOptions;
		this.group = new Group();
		this.createSprite();
		// Add rect-specific lifecycle callbacks
		this.prependSetup(this.rectSetup.bind(this) as any);
		this.prependUpdate(this.rectUpdate.bind(this) as any);
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
		this.redrawRect();
	}

	private redrawRect() {
		if (!this._canvas || !this._ctx) return;
		const width = Math.max(2, Math.floor((this.options.width ?? 120)));
		const height = Math.max(2, Math.floor((this.options.height ?? 48)));
		const padding = this.options.padding ?? 0;
		const strokeWidth = this.options.strokeWidth ?? 0;
		const totalW = width + padding * 2 + strokeWidth;
		const totalH = height + padding * 2 + strokeWidth;
		const nextW = Math.max(2, totalW);
		const nextH = Math.max(2, totalH);
		const sizeChanged = nextW !== this._lastCanvasW || nextH !== this._lastCanvasH;
		this._canvas.width = nextW;
		this._canvas.height = nextH;
		this._lastCanvasW = nextW;
		this._lastCanvasH = nextH;

		this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

		const radius = Math.max(0, this.options.radius ?? 0);
		const rectX = Math.floor(padding + strokeWidth / 2);
		const rectY = Math.floor(padding + strokeWidth / 2);
		const rectW = Math.floor(width);
		const rectH = Math.floor(height);

		this._ctx.beginPath();
		if (radius > 0) {
			this.roundedRectPath(this._ctx, rectX, rectY, rectW, rectH, radius);
		} else {
			this._ctx.rect(rectX, rectY, rectW, rectH);
		}

		if (this.options.fillColor) {
			this._ctx.fillStyle = this.toCssColor(this.options.fillColor);
			this._ctx.fill();
		}

		if ((this.options.strokeColor && (strokeWidth > 0))) {
			this._ctx.lineWidth = strokeWidth;
			this._ctx.strokeStyle = this.toCssColor(this.options.strokeColor);
			this._ctx.stroke();
		}

		if (this._texture) {
			if (sizeChanged) {
				this._texture.dispose();
				this._texture = new CanvasTexture(this._canvas);
				this._texture.minFilter = LinearFilter;
				this._texture.magFilter = LinearFilter;
				this._texture.wrapS = ClampToEdgeWrapping;
				this._texture.wrapT = ClampToEdgeWrapping;
				if (this._sprite && this._sprite.material instanceof ShaderMaterial) {
					const shader = this._sprite.material as ShaderMaterial;
					if (shader.uniforms?.tDiffuse) shader.uniforms.tDiffuse.value = this._texture;
					if (shader.uniforms?.iResolution) shader.uniforms.iResolution.value.set(this._canvas.width, this._canvas.height, 1);
				}
			}
			this._texture.image = this._canvas;
			this._texture.needsUpdate = true;
			if (this._sprite && this._sprite.material) {
				(this._sprite.material as any).map = this._texture;
				this._sprite.material.needsUpdate = true;
			}
		}
	}

	private roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
		const radius = Math.min(r, Math.floor(Math.min(w, h) / 2));
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + w - radius, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
		ctx.lineTo(x + w, y + h - radius);
		ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
		ctx.lineTo(x + radius, y + h);
		ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
	}

	private toCssColor(color: Color | string): string {
		if (typeof color === 'string') return color;
		const c = color instanceof Color ? color : new Color(color as any);
		return `#${c.getHexString()}`;
	}

	private rectSetup(params: SetupContext<ZylemRectOptions>) {
		this._cameraRef = (params.camera as unknown) as ZylemCamera | null;
		if (this.options.stickToViewport && this._cameraRef) {
			(this._cameraRef.camera as any).add(this.group);
		}

		if (this.materials?.length && this._sprite) {
			const mat = this.materials[0];
			if (mat instanceof ShaderMaterial) {
				mat.transparent = true;
				mat.depthTest = false;
				mat.depthWrite = false;
				if (this._texture) {
					if (mat.uniforms?.tDiffuse) mat.uniforms.tDiffuse.value = this._texture;
					if (mat.uniforms?.iResolution && this._canvas) mat.uniforms.iResolution.value.set(this._canvas.width, this._canvas.height, 1);
				}
				this._mesh = new Mesh(new PlaneGeometry(1, 1), mat);
				this.group?.add(this._mesh);
				this._sprite.visible = false;
			}
		}
	}

	private rectUpdate(params: UpdateContext<ZylemRectOptions>) {
		if (!this._sprite) return;

		// If bounds provided, compute screen-space rect from it and update size/position
		if (this._cameraRef && this.options.bounds) {
			const dom = this._cameraRef.renderer.domElement;
			const screen = this.computeScreenBoundsFromOptions(this.options.bounds);
			if (screen) {
				const { x, y, width, height } = screen;
				const desiredW = Math.max(2, Math.floor(width));
				const desiredH = Math.max(2, Math.floor(height));
				const changed = desiredW !== (this.options.width ?? 0) || desiredH !== (this.options.height ?? 0);
				this.options.screenPosition = new Vector2(Math.floor(x), Math.floor(y));
				this.options.width = desiredW;
				this.options.height = desiredH;
				this.options.anchor = new Vector2(0, 0);
				if (changed) {
					this.redrawRect();
				}
			}
		}
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

		let scaleX = 1;
		let scaleY = 1;
		if (this._canvas) {
			const planeH = worldHalfH * 2;
			const unitsPerPixel = planeH / height;
			const pixelH = this._canvas.height;
			scaleY = Math.max(0.0001, pixelH * unitsPerPixel);
			const aspect = this._canvas.width / this._canvas.height;
			scaleX = scaleY * aspect;
			this._sprite.scale.set(scaleX, scaleY, 1);
			if (this._mesh) this._mesh.scale.set(scaleX, scaleY, 1);
		}

		const anchor = this.options.anchor ?? new Vector2(0, 0);
		const ax = Math.min(100, Math.max(0, anchor.x)) / 100; // 0..1
		const ay = Math.min(100, Math.max(0, anchor.y)) / 100; // 0..1
		const offsetX = (0.5 - ax) * scaleX;
		const offsetY = (ay - 0.5) * scaleY;
		this.group?.position.set(localX + offsetX, localY + offsetY, -zDist);
	}

	private worldToScreen(point: Vector3) {
		if (!this._cameraRef) return { x: 0, y: 0 };
		const camera = this._cameraRef.camera;
		const dom = this._cameraRef.renderer.domElement;
		const v = point.clone().project(camera);
		const x = (v.x + 1) / 2 * dom.clientWidth;
		const y = (1 - v.y) / 2 * dom.clientHeight;
		return { x, y };
	}

	private computeScreenBoundsFromOptions(bounds: NonNullable<ZylemRectOptions['bounds']>): { x: number; y: number; width: number; height: number } | null {
		if (!this._cameraRef) return null;
		const dom = this._cameraRef.renderer.domElement;
		if (bounds.screen) {
			return { ...bounds.screen };
		}
		if (bounds.world) {
			const { left, right, top, bottom, z = 0 } = bounds.world;
			const tl = this.worldToScreen(new Vector3(left, top, z));
			const br = this.worldToScreen(new Vector3(right, bottom, z));
			const x = Math.min(tl.x, br.x);
			const y = Math.min(tl.y, br.y);
			const width = Math.abs(br.x - tl.x);
			const height = Math.abs(br.y - tl.y);
			return { x, y, width, height };
		}
		return null;
	}

	updateRect(options?: Partial<Pick<ZylemRectOptions, 'width' | 'height' | 'fillColor' | 'strokeColor' | 'strokeWidth' | 'radius'>>) {
		this.options = { ...this.options, ...options } as ZylemRectOptions;
		this.redrawRect();
		if (this.options.stickToViewport && this._cameraRef) {
			this.updateStickyTransform();
		}
	}

	buildInfo(): Record<string, any> {
		const delegate = new DebugDelegate(this as any);
		const baseInfo = delegate.buildDebugInfo();

		return {
			...baseInfo,
			type: String(ZylemRect.type),
			width: this.options.width ?? 0,
			height: this.options.height ?? 0,
			sticky: this.options.stickToViewport,
		};
	}
}

type RectOptions = BaseNode | Partial<ZylemRectOptions>;

export function createRect(...args: Array<RectOptions>): ZylemRect {
	return createEntity<ZylemRect, ZylemRectOptions>({
		args,
		defaultConfig: { ...rectDefaults },
		EntityClass: ZylemRect,
		BuilderClass: RectBuilder,
		entityType: ZylemRect.type,
	});
}


