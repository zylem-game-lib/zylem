import type { BridgeVec3, LevelDocument } from './protocol';

/** Distances are world units; slope is degrees. Converted to voxels by the baker. */
export interface NavigationSettings {
	agentRadius: number;
	agentHeight: number;
	maxClimb: number;
	maxSlope: number;
	cellSize: number;
	cellHeight: number;
}

export const DEFAULT_NAVIGATION_SETTINGS: Readonly<NavigationSettings> = {
	agentRadius: 0.4,
	agentHeight: 1.8,
	maxClimb: 0.4,
	maxSlope: 45,
	cellSize: 0.2,
	cellHeight: 0.1,
};

export interface NavigationObstacle {
	id: string;
	min: BridgeVec3;
	max: BridgeVec3;
}
/** A traversable connection; the game's movement behavior must perform the jump/climb. */
export interface NavigationLink {
	id: string;
	start: BridgeVec3;
	end: BridgeVec3;
	radius: number;
	bidirectional: boolean;
}

export const NAVIGATION_GENERATOR = 'recast-navigation@0.44.0';
export interface NavigationAsset {
	version: 1;
	generator: typeof NAVIGATION_GENERATOR;
	sourceHash: string;
	/** Base64-encoded Detour binary. JSON-safe for the existing host save contract. */
	data: string;
}

export interface LevelNavigation {
	settings: NavigationSettings;
	excludedSolidIds: string[];
	obstacles: NavigationObstacle[];
	links: NavigationLink[];
	baked?: NavigationAsset;
}

export function createLevelNavigation(): LevelNavigation {
	return {
		settings: { ...DEFAULT_NAVIGATION_SETTINGS },
		excludedSolidIds: [],
		obstacles: [],
		links: [],
	};
}

export type NavigationTool = 'none' | 'path' | 'obstacle' | 'link';
export interface NavigationToolPayload {
	tool: NavigationTool;
	obstacleHeight?: number;
	bidirectional?: boolean;
}
export interface NavigationStatus {
	stageId: string;
	state: 'empty' | 'building' | 'ready' | 'stale' | 'error';
	sourceHash: string;
	message?: string;
	requestId?: string;
}
export interface NavigationPath {
	points: BridgeVec3[];
	status: 'complete' | 'partial' | 'unreachable';
}
export type NavigationEdit =
	| { kind: 'obstacle'; obstacle: NavigationObstacle }
	| { kind: 'link'; link: NavigationLink };

/** Only bake inputs matter. Hiding, selecting, renaming and sector grouping do not. */
export function navigationSourceHash(document: LevelDocument): string {
	const nav = document.navigation ?? createLevelNavigation();
	const excluded = new Set(nav.excludedSolidIds);
	const input = JSON.stringify({
		generator: NAVIGATION_GENERATOR,
		settings: Object.keys(DEFAULT_NAVIGATION_SETTINGS).map(
			(k) => nav.settings[k as keyof NavigationSettings]
		),
		solids: document.solids.filter((s) => !excluded.has(s.id)).map((s) => s.planes),
		obstacles: nav.obstacles.map((o) => [o.min.x, o.min.y, o.min.z, o.max.x, o.max.y, o.max.z]),
		links: nav.links.map((l) => [
			l.start.x,
			l.start.y,
			l.start.z,
			l.end.x,
			l.end.y,
			l.end.z,
			l.radius,
			l.bidirectional,
		]),
	});
	// Two independent 32-bit hashes for cache invalidation, not security/authentication.
	let a = 2166136261;
	let b = 5381;
	for (let i = 0; i < input.length; i++) {
		a = Math.imul(a ^ input.charCodeAt(i), 16777619);
		b = Math.imul(b, 33) ^ input.charCodeAt(i);
	}
	return `${(a >>> 0).toString(16)}-${(b >>> 0).toString(16)}-${input.length}`;
}

export function validateNavigationSettings(settings: NavigationSettings): void {
	for (const key of Object.keys(DEFAULT_NAVIGATION_SETTINGS) as (keyof NavigationSettings)[]) {
		if (!Number.isFinite(settings[key])) throw new Error(`${key} must be finite.`);
	}
	if (
		settings.agentRadius < 0 ||
		settings.agentHeight <= 0 ||
		settings.maxClimb < 0 ||
		settings.maxClimb >= settings.agentHeight ||
		settings.maxSlope < 0 ||
		settings.maxSlope >= 90 ||
		settings.cellSize <= 0 ||
		settings.cellHeight <= 0
	) {
		throw new Error(
			'Use positive cell sizes and agent height, nonnegative radius/climb, climb below height, and slope below 90°.'
		);
	}
}
