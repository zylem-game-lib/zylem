/**
 * Realm-safe bridge singleton.
 *
 * The game and editor bundles may each carry their own copy of this module
 * (linked workspaces, duplicated chunks). Resolving the shared instance
 * through `Symbol.for` on `globalThis` guarantees both sides talk to the
 * same channel regardless of how many module copies were loaded — the same
 * class of failure previously seen with duplicated three.js instances.
 */

import { BridgeChannel } from './channel';
import { installBridgeDebugGlobals } from './instrumentation';
import type { EntitySummaryPayload, EntityThumbnailPayload } from './protocol';
import { BRIDGE_READY_EVENT } from './protocol';

const BRIDGE_KEY = Symbol.for('zylem.bridge.v1');

/** Shared bridge: one channel carrying both message directions. */
export interface ZylemBridge {
	channel: BridgeChannel;
}

function createBridge(): ZylemBridge {
	const channel = new BridgeChannel();

	// Keep retained hydration state consistent: removing entities must prune
	// them from the accumulated upsert/thumbnail snapshots, and a fresh stage
	// snapshot resets the incremental entity state.
	channel.onInternal('entity:removed', ({ uuids }) => {
		const removed = new Set(uuids);
		const upserts = channel.getState('entity:upsert');
		if (upserts) {
			channel.setState(
				'entity:upsert',
				upserts.filter((entity: EntitySummaryPayload) => !removed.has(entity.uuid)),
			);
		}
		const thumbnails = channel.getState('entity:thumbnail');
		if (thumbnails) {
			channel.setState(
				'entity:thumbnail',
				thumbnails.filter(
					(thumbnail: EntityThumbnailPayload) => !removed.has(thumbnail.uuid),
				),
			);
		}
	});

	channel.onInternal('stage:snapshot', () => {
		channel.setState('entity:upsert', undefined);
		channel.setState('entity:thumbnail', undefined);
	});

	installBridgeDebugGlobals();

	return { channel };
}

/**
 * Resolve the process-wide bridge, creating it on first access.
 */
export function getZylemBridge(): ZylemBridge {
	const registry = globalThis as Record<PropertyKey, unknown>;
	let bridge = registry[BRIDGE_KEY] as ZylemBridge | undefined;
	if (!bridge) {
		bridge = createBridge();
		registry[BRIDGE_KEY] = bridge;
	}
	return bridge;
}

/**
 * Announce that the game side of the bridge is live. Dispatches a
 * `zylem:bridge:ready` CustomEvent that bubbles across shadow DOM
 * boundaries so decoupled listeners (editor, devtools) can react without
 * polling.
 */
export function announceBridgeReady(source?: EventTarget): void {
	if (typeof CustomEvent === 'undefined') return;
	const event = new CustomEvent(BRIDGE_READY_EVENT, {
		bubbles: true,
		composed: true,
	});
	const target =
		source ?? (typeof document !== 'undefined' ? document : undefined);
	target?.dispatchEvent(event);
}
