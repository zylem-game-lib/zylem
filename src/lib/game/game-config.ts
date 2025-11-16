import { StageInterface } from "../types";
import { GameInputConfig } from "./game-interfaces";
import { AspectRatio, AspectRatioValue } from "../device/aspect-ratio";
import { getDisplayAspect, getPresetResolution, parseResolution, RetroPresetKey } from "./game-retro-resolutions";

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
	/** lock internal render buffer to this resolution (e.g., '256x240' or { width, height }) */
	resolution: string | { width: number; height: number };
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

export function resolveGameConfig(user?: GameConfigLike): GameConfig {
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

	// Derive aspect ratio: explicit numeric -> preset -> default
	const explicitAspect = user?.aspectRatio as any;
	let aspectRatio = defaults.aspectRatio;
	if (typeof explicitAspect === 'number' || (explicitAspect && typeof explicitAspect === 'string')) {
		aspectRatio = typeof explicitAspect === 'number' ? explicitAspect : (AspectRatio as any)[explicitAspect] ?? defaults.aspectRatio;
	} else if (user?.preset) {
		try {
			aspectRatio = getDisplayAspect(user.preset as RetroPresetKey) || defaults.aspectRatio;
		} catch {
			aspectRatio = defaults.aspectRatio;
		}
	}

	const fullscreen = (user?.fullscreen as boolean) ?? defaults.fullscreen;
	const bodyBackground = (user?.bodyBackground as string) ?? defaults.bodyBackground;

	// Normalize internal resolution lock
	let internalResolution: { width: number; height: number } | undefined;
	if (user?.resolution) {
		if (typeof user.resolution === 'string') {
			const parsed = parseResolution(user.resolution);
			if (parsed) internalResolution = parsed;
			// fallback: allow preset resolution keys like '256x240' under a preset
			if (!internalResolution && user.preset) {
				const res = getPresetResolution(user.preset as RetroPresetKey, user.resolution);
				if (res) internalResolution = { width: res.width, height: res.height };
			}
		} else if (typeof user.resolution === 'object') {
			const w = (user.resolution as any).width;
			const h = (user.resolution as any).height;
			if (Number.isFinite(w) && Number.isFinite(h)) {
				internalResolution = { width: w, height: h };
			}
		}
	}

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