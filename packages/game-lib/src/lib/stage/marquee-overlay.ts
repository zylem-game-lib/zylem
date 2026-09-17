/**
 * The 2D rectangle drawn while a marquee selection is being dragged.
 *
 * A plain absolutely positioned `div` over the canvas, not a scene object: it
 * lives in screen space, must not be affected by the camera or post
 * processing, and must never intercept the pointer it is following.
 */

export interface MarqueeRectPx {
	left: number;
	top: number;
	width: number;
	height: number;
}

const OVERLAY_ROOT_SELECTOR = '[data-zylem-overlay-root]';

/**
 * Pick the element the rectangle is positioned against.
 *
 * `GameCanvas` mounts a `pointer-events: none` overlay root beside the canvas,
 * which is the ideal host. Without one (a bare renderer), the canvas's parent
 * is used, which `GameCanvas` also makes `position: relative`.
 */
export function resolveMarqueeHost(canvas: HTMLElement): HTMLElement | null {
	const parent = canvas.parentElement;
	if (!parent) return null;
	const overlayRoot = parent.querySelector<HTMLElement>(OVERLAY_ROOT_SELECTOR);
	return overlayRoot ?? parent;
}

export class MarqueeOverlay {
	private element: HTMLDivElement | null = null;
	private host: HTMLElement | null = null;

	/** Position `rect` in the host's client coordinates and show it. */
	show(host: HTMLElement, rect: MarqueeRectPx): void {
		const element = this.ensureElement(host);
		element.style.left = `${rect.left}px`;
		element.style.top = `${rect.top}px`;
		element.style.width = `${rect.width}px`;
		element.style.height = `${rect.height}px`;
		element.style.display = 'block';
	}

	hide(): void {
		if (this.element) this.element.style.display = 'none';
	}

	dispose(): void {
		this.element?.remove();
		this.element = null;
		this.host = null;
	}

	private ensureElement(host: HTMLElement): HTMLDivElement {
		if (this.element && this.host === host) return this.element;
		this.element?.remove();

		const element = document.createElement('div');
		element.dataset.zylemMarquee = 'true';
		const style = element.style;
		style.position = 'absolute';
		style.pointerEvents = 'none';
		style.boxSizing = 'border-box';
		style.border = '1px solid rgba(34, 255, 34, 0.9)';
		style.background = 'rgba(34, 255, 34, 0.12)';
		style.display = 'none';
		// Above the overlay root's other children (virtual touch controls).
		style.zIndex = '20';

		host.appendChild(element);
		this.element = element;
		this.host = host;
		return element;
	}
}
