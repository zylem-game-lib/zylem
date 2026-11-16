/**
 * Outlines for hovered and selected HUD elements.
 *
 * Plain absolutely positioned `div`s over the canvas, like the marquee
 * rectangle. A HUD element is a sprite a unit in front of the lens, and the
 * world-space box the other outlines draw around an entity reads there as a
 * slab in perspective. On screen, the element is a rectangle, and so is its
 * outline.
 */

import type { ViewportRect } from '../entities/screen-anchor';
import { resolveMarqueeHost } from './marquee-overlay';

export interface HudMark {
	rect: ViewportRect;
	/** CSS color of the outline. */
	color: string;
}

export class HudOutline {
	private readonly pool: HTMLDivElement[] = [];
	private host: HTMLElement | null = null;

	/** Draw one outline per mark over `canvas`, hiding the ones left over from the last call. */
	show(canvas: HTMLElement, marks: readonly HudMark[]): void {
		if (marks.length === 0) {
			this.hide();
			return;
		}
		const host = resolveMarqueeHost(canvas);
		if (!host) {
			this.hide();
			return;
		}
		if (host !== this.host) {
			this.removeAll();
			this.host = host;
		}

		// The canvas may sit anywhere inside the host, at any size.
		const hostBox = host.getBoundingClientRect();
		const canvasBox = canvas.getBoundingClientRect();
		const left = canvasBox.left - hostBox.left;
		const top = canvasBox.top - hostBox.top;

		marks.forEach((mark, index) => {
			const style = this.acquire(host, index).style;
			style.left = `${left + mark.rect.left * canvasBox.width}px`;
			style.top = `${top + mark.rect.top * canvasBox.height}px`;
			style.width = `${mark.rect.width * canvasBox.width}px`;
			style.height = `${mark.rect.height * canvasBox.height}px`;
			style.borderColor = mark.color;
			style.display = 'block';
		});
		for (let index = marks.length; index < this.pool.length; index += 1) {
			this.pool[index]!.style.display = 'none';
		}
	}

	hide(): void {
		for (const element of this.pool) element.style.display = 'none';
	}

	dispose(): void {
		this.removeAll();
		this.host = null;
	}

	private removeAll(): void {
		for (const element of this.pool) element.remove();
		this.pool.length = 0;
	}

	private acquire(host: HTMLElement, index: number): HTMLDivElement {
		const existing = this.pool[index];
		if (existing) return existing;

		const element = document.createElement('div');
		element.dataset.zylemHudOutline = 'true';
		const style = element.style;
		style.position = 'absolute';
		style.pointerEvents = 'none';
		style.boxSizing = 'border-box';
		style.border = '1px solid transparent';
		style.display = 'none';
		// Under the marquee rectangle, above the overlay root's other children.
		style.zIndex = '19';

		host.appendChild(element);
		this.pool.push(element);
		return element;
	}
}
