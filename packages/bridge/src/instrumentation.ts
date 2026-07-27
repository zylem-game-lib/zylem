/**
 * Opt-in tracing for the editor ↔ game bridge.
 *
 * Disabled by default: `BridgeChannel` guards every hook behind
 * `isBridgeDebugEnabled()`, so a production channel does no extra work beyond
 * one boolean read per message.
 *
 * Enable from the console with `__ZYLEM_BRIDGE__.enable()`, from the editor's
 * Bridge panel, or before load with `globalThis.__ZYLEM_BRIDGE_DEBUG__ = true`.
 */

import type { BridgeMessageType } from './protocol';

/** How a message entered the channel. */
export type BridgeEventKind =
	/** Queued for the next animation frame. */
	| 'queue'
	/** Dispatched immediately by a caller. */
	| 'send'
	/** Dispatched by the per-frame flush of queued payloads. */
	| 'flush'
	/** Delivered to a subscriber. */
	| 'deliver';

export interface BridgeTraceEvent {
	/** `performance.now()` at record time. */
	t: number;
	kind: BridgeEventKind;
	type: BridgeMessageType;
	/** Approximate serialized size of the payload in bytes. */
	bytes: number;
	/** Short human-readable description of the payload. */
	summary: string;
	/** Subscribers the message was delivered to (`send`/`flush` only). */
	listeners?: number;
}

export interface BridgeTypeStats {
	type: BridgeMessageType;
	/** Times `queue` was called. */
	queued: number;
	/** Times the message was actually dispatched. */
	sent: number;
	/** Total handler invocations. */
	delivered: number;
	/** Bytes dispatched, summed across sends. */
	bytes: number;
	/** Dispatches in the trailing rate window, per second. */
	rate: number;
	/** Bytes dispatched in the trailing rate window, per second. */
	byteRate: number;
	/**
	 * Fraction of queued messages that coalescing eliminated. 0 means every
	 * queued message was dispatched; 0.9 means 90% were merged away.
	 */
	coalesced: number;
	/** Current subscriber count. */
	listeners: number;
	/** `performance.now()` of the most recent dispatch. */
	lastSentAt: number | null;
}

export interface BridgeDebugOptions {
	/** Also mirror every event to `console.debug`. Default false. */
	log?: boolean;
	/** Dispatches per second per type before a rate warning fires. */
	rateWarningThreshold?: number;
}

/** Notified on every recorded event while tracing is enabled. */
export type BridgeTraceListener = (event: BridgeTraceEvent) => void;

const RATE_WINDOW_MS = 1_000;
const MAX_TRACE_EVENTS = 500;
const DEFAULT_RATE_WARNING = 240;

const now = (): number =>
	typeof performance !== 'undefined' ? performance.now() : Date.now();

/**
 * Rough byte size of a payload. Deliberately cheap and approximate: exact
 * sizing would cost more than the messages we are measuring.
 */
function approximateBytes(payload: unknown): number {
	if (payload === null || payload === undefined) return 0;
	switch (typeof payload) {
		case 'string':
			return payload.length * 2;
		case 'number':
			return 8;
		case 'boolean':
			return 4;
		default:
			break;
	}

	let total = 0;
	const seen = new Set<unknown>();
	const walk = (value: unknown, depth: number): void => {
		if (depth > 6 || value === null || value === undefined) return;
		switch (typeof value) {
			case 'string':
				total += value.length * 2;
				return;
			case 'number':
				total += 8;
				return;
			case 'boolean':
				total += 4;
				return;
			case 'object':
				break;
			default:
				return;
		}
		if (seen.has(value)) return;
		seen.add(value);
		if (Array.isArray(value)) {
			for (const item of value) walk(item, depth + 1);
			return;
		}
		for (const [key, item] of Object.entries(value as object)) {
			total += key.length * 2;
			walk(item, depth + 1);
		}
	};
	walk(payload, 0);
	return total;
}

