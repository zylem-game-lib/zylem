/**
 * perf-logger
 *
 * Demo-only performance instrumentation for `@zylem/examples`. Provides a
 * single-line opt-in (`attachPerfLogger(game)`) that periodically prints
 * frame stats + Three.js `renderer.info` counters to the console, and a
 * one-shot `dumpPerfSnapshot(game)` helper for ad-hoc inspection from
 * DevTools.
 *
 * This intentionally lives in `packages/examples` (not `@zylem/game-lib`)
 * because it reads private/internal fields of the engine wrapper to avoid
 * forcing public-API churn:
 *
 *   - `me.rendererManager` on `ZylemGame` (engine wrapper exposed as `me`
 *     in game-level `onUpdate` callbacks)
 *   - `me.currentStage().wrappedStage.scene` for verbose scene walks
 *   - `(game as any).wrappedGame` for the one-shot snapshot path
 *
 * Pairs with the stats.js CPU/GPU/MEM panel that `@zylem/game-lib` mounts
 * when a game is created with `debug: true` — this logger adds the things
 * stats.js doesn't surface (draw calls, triangles, textures, programs,
 * device pixel ratio, shadow-map state, render passes per frame).
 *
 * IMPORTANT: `renderer.info.render.*` is reset at the start of every
 * `renderer.render()` invocation when `info.autoReset` is `true` (the
 * default). The engine renders multiple times per frame (RTT cameras,
 * EffectComposer passes, multi-camera viewports), so reading those
 * counters from a `setInterval` would only ever observe the LAST
 * render-pass of the frame (typically a single fullscreen copy). This
 * logger disables `info.autoReset` once it captures the renderer and
 * accumulates the totals across every render pass each frame, snapshotting
 * + resetting in the per-frame `onUpdate` hook so the reported values
 * reflect the full per-frame draw cost.
 */

import type { Game } from '@zylem/game-lib/core';
import { debugState } from '@zylem/game-lib/debug';
import {
	InstancedMesh,
	Light,
	Mesh,
	Points,
	type Scene,
	Sprite,
} from 'three';

export interface PerfLoggerOptions {
	/** Sample window in milliseconds (default 1000). */
	intervalMs?: number;
	/** Prefix for log lines (default 'perf'). */
	label?: string;
	/**
	 * When true, also walks the scene graph each sample to count
	 * meshes / instanced meshes / lights / shadow casters / unique
	 * materials. Slightly more expensive than the default sample.
	 */
	verbose?: boolean;
}

interface RuntimeRefs {
	renderer: any | null;
	canvas: HTMLCanvasElement | null;
	scene: Scene | null;
}

interface FrameAccumulator {
	frames: number; // onUpdate ticks captured this window
	calls: number;
	triangles: number;
	lines: number;
	points: number;
	renderPasses: number; // total renderer.render() calls in the window
	maxCalls: number;
	maxTriangles: number;
	maxPasses: number;
	maxPrograms: number;
	maxGeometries: number;
	maxTextures: number;
	lastFrameId: number;
}

const newAccumulator = (): FrameAccumulator => ({
	frames: 0,
	calls: 0,
	triangles: 0,
	lines: 0,
	points: 0,
	renderPasses: 0,
	maxCalls: 0,
	maxTriangles: 0,
	maxPasses: 0,
	maxPrograms: 0,
	maxGeometries: 0,
	maxTextures: 0,
	lastFrameId: -1,
});

/**
 * Attach a throttled perf logger to a Zylem `Game`. Returns an unsubscribe
 * function. Also auto-unsubscribes when the game is destroyed (e.g. when
 * `DemoViewer` switches demos), so it is safe to call once per demo factory.
 *
 * @example
 * ```ts
 * const game = createGame({...}, stage);
 * attachPerfLogger(game);
 * // attachPerfLogger(game, { intervalMs: 500, verbose: true });
 * return game;
 * ```
 */
