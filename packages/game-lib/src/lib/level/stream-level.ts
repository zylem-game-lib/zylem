/**
 * Stream a level buffer into a stage.
 *
 * The streamer does not know the catalog. `spawn` is the host's existing
 * create path, which resolves a catalog id and no-ops when the type is
 * unknown. Entries are handed off in batches, yielding to the event loop
 * between them so a large level does not stall the frame the way a single
 * synchronous spawn loop would.
 */

import type { LevelBuffer, LevelEntry } from '@zylem/bridge';

/** How many entries to spawn before yielding. Matches stage entity loading. */
const BATCH_SIZE = 5;

/** Yields to the event loop via MessageChannel (~0.1ms vs ~4ms for setTimeout). */
function yieldToEventLoop(): Promise<void> {
	return new Promise((resolve) => {
		const channel = new MessageChannel();
		channel.port1.onmessage = () => resolve();
		channel.port2.postMessage(undefined);
	});
}

export interface StreamLevelOptions {
	/** @default 5 */
	batchSize?: number;
}

export interface StreamLevelResult {
	/** Entries handed to `spawn`, in buffer order. */
	spawned: number;
}

/**
 * Hand each buffer entry to `spawn`, in order, yielding between batches.
 *
 * @returns How many entries were handed off. A spawn that no-ops for an
 * unknown catalog type still counts: the entry was delivered.
 */
export async function streamLevel(
	buffer: LevelBuffer,
	spawn: (entry: LevelEntry) => void | Promise<void>,
	options: StreamLevelOptions = {}
): Promise<StreamLevelResult> {
	const batchSize = Math.max(1, options.batchSize ?? BATCH_SIZE);
	let spawned = 0;

	for (const entry of buffer.entries) {
		await spawn(entry);
		spawned += 1;
		if (spawned % batchSize === 0) {
			await yieldToEventLoop();
		}
	}

	if (spawned % batchSize !== 0) {
		await yieldToEventLoop();
	}

	return { spawned };
}
