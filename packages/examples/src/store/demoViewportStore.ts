import type { DeviceProfile } from '@zylem/game-lib';
import { createStore } from 'solid-js/store';

export interface ViewportPreset {
	label: string;
	width: number;
	height: number;
}

export interface ViewportDimensions {
	width: number;
	height: number;
}

export type ViewportControlsMode = 'hidden' | 'compact' | 'full';

export interface DemoViewportState {
	viewportProfile: DeviceProfile;
	activePresetLabel: string;
	viewportSize: ViewportDimensions;
	measuredViewportSize: ViewportDimensions;
	browserViewportSize: ViewportDimensions;
	viewportControlsMode: ViewportControlsMode;
}

export const VIEWPORT_PRESETS: ViewportPreset[] = [
	{ label: 'Desktop', width: 1280, height: 720 },
	{ label: 'Laptop', width: 960, height: 540 },
	{ label: 'Tablet', width: 768, height: 1024 },
	{ label: 'Phone', width: 390, height: 844 },
];

export const DEFAULT_VIEWPORT_PRESET = VIEWPORT_PRESETS[0]!;
export const PHONE_VIEWPORT_PRESET =
	VIEWPORT_PRESETS.find((preset) => preset.label === 'Phone') ??
	VIEWPORT_PRESETS[VIEWPORT_PRESETS.length - 1]!;

function getBrowserViewportSize(): ViewportDimensions {
	if (typeof window === 'undefined') {
		return {
			width: DEFAULT_VIEWPORT_PRESET.width,
			height: DEFAULT_VIEWPORT_PRESET.height,
		};
	}

	return {
		width: window.innerWidth,
		height: window.innerHeight,
	};
}

function resolveViewportControlsMode(
	viewportSize: ViewportDimensions,
): ViewportControlsMode {
	const shortestEdge = Math.min(viewportSize.width, viewportSize.height);
	const longestEdge = Math.max(viewportSize.width, viewportSize.height);

	if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
		const userAgent = navigator.userAgent.toLowerCase();
		const isPhoneAgent = /android|iphone|ipod|mobile/i.test(userAgent);
		const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
		const hasCoarsePointer =
			typeof window.matchMedia === 'function'
				? window.matchMedia('(pointer: coarse)').matches
				: false;

		if (
			shortestEdge <= 600 &&
			longestEdge <= 960 &&
			(isPhoneAgent || hasTouch || hasCoarsePointer)
		) {
			return 'hidden';
		}
	}

	if (shortestEdge <= 1024) {
		return 'compact';
	}

	return 'full';
}

const initialBrowserViewportSize = getBrowserViewportSize();

export const [demoViewportStore, setDemoViewportStore] =
	createStore<DemoViewportState>({
		viewportProfile: 'auto',
		activePresetLabel: DEFAULT_VIEWPORT_PRESET.label,
		viewportSize: {
			width: DEFAULT_VIEWPORT_PRESET.width,
			height: DEFAULT_VIEWPORT_PRESET.height,
		},
		measuredViewportSize: {
			width: DEFAULT_VIEWPORT_PRESET.width,
			height: DEFAULT_VIEWPORT_PRESET.height,
		},
		browserViewportSize: initialBrowserViewportSize,
		viewportControlsMode: resolveViewportControlsMode(
			initialBrowserViewportSize,
		),
	});

export const setViewportProfile = (viewportProfile: DeviceProfile) => {
	setDemoViewportStore('viewportProfile', viewportProfile);
};

export const applyViewportPreset = (preset: ViewportPreset) => {
	setDemoViewportStore('activePresetLabel', preset.label);
	setDemoViewportStore('viewportSize', {
		width: preset.width,
		height: preset.height,
	});
};

export const setMeasuredViewportSize = (size: ViewportDimensions) => {
	setDemoViewportStore('measuredViewportSize', size);
};

export const setBrowserViewportSize = (size: ViewportDimensions) => {
	setDemoViewportStore('browserViewportSize', size);
	setDemoViewportStore('viewportControlsMode', resolveViewportControlsMode(size));
};