export function attachPerfLogger(
	game: Game<any>,
	options: PerfLoggerOptions = {},
): () => void {
	const intervalMs = options.intervalMs ?? 1000;
	const label = options.label ?? 'perf';
	const verbose = options.verbose ?? false;

	let frames = 0;
	let disposed = false;
	let autoResetDisabled = false;
	let acc = newAccumulator();
	const refs: RuntimeRefs = { renderer: null, canvas: null, scene: null };

	game.onUpdate((ctx: any) => {
		if (disposed) return;
		frames++;
		const me = ctx?.me;
		if (!refs.renderer) {
			refs.renderer = me?.rendererManager?.renderer ?? null;
			refs.canvas = refs.renderer?.domElement ?? null;
		}
		if (!refs.scene) {
			refs.scene = resolveScene(me);
		}
		captureFrame(refs.renderer, acc, () => {
			autoResetDisabled = true;
		}, autoResetDisabled);
	});

	const tick = setInterval(() => {
		if (disposed) return;
		const fps = (frames * 1000) / intervalMs;
		frames = 0;
		const row = collectRow(refs, fps, verbose, acc);
		acc = newAccumulator();
		acc.lastFrameId = (refs.renderer?.info?.render?.frame as number) ?? -1;
		console.groupCollapsed(
			`[${label}] ${typeof row.fps === 'number' ? row.fps.toFixed(1) : row.fps} fps  ` +
				`draws=${row.drawCalls}  tris=${row.triangles}  passes=${row.renderPasses}`,
		);
		console.table(row);
		console.groupEnd();
	}, intervalMs);

	const unsub = () => {
		if (disposed) return;
		disposed = true;
		clearInterval(tick);
	};

	game.onDestroy(() => unsub());

	return unsub;
}

/**
 * Print a single perf snapshot for `game` immediately. Useful from the
 * DevTools console when you want a one-off readout without leaving the
 * logger running.
 *
 * NOTE: When `attachPerfLogger` is NOT also active, the `drawCalls` and
 * `triangles` fields here reflect only the most-recent `renderer.render()`
 * pass (because Three's default `info.autoReset = true` clears them at the
 * start of every render). Prefer running `attachPerfLogger` for accurate
 * per-frame totals.
 */
export function dumpPerfSnapshot(game: Game<any>): void {
	const wrapped = (game as any)?.wrappedGame;
	const renderer = wrapped?.rendererManager?.renderer ?? null;
	const refs: RuntimeRefs = {
		renderer,
		canvas: renderer?.domElement ?? null,
		scene: resolveScene(wrapped),
	};
	console.table(collectRow(refs, Number.NaN, true));
}

export interface TopMeshesOptions {
	/** Max rows to print (default 20). */
	limit?: number;
	/**
	 * Ranking key:
	 *  - 'effectiveTris' (default): tris × instances × (castShadow ? 2 : 1).
	 *    Closest proxy for "how much geometry work this mesh adds per frame".
	 *  - 'tris': raw geometry triangle count, ignoring instancing and shadows.
	 *  - 'instances': sort by InstancedMesh.count (useful to spot instance bombs).
	 *  - 'name': alphabetical.
	 */
	sortBy?: 'effectiveTris' | 'tris' | 'instances' | 'name';
	/** Include invisible meshes (`visible === false`) in the walk. Default false. */
	includeInvisible?: boolean;
	/**
	 * Include `Sprite`s (each renders as 2 tris) and `Points` (each point as
	 * a vertex). Off by default since they almost never dominate geometry
	 * cost — turn on if you suspect a particle/sprite explosion.
	 */
	includeSpritesAndPoints?: boolean;
}

export interface MeshStat {
	name: string;
	type: string;
	tris: number;
	instances: number;
	effectiveTris: number;
	castShadow: boolean;
	receiveShadow: boolean;
	visible: boolean;
	frustumCulled: boolean;
	material: string;
	geometryUuid: string;
}

