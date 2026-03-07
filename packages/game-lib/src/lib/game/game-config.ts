import { StageInterface } from "../types";
import { GameInputConfig } from "./game-interfaces";
import { AspectRatio, AspectRatioValue } from "../device/aspect-ratio";
import { isMobile, type ViewportSize } from "../device/mobile";
import { getDisplayAspect, getPresetResolution, parseResolution, RetroPresetKey } from "./game-retro-resolutions";

export type ResolutionInput = string | { width: number; height: number };
export type DeviceProfile = 'auto' | 'desktop' | 'mobile';

export interface ResolveGameConfigRuntime {
	deviceProfile?: DeviceProfile;
	viewportSize?: ViewportSize;
}

export type GameDeviceConfig = Partial<{
	/** numeric value or key in AspectRatio */
	aspectRatio: AspectRatioValue | keyof typeof AspectRatio;
	/** console/display preset to derive aspect ratio */
	preset: RetroPresetKey;
	/** lock internal render buffer for this device profile */
	resolution: ResolutionInput;
}>;

export type GameConfigLike = Partial<{
	id: string;
	globals: Record<string, any>;
	stages: StageInterface[];
	debug: boolean;
	time: number;
	input: GameInputConfig;
	/** numeric value or key in AspectRatio */
	aspectRatio: AspectRatioValue | keyof typeof AspectRatio;
	/** console/display preset to derive aspect ratio */
	preset: RetroPresetKey;
	/** lock internal render buffer to this desktop/default resolution */
	resolution: ResolutionInput;
	/** mobile-specific aspect/preset/resolution overrides */
	mobile: GameDeviceConfig;
	fullscreen: boolean;
	/** CSS background value for document body */
	bodyBackground: string;
	/** existing container by reference */
	container: HTMLElement;
	/** create/find container by id */
	containerId: string;
	/** optional canvas if caller wants to manage it */
	canvas: HTMLCanvasElement;
}>;

export class GameConfig {
	constructor(
		public id: string,
		public globals: Record<string, any>,
		public stages: StageInterface[],
		public debug: boolean,
		public time: number,
		public input: GameInputConfig | undefined,
		public aspectRatio: number,
		public internalResolution: { width: number; height: number } | undefined,
		public fullscreen: boolean,
		public bodyBackground: string | undefined,
		public container: HTMLElement,
		public containerId?: string,
		public canvas?: HTMLCanvasElement,
	) { }
}

function usesMobileProfile(runtime: ResolveGameConfigRuntime = {}): boolean {
	if (runtime.deviceProfile === 'mobile') {
		return true;
	}

	if (runtime.deviceProfile === 'desktop') {
		return false;
	}

	if (runtime.viewportSize) {
		return isMobile({
			viewportSize: runtime.viewportSize,
			allowViewportOnly: true,
		});
	}

	return isMobile();
}

function ensureContainer(containerId?: string, existing?: HTMLElement | null): HTMLElement {
	if (existing) return existing;
	if (containerId) {
		const found = document.getElementById(containerId);
		if (found) return found;
	}
	const id = containerId || 'zylem-root';
	const el = document.createElement('main');
	el.setAttribute('id', id);
	el.style.position = 'relative';
	el.style.width = '100%';
	el.style.height = '100%';
	document.body.appendChild(el);
	return el;
}

function createDefaultGameConfig(base?: Partial<Pick<GameConfig, 'id' | 'debug' | 'time' | 'input'>> & { stages?: StageInterface[]; globals?: Record<string, any> }): GameConfig {
	const id = base?.id ?? 'zylem';
	const container = ensureContainer(id);
	return new GameConfig(
		id,
		(base?.globals ?? {}) as Record<string, any>,
		(base?.stages ?? []) as StageInterface[],
		Boolean(base?.debug),
		base?.time ?? 0,
		base?.input,
		AspectRatio.SixteenByNine,
		undefined,
		true,
		'#000000',
		container,
		id,
		undefined,
	);
}

const DEFAULT_MOBILE_BASE_EDGE = 360;

