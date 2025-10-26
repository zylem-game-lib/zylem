export type RetroResolution = { key: string; width: number; height: number; notes?: string };

export type RetroPreset = {
	displayAspect: number;
	resolutions: RetroResolution[];
};

/**
 * Retro and console display presets.
 * displayAspect represents the intended display aspect (letterboxing target),
 * not necessarily the raw pixel aspect of internal buffers.
 */
export const RetroPresets: Record<string, RetroPreset> = {
	NES: {
		displayAspect: 4 / 3,
		resolutions: [
			{ key: '256x240', width: 256, height: 240, notes: 'Standard NTSC; effective 240p.' },
		],
	},
	SNES: {
		displayAspect: 4 / 3,
		resolutions: [
			{ key: '256x224', width: 256, height: 224, notes: 'Common 240p-equivalent mode.' },
			{ key: '512x448', width: 512, height: 448, notes: 'Hi-res interlaced (480i).' },
		],
	},
	N64: {
		displayAspect: 4 / 3,
		resolutions: [
			{ key: '320x240', width: 320, height: 240, notes: 'Common 240p mode.' },
			{ key: '640x480', width: 640, height: 480, notes: 'Higher resolution (480i).' },
		],
	},
	PS1: {
		displayAspect: 4 / 3,
		resolutions: [
			{ key: '320x240', width: 320, height: 240, notes: 'Progressive 240p common.' },
			{ key: '640x480', width: 640, height: 480, notes: 'Interlaced 480i for higher detail.' },
		],
	},
	PS2: {
		displayAspect: 4 / 3,
		resolutions: [
			{ key: '640x480', width: 640, height: 480, notes: '480i/480p baseline.' },
			{ key: '720x480', width: 720, height: 480, notes: '480p (widescreen capable in some titles).' },
			{ key: '1280x720', width: 1280, height: 720, notes: '720p (select titles).' },
		],
	},
	PS5: {
		displayAspect: 16 / 9,
		resolutions: [
			{ key: '720x480', width: 720, height: 480, notes: 'Legacy compatibility.' },
			{ key: '1280x720', width: 1280, height: 720, notes: '720p.' },
			{ key: '1920x1080', width: 1920, height: 1080, notes: '1080p.' },
			{ key: '2560x1440', width: 2560, height: 1440, notes: '1440p.' },
			{ key: '3840x2160', width: 3840, height: 2160, notes: '4K (up to 120Hz).' },
			{ key: '7680x4320', width: 7680, height: 4320, notes: '8K (limited).' },
		],
	},
	XboxOne: {
		displayAspect: 16 / 9,
		resolutions: [
			{ key: '1280x720', width: 1280, height: 720, notes: '720p (original).' },
			{ key: '1920x1080', width: 1920, height: 1080, notes: '1080p (original).' },
			{ key: '3840x2160', width: 3840, height: 2160, notes: '4K UHD (S/X models).' },
		],
	},
};

export type RetroPresetKey = keyof typeof RetroPresets;

export function getDisplayAspect(preset: RetroPresetKey): number {
	return RetroPresets[preset].displayAspect;
}

export function getPresetResolution(preset: RetroPresetKey, key?: string): RetroResolution | undefined {
	const list = RetroPresets[preset]?.resolutions || [];
	if (!key) return list[0];
	const normalized = key.toLowerCase().replace(/\s+/g, '').replace('×', 'x');
	return list.find(r => r.key.toLowerCase() === normalized);
}

export function parseResolution(text: string): { width: number; height: number } | null {
	if (!text) return null;
	const normalized = String(text).toLowerCase().trim().replace(/\s+/g, '').replace('×', 'x');
	const match = normalized.match(/^(\d+)x(\d+)$/);
	if (!match) return null;
	const width = parseInt(match[1], 10);
	const height = parseInt(match[2], 10);
	if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
	return { width, height };
}


