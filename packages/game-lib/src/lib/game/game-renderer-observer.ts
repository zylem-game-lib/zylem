import { ZylemCamera } from '../camera/zylem-camera';
import { GameCanvas } from './game-canvas';
import { GameConfig } from './game-config';

/**
 * Observer that triggers renderer mounting when container and camera are both available.
 * Decouples renderer mounting from stage loading.
 */
export class GameRendererObserver {
	private container: HTMLElement | null = null;
	private camera: ZylemCamera | null = null;
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

	setCamera(camera: ZylemCamera): void {
		this.camera = camera;
		this.tryMount();
	}

	/**
	 * Attempt to mount renderer if all dependencies are available.
	 */
	private tryMount(): void {
		if (this.mounted) return;
		if (!this.container || !this.camera || !this.gameCanvas) return;

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
	}

	dispose(): void {
		this.container = null;
		this.camera = null;
		this.gameCanvas = null;
		this.config = null;
		this.mounted = false;
	}
}
