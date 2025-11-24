export const AspectRatio = {
	FourByThree: 4 / 3,
	SixteenByNine: 16 / 9,
	TwentyOneByNine: 21 / 9,
	OneByOne: 1 / 1,
} as const;

export type AspectRatioValue = (typeof AspectRatio)[keyof typeof AspectRatio] | number;

/**
 * AspectRatioDelegate manages sizing a canvas to fit within a container
 * while preserving a target aspect ratio. It notifies a consumer via
 * onResize when the final width/height are applied so renderers/cameras
 * can update their viewports.
 */
export class AspectRatioDelegate {
	container: HTMLElement;
	canvas: HTMLCanvasElement;
	aspectRatio: number;
	onResize?: (width: number, height: number) => void;
	private handleResizeBound: () => void;

	constructor(params: {
		container: HTMLElement;
		canvas: HTMLCanvasElement;
		aspectRatio: AspectRatioValue;
		onResize?: (width: number, height: number) => void;
	}) {
		this.container = params.container;
		this.canvas = params.canvas;
		this.aspectRatio = typeof params.aspectRatio === 'number' ? params.aspectRatio : params.aspectRatio;
		this.onResize = params.onResize;
		this.handleResizeBound = this.apply.bind(this);
	}

	/** Attach window resize listener and apply once. */
	attach() {
		window.addEventListener('resize', this.handleResizeBound);
		this.apply();
	}

	/** Detach window resize listener. */
	detach() {
		window.removeEventListener('resize', this.handleResizeBound);
	}

	/** Compute the largest size that fits container while preserving aspect. */
	measure(): { width: number; height: number } {
		const containerWidth = this.container.clientWidth || window.innerWidth;
		const containerHeight = this.container.clientHeight || window.innerHeight;

		const containerRatio = containerWidth / containerHeight;
		if (containerRatio > this.aspectRatio) {
			// container is wider than target; limit by height
			const height = containerHeight;
			const width = Math.round(height * this.aspectRatio);
			return { width, height };
		} else {
			// container is taller/narrower; limit by width
			const width = containerWidth;
			const height = Math.round(width / this.aspectRatio);
			return { width, height };
		}
	}

	/** Apply measured size to canvas and notify. */
	apply() {
		const { width, height } = this.measure();
		// Apply CSS size; renderer will update internal size via onResize callback
		this.canvas.style.width = `${width}px`;
		this.canvas.style.height = `${height}px`;
		this.onResize?.(width, height);
	}
}