/** One-line description of a payload for the trace log. */
function summarize(payload: unknown): string {
	if (payload === null) return 'null';
	if (payload === undefined) return 'undefined';
	if (Array.isArray(payload)) {
		return `${payload.length} item${payload.length === 1 ? '' : 's'}`;
	}
	if (typeof payload !== 'object') return String(payload);

	const parts: string[] = [];
	for (const [key, value] of Object.entries(payload as object)) {
		if (parts.length >= 3) {
			parts.push('…');
			break;
		}
		if (value === null || value === undefined) {
			parts.push(`${key}=${value}`);
		} else if (Array.isArray(value)) {
			parts.push(`${key}[${value.length}]`);
		} else if (typeof value === 'object') {
			parts.push(`${key}={…}`);
		} else {
			const text = String(value);
			parts.push(`${key}=${text.length > 24 ? `${text.slice(0, 24)}…` : text}`);
		}
	}
	return parts.join(' ');
}

interface TypeRecord {
	queued: number;
	sent: number;
	delivered: number;
	bytes: number;
	listeners: number;
	lastSentAt: number | null;
	/** Dispatch timestamps inside the rate window. */
	window: { t: number; bytes: number }[];
	rateWarned: boolean;
}

class BridgeTracer {
	private enabled = false;
	private options: Required<BridgeDebugOptions> = {
		log: false,
		rateWarningThreshold: DEFAULT_RATE_WARNING,
	};
	private records = new Map<BridgeMessageType, TypeRecord>();
	private events: BridgeTraceEvent[] = [];
	private listeners = new Set<BridgeTraceListener>();
	/** Message types currently mid-dispatch, for reentrancy detection. */
	private dispatching: BridgeMessageType[] = [];
	private reentrancyWarned = new Set<string>();

	isEnabled(): boolean {
		return this.enabled;
	}

	enable(options?: BridgeDebugOptions): void {
		this.enabled = true;
		if (options?.log !== undefined) this.options.log = options.log;
		if (options?.rateWarningThreshold !== undefined) {
			this.options.rateWarningThreshold = options.rateWarningThreshold;
		}
	}

	disable(): void {
		this.enabled = false;
	}

	reset(): void {
		this.records.clear();
		this.events = [];
		this.reentrancyWarned.clear();
	}

	/** Subscribe to trace events. Returns an unsubscribe function. */
	subscribe(listener: BridgeTraceListener): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	/** The most recent trace events, oldest first. */
	tail(count = 50): BridgeTraceEvent[] {
		return this.events.slice(-count);
	}

	/** Per-type statistics, busiest first. */
	stats(): BridgeTypeStats[] {
		const t = now();
		const out: BridgeTypeStats[] = [];
		for (const [type, record] of this.records) {
			this.trimWindow(record, t);
			const windowBytes = record.window.reduce((sum, e) => sum + e.bytes, 0);
			const seconds = RATE_WINDOW_MS / 1_000;
			out.push({
				type,
				queued: record.queued,
				sent: record.sent,
				delivered: record.delivered,
				bytes: record.bytes,
				rate: record.window.length / seconds,
				byteRate: windowBytes / seconds,
				coalesced:
					record.queued > 0
						? Math.max(0, 1 - record.sent / record.queued)
						: 0,
				listeners: record.listeners,
				lastSentAt: record.lastSentAt,
			});
		}
		return out.sort((a, b) => b.rate - a.rate || b.sent - a.sent);
	}

	recordQueue(type: BridgeMessageType, payload: unknown): void {
		const record = this.record(type);
		record.queued += 1;
		this.emit({
			t: now(),
			kind: 'queue',
			type,
			bytes: approximateBytes(payload),
			summary: summarize(payload),
		});
	}

	recordSend(
		type: BridgeMessageType,
		payload: unknown,
		listeners: number,
		fromFlush: boolean,
	): void {
		const t = now();
		const bytes = approximateBytes(payload);
		const record = this.record(type);
		record.sent += 1;
		record.bytes += bytes;
		record.listeners = listeners;
		record.lastSentAt = t;
		record.window.push({ t, bytes });
		this.trimWindow(record, t);
		this.checkRate(type, record);

		this.emit({
			t,
			kind: fromFlush ? 'flush' : 'send',
			type,
			bytes,
			summary: summarize(payload),
			listeners,
		});
	}

