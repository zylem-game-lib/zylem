import { ZylemCamera } from '../camera/zylem-camera';
import { RendererManager } from '../camera/renderer-manager';
import { GameCanvas } from './game-canvas';
import { GameConfig } from './game-config';

/**
 * Observer that triggers renderer mounting when container and camera/renderer are both available.
 * Decouples renderer mounting from stage loading.
 * Supports both legacy ZylemCamera mode and new RendererManager mode.
 */
export class GameRendererObserver {
	private container: HTMLElement | null = null;
	private camera: ZylemCamera | null = null;
	private rendererManager: RendererManager | null = null;
	private gameCanvas: GameCanvas | null = null;
	private config: GameConfig | null = null;
	private mounted = false;

	setGameCanvas(canvas: GameCanvas): void {
		this.gameCanvas = canvas;
		this.tryMount();
	}

	setConfig(config: GameConfig): void {
		this.config = config;
		this.tryMount();
	}

	setContainer(container: HTMLElement): void {
		this.container = container;
		this.tryMount();
	}

	/**
	 * @deprecated Use setRendererManager instead for the new multi-camera path.
	 */
	setCamera(camera: ZylemCamera): void {
		this.camera = camera;
		this.tryMount();
	}

	/**
	 * Set the shared renderer manager (new path for multi-camera support).
	 */
	setRendererManager(manager: RendererManager): void {
		this.rendererManager = manager;
		this.tryMount();
	}

	/**
	 * Attempt to mount renderer if all dependencies are available.
	 */
	private tryMount(): void {
		if (this.mounted) return;
		if (!this.container || !this.gameCanvas) return;

		// Prefer RendererManager (new path), fall back to legacy ZylemCamera
		if (this.rendererManager) {
			this.mountWithRendererManager();
		} else if (this.camera) {
			this.mountWithCamera();
		}
	}

	/**
	 * Mount using the shared RendererManager.
	 */
	private mountWithRendererManager(): void {
		if (!this.rendererManager || !this.gameCanvas) return;

		const dom = this.rendererManager.getDomElement();
		const internal = this.config?.internalResolution;

		this.gameCanvas.mountRenderer(dom, (cssW, cssH) => {
			if (!this.rendererManager) return;
			if (internal) {
				this.rendererManager.setPixelRatio(1);
				this.rendererManager.resize(internal.width, internal.height);
			} else {
				const dpr = window.devicePixelRatio || 1;
				this.rendererManager.setPixelRatio(dpr);
				this.rendererManager.resize(cssW, cssH);
			}
		});

		this.mounted = true;
	}

	/**
	 * Mount using a legacy ZylemCamera (backward compatible).
	 */
	private mountWithCamera(): void {
		if (!this.camera || !this.gameCanvas) return;

		const dom = this.camera.getDomElement();
		const internal = this.config?.internalResolution;
		
		this.gameCanvas.mountRenderer(dom, (cssW, cssH) => {
			if (!this.camera) return;
			if (internal) {
				this.camera.setPixelRatio(1);
				this.camera.resize(internal.width, internal.height);
			} else {
				const dpr = window.devicePixelRatio || 1;
				this.camera.setPixelRatio(dpr);
				this.camera.resize(cssW, cssH);
			}
		});
		
		this.mounted = true;
	}

	/**
	 * Reset state for stage transitions.
	 */
	reset(): void {
		this.camera = null;
		this.mounted = false;
		// Keep rendererManager -- it persists across stages
	}

	dispose(): void {
		this.container = null;
		this.camera = null;
		this.rendererManager = null;
		this.gameCanvas = null;
		this.config = null;
		this.mounted = false;
	}
}
