import Stats from 'stats.js';
import { subscribe } from 'valtio/vanilla';
import { debugState } from '../debug/debug-state';

/** Dispatched by the editor's main panel when its FPS mount point appears or leaves. */
const FPS_HOST_EVENT = 'zylem-fps-host';

interface FpsHostDetail {
	element?: HTMLElement | null;
}

/**
 * GameDebugDelegate handles debug UI for the game (Stats panel).
 * Subscribes to debugState changes for runtime toggle.
 * The FPS graph mounts into the editor panel when that panel publishes a host.
 */
export class GameDebugDelegate {
	private statsRef: Stats | null = null;
	private unsubscribe: (() => void) | null = null;
	private host: HTMLElement | null = null;
	private readonly onFpsHost = (event: Event): void => {
		const detail = (event as CustomEvent<FpsHostDetail>).detail;
		this.host = detail?.element ?? null;
		this.attachStats();
	};

	constructor() {
		if (typeof window !== 'undefined') {
			window.addEventListener(FPS_HOST_EVENT, this.onFpsHost);
		}
		this.updateDebugUI();
		this.unsubscribe = subscribe(debugState, () => {
			this.updateDebugUI();
		});
	}

	/**
	 * Called every frame - wraps stats.begin()
	 */
	begin(): void {
		this.statsRef?.begin();
	}

	/**
	 * Called every frame - wraps stats.end()
	 */
	end(): void {
		this.statsRef?.end();
	}

	private styleForPanel(dom: HTMLElement): void {
		dom.style.position = 'relative';
		dom.style.top = 'auto';
		dom.style.right = 'auto';
		dom.style.bottom = 'auto';
		dom.style.left = 'auto';
		dom.style.zIndex = 'auto';
	}

	private detachStats(): void {
		const dom = this.statsRef?.dom;
		if (dom?.parentNode) {
			dom.parentNode.removeChild(dom);
		}
	}

	/** Append the graph to the panel host. With no host, it stays off the page. */
	private attachStats(): void {
		if (!this.statsRef) return;
		if (!this.host) {
			this.detachStats();
			return;
		}
		this.styleForPanel(this.statsRef.dom);
		if (this.statsRef.dom.parentNode !== this.host) {
			this.host.appendChild(this.statsRef.dom);
		}
	}

	private updateDebugUI(): void {
		if (debugState.enabled && !this.statsRef) {
			this.statsRef = new Stats();
			this.statsRef.showPanel(0);
			this.attachStats();
		} else if (!debugState.enabled && this.statsRef) {
			this.detachStats();
			this.statsRef = null;
		}
	}

	dispose(): void {
		if (typeof window !== 'undefined') {
			window.removeEventListener(FPS_HOST_EVENT, this.onFpsHost);
		}
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
		this.detachStats();
		this.statsRef = null;
		this.host = null;
	}
}