	recordDeliver(type: BridgeMessageType): void {
		this.record(type).delivered += 1;
	}

	/**
	 * Track dispatch nesting so a handler that re-sends the type it is
	 * handling — a genuine feedback loop — is reported once, with a stack.
	 */
	beginDispatch(type: BridgeMessageType): void {
		if (this.dispatching.includes(type) && !this.reentrancyWarned.has(type)) {
			this.reentrancyWarned.add(type);
			console.warn(
				`[zylem/bridge] Feedback loop: "${type}" was re-sent while it was `
				+ 'still being dispatched. A handler for this message is publishing '
				+ 'it again.\nDispatch stack: '
				+ `${[...this.dispatching, type].join(' -> ')}`,
				new Error('bridge reentrancy').stack,
			);
		}
		this.dispatching.push(type);
	}

	endDispatch(): void {
		this.dispatching.pop();
	}

	private record(type: BridgeMessageType): TypeRecord {
		let record = this.records.get(type);
		if (!record) {
			record = {
				queued: 0,
				sent: 0,
				delivered: 0,
				bytes: 0,
				listeners: 0,
				lastSentAt: null,
				window: [],
				rateWarned: false,
			};
			this.records.set(type, record);
		}
		return record;
	}

	private trimWindow(record: TypeRecord, t: number): void {
		const cutoff = t - RATE_WINDOW_MS;
		while (record.window.length > 0 && record.window[0]!.t < cutoff) {
			record.window.shift();
		}
	}

	private checkRate(type: BridgeMessageType, record: TypeRecord): void {
		const rate = record.window.length / (RATE_WINDOW_MS / 1_000);
		if (rate > this.options.rateWarningThreshold) {
			if (!record.rateWarned) {
				record.rateWarned = true;
				console.warn(
					`[zylem/bridge] "${type}" is dispatching ${Math.round(rate)} msg/s, `
					+ `above the ${this.options.rateWarningThreshold} msg/s threshold. `
					+ 'Consider queueing or dirty-checking this publisher.',
				);
			}
		} else if (rate < this.options.rateWarningThreshold / 2) {
			record.rateWarned = false;
		}
	}

	private emit(event: BridgeTraceEvent): void {
		this.events.push(event);
		if (this.events.length > MAX_TRACE_EVENTS) {
			this.events.splice(0, this.events.length - MAX_TRACE_EVENTS);
		}
		if (this.options.log) {
			console.debug(
				`[zylem/bridge] ${event.kind} ${event.type} (${event.bytes}B) ${event.summary}`,
			);
		}
		for (const listener of this.listeners) {
			try {
				listener(event);
			} catch (error) {
				console.error('[zylem/bridge] trace listener failed', error);
			}
		}
	}
}

export const bridgeTracer = new BridgeTracer();

/** Whether bridge tracing is currently recording. */
export function isBridgeDebugEnabled(): boolean {
	return bridgeTracer.isEnabled();
}

/** Console/panel-facing control surface for bridge tracing. */
export const bridgeDebug = {
	enable: (options?: BridgeDebugOptions) => bridgeTracer.enable(options),
	disable: () => bridgeTracer.disable(),
	isEnabled: () => bridgeTracer.isEnabled(),
	reset: () => bridgeTracer.reset(),
	stats: () => bridgeTracer.stats(),
	tail: (count?: number) => bridgeTracer.tail(count),
	subscribe: (listener: BridgeTraceListener) => bridgeTracer.subscribe(listener),
};

export type BridgeDebugApi = typeof bridgeDebug;

/**
 * Install the console handle and honour a pre-load
 * `globalThis.__ZYLEM_BRIDGE_DEBUG__ = true` opt-in. Called once by the
 * registry when the shared bridge is created.
 */
export function installBridgeDebugGlobals(): void {
	if (typeof globalThis === 'undefined') return;
	const registry = globalThis as Record<string, unknown>;
	if (registry.__ZYLEM_BRIDGE_DEBUG__ === true) {
		bridgeTracer.enable();
	}
	registry.__ZYLEM_BRIDGE__ = bridgeDebug;
}
