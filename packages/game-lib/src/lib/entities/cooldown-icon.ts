/**
 * CooldownIcon -- a WoW-style cooldown icon UI entity.
 *
 * Renders a square icon with a semi-transparent clockwise sweep overlay
 * that reflects cooldown progress from the CooldownStore. Optionally shows
 * remaining time text in the center.
 *
 * Modeled after ZylemRect's canvas-based viewport-attached sprite pattern.
 */

import {
	Group,
	Sprite as ThreeSprite,
	SpriteMaterial,
	CanvasTexture,
	LinearFilter,
	Vector2,
	PerspectiveCamera,
	OrthographicCamera,
	Color,
	TextureLoader,
	Texture,
	ClampToEdgeWrapping,
} from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { UpdateContext, SetupContext } from '../core/base-node-life-cycle';
import { ZylemCamera } from '../camera/zylem-camera';
import { getCooldown } from '../behaviors/cooldown/cooldown-store';

// ─────────────────────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────────────────────

type ZylemCooldownIconOptions = GameEntityOptions & {
	/** Name of the cooldown in the CooldownStore */
	cooldown: string;
	/** Texture path for the icon background (optional) */
	icon?: string;
	/** Solid fill color when no icon texture is provided */
	fillColor?: Color | string;
	/** Size of the icon -- values 0-1 are treated as a fraction of viewport height, otherwise pixels */
	iconSize?: number;
	/** Whether to show remaining time text */
	showTimer?: boolean;
	/** Whether to attach to the camera viewport (default: true) */
	stickToViewport?: boolean;
	/** Screen position -- values 0-1 are treated as percentages, otherwise pixels */
	screenPosition?: Vector2;
	/** Distance from camera (default: 1) */
	zDistance?: number;
	/** Color of the sweep overlay (default: semi-transparent black) */
	overlayColor?: string;
};

const cooldownIconDefaults: ZylemCooldownIconOptions = {
	position: undefined,
	cooldown: '',
	iconSize: 48,
	fillColor: '#333333',
	showTimer: true,
	stickToViewport: true,
	screenPosition: new Vector2(24, 24),
	zDistance: 1,
	overlayColor: 'rgba(0, 0, 0, 0.65)',
};

export const COOLDOWN_ICON_TYPE = Symbol('CooldownIcon');

// ─────────────────────────────────────────────────────────────────────────────
// Entity class
// ─────────────────────────────────────────────────────────────────────────────

export class ZylemCooldownIcon extends GameEntity<ZylemCooldownIconOptions> {
	static type = COOLDOWN_ICON_TYPE;

	private _sprite: ThreeSprite | null = null;
	private _texture: CanvasTexture | null = null;
	private _canvas: HTMLCanvasElement | null = null;
	private _ctx: CanvasRenderingContext2D | null = null;
	private _cameraRef: ZylemCamera | null = null;
	private _iconTexture: Texture | null = null;
	private _iconImage: HTMLImageElement | null = null;
	private _lastRenderedProgress: number = -1;

	constructor(options?: ZylemCooldownIconOptions) {
		super();
		this.options = { ...cooldownIconDefaults, ...options } as ZylemCooldownIconOptions;
		this.group = new Group();
		this.createSprite();
		this.prependSetup(this.iconSetup.bind(this) as any);
		this.prependUpdate(this.iconUpdate.bind(this) as any);
	}

	private createSprite(): void {
		const rawSize = this.options.iconSize ?? 48;
		// If iconSize is a viewport fraction (0-1), use a fixed canvas resolution for quality.
		// The actual display size is handled by sprite scaling in updateStickyTransform.
		const canvasPixels = (rawSize > 0 && rawSize <= 1) ? 96 : rawSize;
		this._canvas = document.createElement('canvas');
		this._canvas.width = canvasPixels * 2; // 2x for retina
		this._canvas.height = canvasPixels * 2;
		this._ctx = this._canvas.getContext('2d');
		this._texture = new CanvasTexture(this._canvas);
		this._texture.minFilter = LinearFilter;
		this._texture.magFilter = LinearFilter;
		this._texture.wrapS = ClampToEdgeWrapping;
		this._texture.wrapT = ClampToEdgeWrapping;
		const material = new SpriteMaterial({
			map: this._texture,
			transparent: true,
			depthTest: false,
			depthWrite: false,
		});
		this._sprite = new ThreeSprite(material);
		this.group?.add(this._sprite);

		// Load icon texture if provided
		if (this.options.icon) {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			img.onload = () => {
				this._iconImage = img;
				this.redraw(this._lastRenderedProgress >= 0 ? this._lastRenderedProgress : 1);
			};
			img.src = this.options.icon;
		}

		this.redraw(1); // Initial draw at "ready" state
	}

	private redraw(progress: number): void {
		if (!this._canvas || !this._ctx) return;
		const ctx = this._ctx;
		const w = this._canvas.width;
		const h = this._canvas.height;
		const cx = w / 2;
		const cy = h / 2;
		const radius = Math.min(cx, cy);

		ctx.clearRect(0, 0, w, h);

		// Draw icon background (image or solid color)
		if (this._iconImage) {
			ctx.drawImage(this._iconImage, 0, 0, w, h);
		} else {
			ctx.fillStyle = this.toCssColor(this.options.fillColor ?? '#333333');
			ctx.fillRect(0, 0, w, h);
		}

		// Draw sweep overlay (clockwise from top, covering the "not ready" portion)
		if (progress < 1) {
			const sweepAngle = (1 - progress) * Math.PI * 2;
			const startAngle = -Math.PI / 2; // 12 o'clock
			const endAngle = startAngle + sweepAngle;

			ctx.save();
			ctx.fillStyle = this.options.overlayColor ?? 'rgba(0, 0, 0, 0.65)';
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.arc(cx, cy, radius + 1, startAngle, endAngle, false);
			ctx.closePath();
			ctx.fill();
			ctx.restore();

			// Draw remaining time text
			if (this.options.showTimer) {
				const entry = getCooldown(this.options.cooldown);
				if (entry) {
					const remaining = Math.max(0, entry.duration - entry.elapsed);
					const text = remaining >= 10 ? Math.ceil(remaining).toString() : remaining.toFixed(1);
					const fontSize = Math.floor(w * 0.3);
					ctx.font = `bold ${fontSize}px sans-serif`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillStyle = '#FFFFFF';
					ctx.strokeStyle = '#000000';
					ctx.lineWidth = 2;
					ctx.strokeText(text, cx, cy);
					ctx.fillText(text, cx, cy);
				}
			}
		}

		if (this._texture) {
			this._texture.needsUpdate = true;
		}
		this._lastRenderedProgress = progress;
	}

