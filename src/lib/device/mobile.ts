
export function isMobile() {
	const userAgent = navigator.userAgent;
	const isMobileAgent = /android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent);
	const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
	return isMobileAgent || isTouch;
}