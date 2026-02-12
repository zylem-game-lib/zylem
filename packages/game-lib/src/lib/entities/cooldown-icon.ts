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
	Texture,
	ClampToEdgeWrapping,
} from 'three';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { UpdateContext, SetupContext } from '../core/base-node-life-cycle';
import { ZylemCamera } from '../camera/zylem-camera';
import { getCooldown } from '../behaviors/cooldown/cooldown-store';

// ─────────────────────────────────────────────────────────────────────────────
// Screen anchor system
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reference point on the viewport for positioning UI elements.
 * The offset in `screenPosition` is applied relative to this anchor.
 */
export type ScreenAnchor =
	| 'top-left' | 'top-center' | 'top-right'
	| 'center-left' | 'center' | 'center-right'
	| 'bottom-left' | 'bottom-center' | 'bottom-right';

/** Fractional viewport coordinates for each anchor point. */
const ANCHOR_FRACTIONS: Record<ScreenAnchor, { fx: number; fy: number }> = {
	'top-left': { fx: 0, fy: 0 },
	'top-center': { fx: 0.5, fy: 0 },
	'top-right': { fx: 1, fy: 0 },
	'center-left': { fx: 0, fy: 0.5 },
	'center': { fx: 0.5, fy: 0.5 },
	'center-right': { fx: 1, fy: 0.5 },
	'bottom-left': { fx: 0, fy: 1 },
	'bottom-center': { fx: 0.5, fy: 1 },
	'bottom-right': { fx: 1, fy: 1 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Icon size unit system
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Height of the virtual unit grid (in abstract "view units").
 * Width scales with aspect ratio.
 * At 4:3 the grid is 256 × 192, fitting exactly 12 extra-large (64-unit) icons.
 */
const VIEW_UNITS_HEIGHT = 192;

/** Preset icon sizes in view units. */
const ICON_SIZE_PRESETS = {
	xs: 8,
	sm: 16,
	md: 32,
	lg: 48,
	xl: 64,
} as const;

/** Named size preset. */
export type IconSizePreset = keyof typeof ICON_SIZE_PRESETS;

/**
 * Icon size expressed as a named preset, a square unit value, or
 * a `{ width, height }` object for non-square icons.
 *
 * All numeric values are in **view units** (viewport height = 192 units).
 */
export type IconSize = IconSizePreset | number | { width: number; height: number };

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
	/**
	 * Size of the icon in view units, a named preset, or a `{ width, height }` object.
	 *
	 * Presets: `'xs'` (8), `'sm'` (16), `'md'` (32), `'lg'` (48), `'xl'` (64).
	 * A bare number creates a square icon of that many units.
	 * The viewport height equals 192 units; width scales with aspect ratio.
	 *
	 * @default 'md'
	 */
	iconSize?: IconSize;
	/** Whether to show remaining time text */
	showTimer?: boolean;
	/** Whether to attach to the camera viewport (default: true) */
	stickToViewport?: boolean;
	/**
	 * Viewport anchor the icon is positioned relative to.
	 * @default 'top-left'
	 */
	screenAnchor?: ScreenAnchor;
	/**
	 * Offset from the {@link screenAnchor} in **view units**.
	 * Positive x = right, positive y = down.
	 * Accepts a `Vector2` or a plain `{ x, y }` object.
	 * @default { x: 0, y: 0 }
	 */
	screenPosition?: Vector2 | { x: number; y: number };
	/** Distance from camera (default: 1) */
	zDistance?: number;
	/** Color of the sweep overlay (default: semi-transparent black) */
	overlayColor?: string;
};

const cooldownIconDefaults: ZylemCooldownIconOptions = {
	position: undefined,
	cooldown: '',
	iconSize: 'md',
	fillColor: '#333333',
	showTimer: true,
	stickToViewport: true,
	screenAnchor: 'top-left',
	screenPosition: { x: 0, y: 0 },
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
		this.onCleanup(this.iconDestroy.bind(this) as any);
	}

	private createSprite(): void {
		// Use a fixed canvas resolution for all icon sizes.
		// The actual display size is controlled by sprite scaling in updateStickyTransform.
		const canvasPixels = 128;
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
		// Recreate sprite resources if they were disposed by a previous cleanup
		if (!this._sprite) {
			this.createSprite();
		}
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
	 * Resolve screen position to pixels.
	 * Computes the anchor point in pixels, then adds the view-unit offset.
	 */
	private resolveScreenPosition(width: number, height: number): { px: number; py: number } {
		const anchor = this.options.screenAnchor ?? 'top-left';
		const pos = this.options.screenPosition ?? { x: 0, y: 0 };
		const ox = pos instanceof Vector2 ? pos.x : pos.x;
		const oy = pos instanceof Vector2 ? pos.y : pos.y;

		const { fx, fy } = ANCHOR_FRACTIONS[anchor];
		const ax = fx * width;
		const ay = fy * height;

		const pxPerUnit = height / VIEW_UNITS_HEIGHT;
		return { px: ax + ox * pxPerUnit, py: ay + oy * pxPerUnit };
	}

	/**
	 * Resolve `iconSize` to screen pixels using the view-unit grid.
	 * Viewport height = {@link VIEW_UNITS_HEIGHT} units; width scales with aspect ratio.
	 */
	private resolveIconSize(viewportHeight: number): { widthPx: number; heightPx: number } {
		const raw = this.options.iconSize ?? 'md';
		let w: number, h: number;
		if (typeof raw === 'string') {
			w = h = ICON_SIZE_PRESETS[raw as IconSizePreset];
		} else if (typeof raw === 'number') {
			w = h = raw;
		} else {
			w = raw.width;
			h = raw.height;
		}
		const pxPerUnit = viewportHeight / VIEW_UNITS_HEIGHT;
		return { widthPx: w * pxPerUnit, heightPx: h * pxPerUnit };
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
		const { px, py } = this.resolveScreenPosition(width, height);
		const zDist = Math.max(0.001, this.options.zDistance ?? 1);
		const { worldHalfW, worldHalfH } = this.computeWorldExtents(camera, zDist);

		const ndcX = (px / width) * 2 - 1;
		const ndcY = 1 - (py / height) * 2;
		const localX = ndcX * worldHalfW;
		const localY = ndcY * worldHalfH;

		{
			const planeH = worldHalfH * 2;
			const unitsPerPixel = planeH / height;
			const { widthPx, heightPx } = this.resolveIconSize(height);
			const scaleX = Math.max(0.0001, widthPx * unitsPerPixel);
			const scaleY = Math.max(0.0001, heightPx * unitsPerPixel);
			this._sprite.scale.set(scaleX, scaleY, 1);
		}

		this.group?.position.set(localX, localY, -zDist);
	}

	/**
	 * Dispose Three.js / DOM resources when the entity is destroyed.
	 */
	private iconDestroy(): void {
		// Dispose canvas texture (GPU memory)
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

		// Dispose loaded icon texture
		this._iconTexture?.dispose();

		// Clear references
		this._sprite = null;
		this._texture = null;
		this._canvas = null;
		this._ctx = null;
		this._cameraRef = null;
		this._iconTexture = null;
		this._iconImage = null;
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
 *   screenAnchor: 'top-center',         // reference point on the viewport
 *   screenPosition: { x: 0, y: 10 },    // offset in view units from anchor
 *   iconSize: 'sm',                      // preset (16 × 16 view units)
 *   // iconSize: 24,                     // square  (24 × 24 view units)
 *   // iconSize: { width: 16, height: 24 }, // custom rectangle
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
