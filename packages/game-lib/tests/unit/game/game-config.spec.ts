import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AspectRatio } from '../../../src/lib/device/aspect-ratio';
import * as mobile from '../../../src/lib/device/mobile';
import { resolveGameConfig } from '../../../src/lib/game/game-config';
import { getDisplayAspect, getPresetResolution } from '../../../src/lib/game/game-retro-resolutions';

describe('resolveGameConfig', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('derives aspect ratio from internal resolution when no aspect ratio or preset is provided', () => {
		const config = resolveGameConfig({
			id: 'portrait-demo',
			resolution: { width: 720, height: 1280 },
		});

		expect(config.internalResolution).toEqual({ width: 720, height: 1280 });
		expect(config.aspectRatio).toBe(720 / 1280);
	});

	it('keeps explicit aspect ratio over the internal resolution ratio', () => {
		const config = resolveGameConfig({
			id: 'portrait-demo',
			aspectRatio: 'NineBySixteen',
			resolution: { width: 800, height: 600 },
		});

		expect(config.internalResolution).toEqual({ width: 800, height: 600 });
		expect(config.aspectRatio).toBe(AspectRatio.NineBySixteen);
	});

	it('keeps preset display aspect ratio over the raw internal buffer ratio', () => {
		const config = resolveGameConfig({
			id: 'nes-demo',
			preset: 'NES',
			resolution: '256x240',
		});

		expect(config.internalResolution).toEqual({ width: 256, height: 240 });
		expect(config.aspectRatio).toBe(AspectRatio.FourByThree);
	});

	it('uses a smaller mobile resolution by default while preserving the desktop aspect ratio', () => {
		vi.spyOn(mobile, 'isMobile').mockReturnValue(true);

		const config = resolveGameConfig({
			id: 'mobile-demo',
			resolution: { width: 800, height: 600 },
		});

		expect(config.aspectRatio).toBe(4 / 3);
		expect(config.internalResolution).toEqual({ width: 480, height: 360 });
	});

	it('uses developer-provided mobile overrides when present', () => {
		vi.spyOn(mobile, 'isMobile').mockReturnValue(true);

		const config = resolveGameConfig({
			id: 'mobile-demo',
			resolution: { width: 800, height: 600 },
			mobile: {
				aspectRatio: 'NineBySixteen',
				resolution: { width: 360, height: 640 },
			},
		});

		expect(config.aspectRatio).toBe(AspectRatio.NineBySixteen);
		expect(config.internalResolution).toEqual({ width: 360, height: 640 });
	});

	it('supports a mobile preset override for portrait layouts', () => {
		vi.spyOn(mobile, 'isMobile').mockReturnValue(true);

		const config = resolveGameConfig({
			id: 'mobile-preset-demo',
			preset: 'NES',
			resolution: '256x240',
			mobile: {
				preset: 'MobilePortrait',
			},
		});

		expect(config.aspectRatio).toBe(AspectRatio.NineBySixteen);
		expect(config.internalResolution).toEqual({ width: 360, height: 640 });
	});

	it('supports forcing the desktop profile at runtime', () => {
		vi.spyOn(mobile, 'isMobile').mockReturnValue(true);

		const config = resolveGameConfig({
			id: 'forced-desktop-demo',
			resolution: { width: 800, height: 600 },
			mobile: {
				resolution: { width: 360, height: 640 },
			},
		}, {
			deviceProfile: 'desktop',
		});

		expect(config.aspectRatio).toBe(4 / 3);
		expect(config.internalResolution).toEqual({ width: 800, height: 600 });
	});

	it('uses viewport-size auto detection when runtime dimensions are provided', () => {
		const config = resolveGameConfig({
			id: 'simulated-mobile-demo',
			resolution: { width: 800, height: 600 },
			mobile: {
				aspectRatio: 'NineBySixteen',
				resolution: { width: 360, height: 640 },
			},
		}, {
			deviceProfile: 'auto',
			viewportSize: { width: 390, height: 844 },
		});

		expect(config.aspectRatio).toBe(AspectRatio.NineBySixteen);
		expect(config.internalResolution).toEqual({ width: 360, height: 640 });
	});
});

describe('mobile portrait preset', () => {
	it('exposes a portrait display aspect and portrait resolutions', () => {
		expect(getDisplayAspect('MobilePortrait')).toBe(AspectRatio.NineBySixteen);
		expect(getPresetResolution('MobilePortrait', '720x1280')).toEqual({
			key: '720x1280',
			width: 720,
			height: 1280,
			notes: 'HD phone portrait.',
		});
	});
});