/**
 * Walk the active stage's scene graph and print the top-N highest-cost
 * meshes, sorted by `sortBy` (default: `effectiveTris`, which folds in
 * `InstancedMesh.count` and the cost-doubling effect of `castShadow`).
 *
 * Returns the full sorted list (not just the printed top-N) so it can be
 * inspected programmatically from the DevTools console:
 *
 * ```js
 * // From DevTools, with the demo running:
 * const game = document.querySelector('zylem-game').game;
 * const all = await import('/src/debug/perf-logger.ts').then(m => m.dumpTopMeshes(game));
 * all.filter(m => m.castShadow);
 * ```
 *
 * Pairs with `attachPerfLogger` — once `attachPerfLogger` confirms you're
 * geometry-bound (high `triangles`), `dumpTopMeshes` tells you which
 * specific meshes to pre-decimate / disable shadows on / convert to
 * `InstancedMesh`.
 */
export function dumpTopMeshes(
	game: Game<any>,
	options: TopMeshesOptions = {},
): MeshStat[] {
	const limit = Math.max(1, options.limit ?? 20);
	const sortBy = options.sortBy ?? 'effectiveTris';
	const includeInvisible = options.includeInvisible ?? false;
	const includeSpritesAndPoints = options.includeSpritesAndPoints ?? false;

	const wrapped = (game as any)?.wrappedGame;
	const scene = resolveScene(wrapped);
	if (!scene) {
		console.warn('[perf] dumpTopMeshes: no active scene; is the game running?');
		return [];
	}

	const stats: MeshStat[] = [];
	scene.traverse((obj) => {
		const isInstanced = obj instanceof InstancedMesh;
		const isMesh = (obj as any).isMesh === true || obj instanceof Mesh;
		const isSprite = obj instanceof Sprite;
		const isPoints = obj instanceof Points;
		if (!isMesh && !(includeSpritesAndPoints && (isSprite || isPoints))) {
			return;
		}
		if (!includeInvisible && !isEffectivelyVisible(obj)) return;

		const geom = (obj as any).geometry;
		const tris = countTriangles(obj, geom);
		const instances = isInstanced ? (obj as InstancedMesh).count : 1;
		const castShadow = Boolean((obj as any).castShadow);
		const effectiveTris = tris * instances * (castShadow ? 2 : 1);

		stats.push({
			name: resolveMeshName(obj),
			type: obj.type ?? obj.constructor?.name ?? 'Object3D',
			tris,
			instances,
			effectiveTris,
			castShadow,
			receiveShadow: Boolean((obj as any).receiveShadow),
			visible: Boolean((obj as any).visible),
			frustumCulled: Boolean((obj as any).frustumCulled),
			material: describeMaterial((obj as any).material),
			geometryUuid: geom?.uuid ?? '(none)',
		});
	});

	const sorted = sortMeshStats(stats, sortBy);
	const topN = sorted.slice(0, limit);
	const totalTris = sorted.reduce((sum, s) => sum + s.effectiveTris, 0);
	const top10Pct = topN
		.slice(0, 10)
		.reduce((sum, s) => sum + s.effectiveTris, 0);
	console.groupCollapsed(
		`[perf] top ${topN.length}/${sorted.length} meshes  ` +
			`totalEffectiveTris=${totalTris.toLocaleString()}  ` +
			`top10=${totalTris > 0 ? ((top10Pct / totalTris) * 100).toFixed(1) : '0'}%`,
	);
	console.table(topN);
	console.groupEnd();

	return sorted;
}

function sortMeshStats(stats: MeshStat[], sortBy: NonNullable<TopMeshesOptions['sortBy']>): MeshStat[] {
	const sorted = [...stats];
	switch (sortBy) {
		case 'name':
			sorted.sort((a, b) => a.name.localeCompare(b.name));
			break;
		case 'instances':
			sorted.sort((a, b) => b.instances - a.instances);
			break;
		case 'tris':
			sorted.sort((a, b) => b.tris - a.tris);
			break;
		case 'effectiveTris':
		default:
			sorted.sort((a, b) => b.effectiveTris - a.effectiveTris);
			break;
	}
	return sorted;
}

/**
 * GLB / FBX imports often leave `mesh.name` empty OR set it to a generic
 * geometry-index placeholder (`geometry_0`, `mesh_3`, `primitive_1`), which
 * tells us nothing about WHICH source asset is contributing the triangles.
 * Walk up the parent chain to find a meaningful ancestor name and combine
 * it with the local name so the table is actually diagnostic.
 *
 * Returns shapes like:
 *   - 'PlayerCharacter > geometry_0'  (helpful ancestor, generic leaf)
 *   - 'crate_red'                     (mesh name is already meaningful)
 *   - '(unnamed Mesh)'                (no ancestor name found in 8 levels)
 */
