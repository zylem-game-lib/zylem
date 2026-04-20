import type { Identity } from 'spacetimedb';
import type { ArenaDbConnection } from '../networking/arena-stdb-client';

/**
 * Handle returned by {@link createAiHost}. Encapsulates the
 * AI-host-election machinery: a single client in the arena is elected
 * "host" and is responsible for simulating enemy AI + pushing transform
 * updates to the server. All other clients simply mirror the state.
 *
 * `isAiHost()` is the source of truth for enemies / game logic; it
 * reflects whether this client's identity currently matches the
 * `ai_host` singleton row.
 */
export interface AiHostHandle {
	/**
	 * True once this client has received the `ai_host` row reflecting
	 * its own identity. Safe to poll every frame; reads a cached boolean
	 * updated from the `ai_host` table subscription callbacks.
	 */
	isAiHost(): boolean;
	/**
	 * Called from the subscription-applied callback once initial state
	 * is loaded. Exposed so `arena-network.ts` can drive it directly
	 * instead of relying on timing between two separate subscriptions.
	 */
	init(conn: ArenaDbConnection, myIdentity: Identity): void;
	/** Release internal references. Call on network teardown. */
	reset(): void;
}

/**
 * Build a fresh AI host handle. The handle is intentionally inert until
 * {@link AiHostHandle.init} runs; callers should invoke it once their
 * STDB connection has reported `onConnect` with the client identity.
 *
 * Election algorithm:
 * 1. On connect/subscription-applied, if no `ai_host` row exists we
 *    fire `claim_ai_host()`. The server insert is first-wins.
 * 2. A `db.ai_host.onInsert/onDelete` pair updates the cached host
 *    identity; we re-evaluate `isAiHost()` after each.
 * 3. When the current host disconnects, the `client_disconnected`
 *    reducer deletes the row — any surviving client will fire
 *    `claim_ai_host()` on the next `onDelete` and take over.
 */
export function createAiHost(): AiHostHandle {
	let connRef: ArenaDbConnection | null = null;
	let myIdentity: Identity | null = null;
	let hostIdentity: Identity | null = null;

	function refreshHost(): void {
		if (!connRef) return;
		const row = connRef.db.ai_host.id.find(0);
		hostIdentity = row?.identity ?? null;
	}

	function claimIfVacant(): void {
		if (!connRef) return;
		if (hostIdentity !== null) return;
		void connRef.reducers.claimAiHost({});
	}

	return {
		isAiHost() {
			if (!myIdentity || !hostIdentity) return false;
			return hostIdentity.equals(myIdentity);
		},
		init(conn, identity) {
			connRef = conn;
			myIdentity = identity;

			conn.db.ai_host.onInsert((_ctx, row) => {
				hostIdentity = row.identity;
			});
			conn.db.ai_host.onUpdate((_ctx, _old, row) => {
				hostIdentity = row.identity;
			});
			conn.db.ai_host.onDelete(() => {
				hostIdentity = null;
				claimIfVacant();
			});

			refreshHost();
			claimIfVacant();
		},
		reset() {
			connRef = null;
			myIdentity = null;
			hostIdentity = null;
		},
	};
}
