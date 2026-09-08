/**
 * BridgeChannel — typed EventTarget with per-frame coalescing and
 * last-known-state retention for late subscribers.
 */

import { bridgeTracer, isBridgeDebugEnabled } from './instrumentation';
import type { BridgeMessages, BridgeMessageType } from './protocol';

export type BridgeHandler<K extends BridgeMessageType> = (
	payload: BridgeMessages[K],
) => void;

/**
 * Upper bound on uuid-keyed entries kept for late-subscriber hydration.
 * Retention accumulates across sends, so without a cap a game that spawns and
 * destroys entities would grow this map for the lifetime of the page.
 */
const MAX_RETAINED_ITEMS = 2_000;

/**
 * Types whose every message must survive.
 *
 * Coalescing merges two payloads of the same type queued within one frame,
 * which is right for state mirrors (a newer entity transform supersedes an
 * older one) but destructive for a log of discrete events: two scene
 * operations committed in the same frame would shallow-merge into one and
 * silently drop an undo entry. `queue` dispatches these immediately instead.
 *
 * Pick answers and swatch acks are request/response: each carries an id the
 * requester is waiting on, so merging two would lose a reply. `entity:pick`
 * itself is deliberately *not* listed — a drag streams picks faster than
 * frames, and only the latest pointer position matters.
 */
const NON_COALESCING_TYPES = new Set<BridgeMessageType>([
	'scene:operation',
	'entity:pick:result',
	'entity:swatch-applied',
]);

/**
 * Types that are discrete events rather than state, so there is nothing
 * meaningful to hydrate a late subscriber with. Retaining them would replay a
 * stale event — an editor connecting mid-session would push an already-applied
 * scene operation onto its undo stack.
 */
const NON_RETAINED_TYPES = new Set<BridgeMessageType>([
	'scene:operation',
	'entity:pick',
	'entity:pick:result',
	'entity:apply-swatch',
	'entity:swatch-applied',
]);

type PendingMap = Partial<{ [K in BridgeMessageType]: BridgeMessages[K] }>;

/** Entry stored per message type for `getState` hydration. */
type StateMap = Map<BridgeMessageType, unknown>;

function hasUuid(value: unknown): value is { uuid: string } {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as { uuid?: unknown }).uuid === 'string'
	);
}

/**
 * Merge a queued payload with an already-pending one for the same type.
 *
 * - Arrays of uuid-keyed items merge by uuid (later wins), preserving order
 *   of first appearance — used by `entity:upsert` / `entity:thumbnail`.
 * - Other arrays concatenate.
 * - Plain objects shallow-merge (later wins), with `uuids` arrays unioned —
 *   used by `entity:removed`.
 * - Anything else: later replaces earlier.
 */
export function mergePayloads<T>(previous: T, next: T): T {
	if (Array.isArray(previous) && Array.isArray(next)) {
		if (previous.every(hasUuid) && next.every(hasUuid)) {
			const byUuid = new Map<string, unknown>();
			for (const item of previous) byUuid.set((item as { uuid: string }).uuid, item);
			for (const item of next) byUuid.set((item as { uuid: string }).uuid, item);
			return [...byUuid.values()] as T;
		}
		return [...previous, ...next] as T;
	}

	if (
		typeof previous === 'object' &&
		previous !== null &&
		typeof next === 'object' &&
		next !== null &&
		!Array.isArray(previous) &&
		!Array.isArray(next)
	) {
		const merged: Record<string, unknown> = {
			...(previous as Record<string, unknown>),
			...(next as Record<string, unknown>),
		};
		const prevUuids = (previous as { uuids?: unknown }).uuids;
		const nextUuids = (next as { uuids?: unknown }).uuids;
		if (Array.isArray(prevUuids) && Array.isArray(nextUuids)) {
			merged.uuids = [...new Set([...prevUuids, ...nextUuids])];
		}
		return merged as T;
	}

	return next;
}

const scheduleFrame: (callback: () => void) => void =
	typeof requestAnimationFrame === 'function'
		? (callback) => requestAnimationFrame(() => callback())
		: (callback) => setTimeout(callback, 16);

/**
 * Typed message channel shared by the game and editor bridge adapters.
 *
 * - `send` dispatches immediately.
 * - `queue` coalesces repeated payloads for the same type and flushes once
 *   per animation frame, so high-frequency updates (entity transforms,
 *   thumbnails streaming in) cost at most one message per rendered frame.
 * - `getState` returns the last delivered payload per type so a
 *   late-mounting consumer (editor opened mid-game) can hydrate without
 *   waiting for the next publish.
 */
export class BridgeChannel extends EventTarget {
	private pending: PendingMap = {};
	private frameScheduled = false;
	private state: StateMap = new Map();
	/** Live subscriber count per message type, for `hasSubscribers`. */
	private subscriberCounts = new Map<BridgeMessageType, number>();
	/** Notified when a type gains its first subscriber. */
	private subscriberListeners = new Set<(type: BridgeMessageType) => void>();
	private flushing = false;

	/** Dispatch a message immediately. */
	send<K extends BridgeMessageType>(type: K, payload: BridgeMessages[K]): void {
		this.retain(type, payload);

		if (!isBridgeDebugEnabled()) {
			this.dispatchEvent(new CustomEvent(type, { detail: payload }));
			return;
		}

		bridgeTracer.recordSend(
			type,
			payload,
			this.subscriberCounts.get(type) ?? 0,
			this.flushing,
		);
		bridgeTracer.beginDispatch(type);
		try {
			this.dispatchEvent(new CustomEvent(type, { detail: payload }));
		} finally {
			bridgeTracer.endDispatch();
		}
	}