	private toCssColor(color: Color | string): string {
		if (typeof color === 'string') return color;
		const c = color instanceof Color ? color : new Color(color as any);
		return `#${c.getHexString()}`;
	}

	private getResolution(): { width: number; height: number } {
		try {
			const dom = this._cameraRef?.renderer?.domElement;
			if (dom) {
				return { width: dom.clientWidth || 1, height: dom.clientHeight || 1 };
			}
		} catch { /* renderer not available */ }
		return {
			width: this._cameraRef?.screenResolution?.x ?? 1,
			height: this._cameraRef?.screenResolution?.y ?? 1,
		};
	}

	private iconSetup(params: SetupContext<ZylemCooldownIconOptions>): void {
		this._cameraRef = (params.camera as unknown) as ZylemCamera | null;
		if (this.options.stickToViewport && this._cameraRef) {
			(this._cameraRef.camera as any).add(this.group);
			this.updateStickyTransform();
		}
	}

	private iconUpdate(_params: UpdateContext<ZylemCooldownIconOptions>): void {
		// Read cooldown progress from the global store
		const entry = getCooldown(this.options.cooldown);
		const progress = entry?.progress ?? 1;

		// Only redraw if progress changed visibly (threshold ~2%)
		if (Math.abs(progress - this._lastRenderedProgress) > 0.02 || progress === 1 && this._lastRenderedProgress !== 1) {
			this.redraw(progress);
		}

		// Update viewport-attached position
		if (this.options.stickToViewport && this._cameraRef) {
			this.updateStickyTransform();
		}
	}

	/**
	 * Convert screen position to pixels.
	 * Values in 0-1 are treated as viewport percentages; otherwise as raw pixels.
	 */
	private getScreenPixels(sp: Vector2, width: number, height: number) {
		const isPercentX = sp.x >= 0 && sp.x <= 1;
		const isPercentY = sp.y >= 0 && sp.y <= 1;
		return {
			px: isPercentX ? sp.x * width : sp.x,
			py: isPercentY ? sp.y * height : sp.y,
		};
	}

	/**
	 * Resolve iconSize to screen pixels.
	 * Values 0-1 are treated as a fraction of viewport height; otherwise raw pixels.
	 */
	private getIconSizePixels(viewportHeight: number): number {
		const raw = this.options.iconSize ?? 48;
		return (raw > 0 && raw <= 1) ? raw * viewportHeight : raw;
	}

	/** Compute the world-space half-extents at a given distance from the camera. */
	private computeWorldExtents(camera: PerspectiveCamera | OrthographicCamera, zDist: number) {
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
		return { worldHalfW, worldHalfH };
	}

	private updateStickyTransform(): void {
		if (!this._sprite || !this._cameraRef) return;
		const camera = this._cameraRef.camera as PerspectiveCamera | OrthographicCamera;
		const { width, height } = this.getResolution();
		const sp = this.options.screenPosition ?? new Vector2(24, 24);
		const { px, py } = this.getScreenPixels(sp, width, height);
		const zDist = Math.max(0.001, this.options.zDistance ?? 1);
		const { worldHalfW, worldHalfH } = this.computeWorldExtents(camera, zDist);

		const ndcX = (px / width) * 2 - 1;
		const ndcY = 1 - (py / height) * 2;
		const localX = ndcX * worldHalfW;
		const localY = ndcY * worldHalfH;

		{
			const planeH = worldHalfH * 2;
			const unitsPerPixel = planeH / height;
			const pixelH = this.getIconSizePixels(height);
			const scaleY = Math.max(0.0001, pixelH * unitsPerPixel);
			const scaleX = scaleY; // square icon
			this._sprite.scale.set(scaleX, scaleY, 1);
		}

		this.group?.position.set(localX, localY, -zDist);
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory
// ─────────────────────────────────────────────────────────────────────────────

type CooldownIconOptions = BaseNode | Partial<ZylemCooldownIconOptions>;

/**
 * Create a WoW-style cooldown icon UI entity.
 *
 * @example
 * ```ts
 * const attackIcon = createCooldownIcon({
 *   cooldown: 'attack',
 *   icon: swordIconPath,
 *   screenPosition: new Vector2(0.35, 0.9), // 35% from left, 90% from top
 *   stickToViewport: true,
 *   iconSize: 0.06, // 6% of viewport height
 * });
 * ```
 */
export function createCooldownIcon(...args: Array<CooldownIconOptions>): ZylemCooldownIcon {
	const configArgs = args.filter(
		(arg): arg is Partial<ZylemCooldownIconOptions> => !(arg instanceof BaseNode),
	);
	let options: Partial<ZylemCooldownIconOptions> = { ...cooldownIconDefaults };
	for (const opt of configArgs) {
		options = { ...options, ...opt };
	}
	return new ZylemCooldownIcon(options as ZylemCooldownIconOptions);
}
