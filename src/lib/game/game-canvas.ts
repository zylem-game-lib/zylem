import { AspectRatioDelegate, AspectRatioValue } from '../device/aspect-ratio';

export interface GameCanvasOptions {
	id: string;
	container?: HTMLElement;
	containerId?: string;
	canvas?: HTMLCanvasElement;
	bodyBackground?: string;
	fullscreen?: boolean;
	aspectRatio: AspectRatioValue | number;
}

/**
 * GameCanvas is a DOM delegate that owns:
 * - container lookup/creation and styling (including fullscreen centering)
 * - body background application
 * - canvas mounting into container
 * - aspect ratio sizing via AspectRatioDelegate
 */
export class GameCanvas {
	id: string;
	container!: HTMLElement;
	canvas!: HTMLCanvasElement;
	bodyBackground?: string;
	fullscreen: boolean;
	aspectRatio: number;
	private ratioDelegate: AspectRatioDelegate | null = null;

	constructor(options: GameCanvasOptions) {
		this.id = options.id;
		this.container = this.ensureContainer(options.containerId ?? options.id, options.container);
		this.canvas = options.canvas ?? document.createElement('canvas');
		this.bodyBackground = options.bodyBackground;
		this.fullscreen = Boolean(options.fullscreen);
		this.aspectRatio = typeof options.aspectRatio === 'number' ? options.aspectRatio : options.aspectRatio;
	}

	applyBodyBackground() {
		if (this.bodyBackground) {
			document.body.style.background = this.bodyBackground;
		}
	}

	mountCanvas() {
		while (this.container.firstChild) {
			this.container.removeChild(this.container.firstChild);
		}
		this.container.appendChild(this.canvas);
	}

	mountRenderer(rendererDom: HTMLCanvasElement, onResize: (width: number, height: number) => void) {
		while (this.container.firstChild) {
			this.container.removeChild(this.container.firstChild);
		}
		this.container.appendChild(rendererDom);
		this.canvas = rendererDom;
		this.attachAspectRatio(onResize);
	}

	centerIfFullscreen() {
		if (!this.fullscreen) return;
		const style = this.container.style;
		style.display = 'flex';
		style.alignItems = 'center';
		style.justifyContent = 'center';
		style.position = 'fixed';
		style.inset = '0';
	}

	attachAspectRatio(onResize: (width: number, height: number) => void) {
		if (!this.ratioDelegate) {
			this.ratioDelegate = new AspectRatioDelegate({
				container: this.container,
				canvas: this.canvas,
				aspectRatio: this.aspectRatio,
				onResize
			});
			this.ratioDelegate.attach();
		} else {
			this.ratioDelegate.apply();
		}
	}

	destroy() {
		this.ratioDelegate?.detach();
		this.ratioDelegate = null;
	}

	private ensureContainer(containerId?: string, existing?: HTMLElement | null): HTMLElement {
		if (existing) return existing;
		if (containerId) {
			const found = document.getElementById(containerId);
			if (found) return found;
		}
		const id = containerId || this.id || 'zylem-root';
		const el = document.createElement('main');
		el.setAttribute('id', id);
		el.style.position = 'relative';
		el.style.width = '100%';
		el.style.height = '100%';
		document.body.appendChild(el);
		return el;
	}
}