function normalizeResolutionInput(
	input?: ResolutionInput,
	preset?: RetroPresetKey,
): { width: number; height: number } | undefined {
	if (!input) return undefined;

	if (typeof input === 'string') {
		const parsed = parseResolution(input);
		if (parsed) return parsed;

		if (preset) {
			const res = getPresetResolution(preset, input);
			if (res) {
				return { width: res.width, height: res.height };
			}
		}

		return undefined;
	}

	const width = (input as any).width;
	const height = (input as any).height;
	if (Number.isFinite(width) && Number.isFinite(height)) {
		return { width, height };
	}

	return undefined;
}

function resolveAspectRatioValue(
	aspectInput: GameDeviceConfig['aspectRatio'],
	preset: RetroPresetKey | undefined,
	fallbackAspect: number,
	fallbackResolution?: { width: number; height: number },
): number {
	if (typeof aspectInput === 'number') {
		return aspectInput;
	}

	if (typeof aspectInput === 'string') {
		return (AspectRatio as any)[aspectInput] ?? fallbackAspect;
	}

	if (preset) {
		try {
			return getDisplayAspect(preset) || fallbackAspect;
		} catch {
			return fallbackAspect;
		}
	}

	if (fallbackResolution) {
		return fallbackResolution.width / fallbackResolution.height;
	}

	return fallbackAspect;
}

function createDefaultMobileResolution(aspectRatio: number): { width: number; height: number } {
	const safeAspect = Number.isFinite(aspectRatio) && aspectRatio > 0
		? aspectRatio
		: AspectRatio.SixteenByNine;

	if (safeAspect >= 1) {
		const height = DEFAULT_MOBILE_BASE_EDGE;
		const width = Math.round(height * safeAspect);
		return { width, height };
	}

	const width = DEFAULT_MOBILE_BASE_EDGE;
	const height = Math.round(width / safeAspect);
	return { width, height };
}

export function resolveGameConfig(
	user?: GameConfigLike,
	runtime: ResolveGameConfigRuntime = {},
): GameConfig {
	const defaults = createDefaultGameConfig({
		id: user?.id ?? 'zylem',
		debug: Boolean(user?.debug),
		time: (user?.time as number) ?? 0,
		input: user?.input,
		stages: (user?.stages as StageInterface[]) ?? [],
		globals: (user?.globals as Record<string, any>) ?? {},
	});

	// Resolve container
	const containerId = (user?.containerId as string) ?? defaults.containerId;
	const container = ensureContainer(containerId, user?.container ?? null);
	const mobileConfig = user?.mobile;
	const useMobileProfile = usesMobileProfile(runtime);
	const activePreset = useMobileProfile
		? mobileConfig?.preset ?? user?.preset
		: user?.preset;
	const desktopResolution = normalizeResolutionInput(user?.resolution, user?.preset);
	const mobileResolution = normalizeResolutionInput(
		mobileConfig?.resolution,
		mobileConfig?.preset ?? user?.preset,
	);
	const aspectFallbackResolution = useMobileProfile
		? mobileResolution ?? desktopResolution
		: desktopResolution;
	const activeAspectInput = useMobileProfile
		? mobileConfig?.aspectRatio ?? user?.aspectRatio
		: user?.aspectRatio;
	const aspectRatio = resolveAspectRatioValue(
		activeAspectInput,
		activePreset,
		defaults.aspectRatio,
		aspectFallbackResolution,
	);
	const internalResolution = useMobileProfile
		? mobileResolution ?? createDefaultMobileResolution(aspectRatio)
		: desktopResolution;

	const fullscreen = (user?.fullscreen as boolean) ?? defaults.fullscreen;
	const bodyBackground = (user?.bodyBackground as string) ?? defaults.bodyBackground;

	// Prefer provided canvas if any
	const canvas = user?.canvas ?? undefined;

	return new GameConfig(
		(user?.id as string) ?? defaults.id,
		(user?.globals as Record<string, any>) ?? defaults.globals,
		(user?.stages as StageInterface[]) ?? defaults.stages,
		Boolean(user?.debug ?? defaults.debug),
		(user?.time as number) ?? defaults.time,
		user?.input ?? defaults.input,
		aspectRatio,
		internalResolution,
		fullscreen,
		bodyBackground,
		container,
		containerId,
		canvas,
	);
}

/**
 * Factory for authoring configuration objects in user code.
 * Returns a plain object that can be passed to `game(...)`.
 */
export function gameConfig(config: GameConfigLike): GameConfigLike {
	return { ...config };
}