	/**
	 * Queue a message for the next animation frame, merging with any payload
	 * already queued for the same type.
	 */
	queue<K extends BridgeMessageType>(type: K, payload: BridgeMessages[K]): void {
		if (isBridgeDebugEnabled()) {
			bridgeTracer.recordQueue(type, payload);
		}

		if (NON_COALESCING_TYPES.has(type)) {
			this.send(type, payload);
			return;
		}

		const existing = this.pending[type];
		this.pending[type] =
			existing === undefined ? payload : mergePayloads(existing, payload);

		if (this.frameScheduled) return;
		this.frameScheduled = true;
		scheduleFrame(() => this.flush());
	}

	/** Flush all queued messages now (also runs automatically per frame). */
	flush(): void {
		this.frameScheduled = false;
		const batch = this.pending;
		this.pending = {};
		this.flushing = true;
		try {
			for (const key of Object.keys(batch) as BridgeMessageType[]) {
				const payload = batch[key];
				if (payload !== undefined) {
					this.send(key, payload as BridgeMessages[typeof key]);
				}
			}
		} finally {
			this.flushing = false;
		}
	}

	/** Subscribe to a message type. Returns an unsubscribe function. */
	on<K extends BridgeMessageType>(type: K, handler: BridgeHandler<K>): () => void {
		const listener = (event: Event) => {
			if (isBridgeDebugEnabled()) {
				bridgeTracer.recordDeliver(type);
			}
			handler((event as CustomEvent<BridgeMessages[K]>).detail);
		};
		this.addEventListener(type, listener);

		const previous = this.subscriberCounts.get(type) ?? 0;
		this.subscriberCounts.set(type, previous + 1);
		if (previous === 0) {
			for (const notify of this.subscriberListeners) {
				try {
					notify(type);
				} catch (error) {
					console.error('[zylem/bridge] subscriber listener failed', error);
				}
			}
		}

		let removed = false;
		return () => {
			if (removed) return;
			removed = true;
			this.removeEventListener(type, listener);
			const count = this.subscriberCounts.get(type) ?? 0;
			if (count <= 1) {
				this.subscriberCounts.delete(type);
			} else {
				this.subscriberCounts.set(type, count - 1);
			}
		};
	}

	/**
	 * Subscribe without counting toward `hasSubscribers`. Reserved for the
	 * channel's own retained-state housekeeping, which must not look like an
	 * attached editor to publishers gating work on real demand.
	 *
	 * @internal
	 */
	onInternal<K extends BridgeMessageType>(
		type: K,
		handler: BridgeHandler<K>,
	): () => void {
		const listener = (event: Event) => {
			handler((event as CustomEvent<BridgeMessages[K]>).detail);
		};
		this.addEventListener(type, listener);
		return () => this.removeEventListener(type, listener);
	}

	/**
	 * Whether anyone is listening for a message type. Publishers use this to
	 * skip expensive work (thumbnail renders, entity summaries) when no editor
	 * is attached.
	 */
	hasSubscribers(type: BridgeMessageType): boolean {
		return (this.subscriberCounts.get(type) ?? 0) > 0;
	}

	/** Current subscriber count for a message type. */
	subscriberCount(type: BridgeMessageType): number {
		return this.subscriberCounts.get(type) ?? 0;
	}

	/**
	 * Observe types gaining their first subscriber, so a publisher that went
	 * idle can backfill state for a late-connecting consumer.
	 *
	 * @returns An unsubscribe function.
	 */
	onSubscriberAdded(listener: (type: BridgeMessageType) => void): () => void {
		this.subscriberListeners.add(listener);
		return () => {
			this.subscriberListeners.delete(listener);
		};
	}

	/** Last delivered payload for a message type, if any. */
	getState<K extends BridgeMessageType>(type: K): BridgeMessages[K] | undefined {
		return this.state.get(type) as BridgeMessages[K] | undefined;
	}

	/** Overwrite the retained state for a type (used for pruning). */
	setState<K extends BridgeMessageType>(
		type: K,
		payload: BridgeMessages[K] | undefined,
	): void {
		if (payload === undefined) {
			this.state.delete(type);
		} else {
			this.state.set(type, payload);
		}
	}

	/** Drop all retained state and queued messages. */
	reset(): void {
		this.pending = {};
		this.state.clear();
	}

	/** Number of retained entries for a type (array length, or 1 for objects). */
	retainedSize(type: BridgeMessageType): number {
		const existing = this.state.get(type);
		if (existing === undefined) return 0;
		return Array.isArray(existing) ? existing.length : 1;
	}

	/**
	 * Retain state for hydration. Uuid-keyed array types accumulate across
	 * sends (an upsert of entity B must not discard retained entity A), capped
	 * at {@link MAX_RETAINED_ITEMS} so a game that continuously spawns entities
	 * cannot grow this unbounded.
	 */
	private retain<K extends BridgeMessageType>(
		type: K,
		payload: BridgeMessages[K],
	): void {
		if (NON_RETAINED_TYPES.has(type)) return;

		const existing = this.state.get(type);
		if (
			existing !== undefined &&
			Array.isArray(existing) &&
			Array.isArray(payload)
		) {
			const merged = mergePayloads(existing, payload) as unknown[];
			this.state.set(
				type,
				merged.length > MAX_RETAINED_ITEMS
					? merged.slice(merged.length - MAX_RETAINED_ITEMS)
					: merged,
			);
			return;
		}
		this.state.set(type, payload);
	}
}
