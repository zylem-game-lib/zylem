export const SCREENSHOT_MODE_SEARCH_PARAM = 'screenshot';

export const isScreenshotModeSearch = (search: string) => {
	return new URLSearchParams(search).has(SCREENSHOT_MODE_SEARCH_PARAM);
};