function resolveMeshName(obj: any): string {
	const leafName = (obj?.name ?? '').trim();
	const leafIsGeneric = !leafName || isGenericName(leafName);

	if (!leafIsGeneric) return leafName;

	let cur = obj?.parent;
	for (let depth = 0; depth < 8 && cur; depth++) {
		const name = (cur.name ?? '').trim();
		if (name && !isGenericName(name)) {
			return leafName ? `${name} > ${leafName}` : `${name}/${obj.type ?? 'Mesh'}`;
		}
		cur = cur.parent;
	}
	return leafName || `(unnamed ${obj.type ?? 'Mesh'})`;
}

const GENERIC_NAME_RE = /^(?:geometry|mesh|primitive|node|object|group|scene)_?\d*$/i;
function isGenericName(name: string): boolean {
	return GENERIC_NAME_RE.test(name) || name === 'Object3D' || name === 'Group';
}

function describeMaterial(material: any): string {
	if (!material) return '(none)';
	if (Array.isArray(material)) {
		return material.map((m: any) => m?.type ?? 'Material').join(',');
	}
	const t = material.type ?? 'Material';
	const name = (material.name ?? '').trim();
	return name ? `${t}(${name})` : t;
}

function isEffectivelyVisible(obj: any): boolean {
	let cur = obj;
	while (cur) {
		if (cur.visible === false) return false;
		cur = cur.parent;
	}
	return true;
}

/**
 * Approximate triangle count for a `BufferGeometry`. Handles indexed and
 * non-indexed geometry; Sprites/Points have no triangles so callers should
 * only invoke this for mesh-like objects.
 */
function countTriangles(obj: any, geom: any): number {
	if (!geom) {
		if (obj instanceof Sprite) return 2;
		if (obj instanceof Points) return 0;
		return 0;
	}
	const index = geom.index;
	if (index?.count) return Math.floor(index.count / 3);
	const pos = geom.attributes?.position;
	if (pos?.count) return Math.floor(pos.count / 3);
	return 0;
}

/**
 * Snapshot + reset `renderer.info.render` for the previous frame and fold
 * the totals into `acc`. Also disables `autoReset` on first capture so the
 * counters accumulate across every render pass in a frame rather than
 * being clobbered by the next render() call.
 */
function captureFrame(
	renderer: any,
	acc: FrameAccumulator,
	onDisabledAutoReset: () => void,
	autoResetAlreadyDisabled: boolean,
): void {
	const info = renderer?.info;
	if (!info) return;

	if (!autoResetAlreadyDisabled && info.autoReset !== false) {
		info.autoReset = false;
		onDisabledAutoReset();
		// First capture sees a half-baked counter from when autoReset was
		// still on; skip accumulation this tick and start clean next frame.
		info.reset?.();
		acc.lastFrameId = info.render?.frame ?? -1;
		return;
	}

	const render = info.render;
	if (!render) return;

	const calls = render.calls ?? 0;
	const triangles = render.triangles ?? 0;
	const lines = render.lines ?? 0;
	const points = render.points ?? 0;
	const frameId = (render.frame as number) ?? acc.lastFrameId;

	acc.frames++;
	acc.calls += calls;
	acc.triangles += triangles;
	acc.lines += lines;
	acc.points += points;
	if (calls > acc.maxCalls) acc.maxCalls = calls;
	if (triangles > acc.maxTriangles) acc.maxTriangles = triangles;

	if (acc.lastFrameId >= 0 && frameId > acc.lastFrameId) {
		const passes = frameId - acc.lastFrameId;
		acc.renderPasses += passes;
		if (passes > acc.maxPasses) acc.maxPasses = passes;
	}
	acc.lastFrameId = frameId;

	const programs = info.programs?.length ?? 0;
	if (programs > acc.maxPrograms) acc.maxPrograms = programs;
	const geometries = info.memory?.geometries ?? 0;
	if (geometries > acc.maxGeometries) acc.maxGeometries = geometries;
	const textures = info.memory?.textures ?? 0;
	if (textures > acc.maxTextures) acc.maxTextures = textures;

	info.reset?.();
}

