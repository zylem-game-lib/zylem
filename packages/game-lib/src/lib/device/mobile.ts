export interface ViewportSize {
	width: number;
	height: number;
}

export interface MobileDetectionOptions {
	viewportSize?: ViewportSize;
	allowViewportOnly?: boolean;
}

export function isMobile(options: MobileDetectionOptions = {}) {
	if (typeof window === 'undefined' || typeof navigator === 'undefined') {
		return false;
	}

	const userAgent = navigator.userAgent;
	const isMobileAgent = /android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent);
	const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
	const isCoarsePointer = typeof window.matchMedia === 'function'
		? window.matchMedia('(pointer: coarse)').matches
		: false;
	const viewportWidth = options.viewportSize?.width ?? window.innerWidth ?? 0;
	const viewportHeight = options.viewportSize?.height ?? window.innerHeight ?? 0;
	const largestViewportEdge = Math.max(viewportWidth, viewportHeight);
	const isSmallViewport = largestViewportEdge === 0 || largestViewportEdge <= 1024;

	if (options.allowViewportOnly && options.viewportSize) {
		return isSmallViewport;
	}

	return isMobileAgent || ((isTouch || isCoarsePointer) && isSmallViewport);
}
