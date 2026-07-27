/**
 * State backing the editor's Bridge panel.
 *
 * Mirrors the tracer in `@zylem/bridge` into a valtio proxy the Solid UI can
 * subscribe to. Capture is opt-in and only runs while the panel is mounted, so
 * an unopened panel costs nothing. The event log is a fixed-size ring buffer —
 * bridge traffic can be thousands of messages per minute, and an unbounded log
 * would recreate the very growth problem the panel exists to surface.
 */

import { proxy } from 'valtio/vanilla';
import {
	bridgeDebug,
	getZylemBridge,
	type BridgeMessageType,
	type BridgeTraceEvent,
	type BridgeTypeStats,
} from '@zylem/bridge';

/** Maximum trace rows retained for display. */
export const MAX_BRIDGE_LOG_ENTRIES = 200;

/** Dispatch rate (per second) above which a row is flagged as hot. */
export const BRIDGE_RATE_WARNING = 60;

export interface BridgeLogEntry {
	id: number;
	time: string;
	kind: BridgeTraceEvent['kind'];
	type: string;
	bytes: number;
	summary: string;
}

export interface BridgeStatsRow extends BridgeTypeStats {
	/** Entries the channel is retaining for late-subscriber hydration. */
	retained: number;
}

export interface BridgePanelState {
	capturing: boolean;
	paused: boolean;
	entries: BridgeLogEntry[];
	stats: BridgeStatsRow[];
	/** Events dropped from the log because the ring buffer was full. */
	dropped: number;
}

export const bridgePanelState = proxy<BridgePanelState>({
	capturing: false,
	paused: false,
	entries: [],
	stats: [],
	dropped: 0,
});

let nextId = 0;
let unsubscribeTrace: (() => void) | null = null;
let statsTimer: ReturnType<typeof setInterval> | null = null;
/**
 * Whether this panel turned the shared tracer on. Tracing can also be enabled
 * from the console or `__ZYLEM_BRIDGE_DEBUG__`, and closing the panel must not
 * silently switch that off for the whole page.
 */
let enabledTracer = false;

const formatTime = (t: number): string => {
	const seconds = t / 1_000;
	return `${seconds.toFixed(2)}s`;
};

function refreshStats(): void {
	const { channel } = getZylemBridge();
	bridgePanelState.stats = bridgeDebug.stats().map((entry) => ({
		...entry,
		retained: channel.retainedSize(entry.type as BridgeMessageType),
	}));
}

function record(event: BridgeTraceEvent): void {
	if (bridgePanelState.paused) return;
	// Deliveries are counted in the stats table; logging each one would flood
	// the ring buffer with rows that carry no extra information.
	if (event.kind === 'deliver') return;

	const entries = bridgePanelState.entries;
	entries.push({
		id: nextId++,
		time: formatTime(event.t),
		kind: event.kind,
		type: event.type,
		bytes: event.bytes,
		summary: event.summary,
	});
	if (entries.length > MAX_BRIDGE_LOG_ENTRIES) {
		const overflow = entries.length - MAX_BRIDGE_LOG_ENTRIES;
		entries.splice(0, overflow);
		bridgePanelState.dropped += overflow;
	}
}

/**
 * Begin mirroring bridge traffic into the panel, enabling the core tracer if
 * it is not already running.
 *
 * @returns A function that stops capture.
 */
export function startBridgeCapture(): () => void {
	if (bridgePanelState.capturing) return stopBridgeCapture;
	bridgePanelState.capturing = true;

	enabledTracer = !bridgeDebug.isEnabled();
	if (enabledTracer) bridgeDebug.enable();
	unsubscribeTrace = bridgeDebug.subscribe(record);
	refreshStats();
	statsTimer = setInterval(refreshStats, 500);

	return stopBridgeCapture;
}

export function stopBridgeCapture(): void {
	unsubscribeTrace?.();
	unsubscribeTrace = null;
	if (statsTimer !== null) {
		clearInterval(statsTimer);
		statsTimer = null;
	}
	// Only undo what this panel turned on; leave console-enabled tracing alone.
	if (enabledTracer) {
		bridgeDebug.disable();
		enabledTracer = false;
	}
	bridgePanelState.capturing = false;
}

export function setBridgeCapturePaused(paused: boolean): void {
	bridgePanelState.paused = paused;
}

export function clearBridgeLog(): void {
	bridgePanelState.entries = [];
	bridgePanelState.dropped = 0;
	bridgeDebug.reset();
	refreshStats();
}

/** Format a byte count for display. */
export function formatBytes(bytes: number): string {
	if (bytes < 1_024) return `${Math.round(bytes)} B`;
	if (bytes < 1_024 * 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
	return `${(bytes / (1_024 * 1_024)).toFixed(1)} MB`;
}
