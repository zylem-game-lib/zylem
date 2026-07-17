/**
 * Opt-in per-section frame timing for `ZylemStage._update`.
 * Enable with `globalThis.__ZYLEM_PROFILE_STAGE__ = true` (the
 * massive-instancing demo sets this automatically).
 */
export type StageFrameSection =
	| 'behaviorSystems'
	| 'entityLoop'
	| 'worldUpdate'
	| 'syncRenderPoses'
	| 'renderStrategy'
	| 'camera'
	| 'scene'
	| 'debugUpdate';

const LOG_INTERVAL = 60;

let enabled = false;
const accumMs: Partial<Record<StageFrameSection, number>> = {};
let frameCount = 0;
let sectionStart = 0;
let activeSection: StageFrameSection | null = null;

function now(): number {
	if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
		return performance.now();
	}
	return Date.now();
}

export function isStageFrameProfilerEnabled(): boolean {
	if (enabled) return true;
	if (typeof globalThis !== 'undefined' && (globalThis as { __ZYLEM_PROFILE_STAGE__?: boolean }).__ZYLEM_PROFILE_STAGE__ === true) {
		enabled = true;
	}
	return enabled;
}

export function setStageFrameProfilerEnabled(value: boolean): void {
	enabled = value;
	if (typeof globalThis !== 'undefined') {
		(globalThis as { __ZYLEM_PROFILE_STAGE__?: boolean }).__ZYLEM_PROFILE_STAGE__ = value;
	}
}

export function beginStageFrameSection(section: StageFrameSection): void {
	if (!isStageFrameProfilerEnabled()) return;
	activeSection = section;
	sectionStart = now();
}

export function endStageFrameSection(): void {
	if (!isStageFrameProfilerEnabled() || activeSection === null) return;
	const elapsed = now() - sectionStart;
	accumMs[activeSection] = (accumMs[activeSection] ?? 0) + elapsed;
	activeSection = null;
}

export function finishStageFrame(): void {
	if (!isStageFrameProfilerEnabled()) return;
	frameCount++;
	if (frameCount % LOG_INTERVAL !== 0) return;

	const total = Object.values(accumMs).reduce((sum, v) => sum + (v ?? 0), 0);
	const parts = (Object.keys(accumMs) as StageFrameSection[])
		.sort((a, b) => (accumMs[b] ?? 0) - (accumMs[a] ?? 0))
		.map((key) => {
			const ms = accumMs[key] ?? 0;
			const pct = total > 0 ? ((ms / total) * 100).toFixed(1) : '0.0';
			return `${key}=${ms.toFixed(2)}ms (${pct}%)`;
		});

	console.info(`[ZylemStage profile] avg over ${LOG_INTERVAL} frames (${total.toFixed(2)}ms/frame): ${parts.join(', ')}`);

	for (const key of Object.keys(accumMs) as StageFrameSection[]) {
		accumMs[key] = 0;
	}
}

export function profileStageFrameSection<T>(section: StageFrameSection, fn: () => T): T {
	beginStageFrameSection(section);
	try {
		return fn();
	} finally {
		endStageFrameSection();
	}
}