/**
 * The active stage exposes `scene: ZylemScene`, which wraps the underlying
 * `THREE.Scene` on `.scene`. Older / alternate paths may already hand us
 * the Three.js scene directly, so detect either shape.
 */
function resolveScene(engine: any): Scene | null {
	const stageScene = engine?.currentStage?.()?.wrappedStage?.scene;
	if (!stageScene) return null;
	if (typeof stageScene.traverse === 'function') return stageScene as Scene;
	const inner = stageScene.scene;
	if (inner && typeof inner.traverse === 'function') return inner as Scene;
	return null;
}

function collectRow(
	refs: RuntimeRefs,
	fps: number,
	verbose: boolean,
	acc?: FrameAccumulator,
): Record<string, unknown> {
	const r = refs.renderer;
	const c = refs.canvas;

	const fpsValue = Number.isFinite(fps) ? Number(fps.toFixed(1)) : 'n/a';
	const avgFrameMs =
		Number.isFinite(fps) && fps > 0 ? Number((1000 / fps).toFixed(2)) : 'n/a';

	const hasAcc = acc && acc.frames > 0;
	const avgCalls = hasAcc ? Math.round(acc!.calls / acc!.frames) : (r?.info?.render?.calls ?? 'n/a');
	const avgTris = hasAcc ? Math.round(acc!.triangles / acc!.frames) : (r?.info?.render?.triangles ?? 'n/a');
	const avgLines = hasAcc ? Math.round(acc!.lines / acc!.frames) : (r?.info?.render?.lines ?? 'n/a');
	const avgPoints = hasAcc ? Math.round(acc!.points / acc!.frames) : (r?.info?.render?.points ?? 'n/a');
	const avgPasses = hasAcc ? Number((acc!.renderPasses / acc!.frames).toFixed(2)) : 'n/a';

	const row: Record<string, unknown> = {
		fps: fpsValue,
		avgFrameMs,
		drawCalls: avgCalls,
		triangles: avgTris,
		lines: avgLines,
		points: avgPoints,
		renderPasses: avgPasses,
		peakDrawCalls: hasAcc ? acc!.maxCalls : 'n/a',
		peakTriangles: hasAcc ? acc!.maxTriangles : 'n/a',
		peakPasses: hasAcc ? acc!.maxPasses : 'n/a',
		geometries: r?.info?.memory?.geometries ?? 'n/a',
		textures: r?.info?.memory?.textures ?? 'n/a',
		programs: r?.info?.programs?.length ?? 'n/a',
		pixelRatio: typeof r?.getPixelRatio === 'function' ? r.getPixelRatio() : 'n/a',
		bufferSize: c ? `${c.width}x${c.height}` : 'n/a',
		cssSize: c ? `${c.clientWidth}x${c.clientHeight}` : 'n/a',
		shadowsEnabled: r?.shadowMap?.enabled ?? 'n/a',
		paused: debugState.paused,
	};

	if (verbose && refs.scene) {
		let meshes = 0;
		let instancedMeshes = 0;
		let lights = 0;
		let shadowCasters = 0;
		const materials = new Set<string>();

		refs.scene.traverse((obj) => {
			if (obj instanceof InstancedMesh) {
				instancedMeshes++;
			} else if (obj instanceof Mesh) {
				meshes++;
			}
			if (obj instanceof Light) {
				lights++;
				if ((obj as any).castShadow) shadowCasters++;
			}
			const material = (obj as any).material;
			if (material) {
				const list = Array.isArray(material) ? material : [material];
				for (const m of list) {
					if (m?.uuid) materials.add(m.uuid);
				}
			}
		});

		Object.assign(row, {
			meshes,
			instancedMeshes,
			lights,
			shadowCasters,
			materials: materials.size,
		});
	}

	return row;
}
