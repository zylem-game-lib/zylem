import type { Identity } from 'spacetimedb';
import type { ErrorContext } from '../spacetimedb-generated';
import { DbConnection } from '../spacetimedb-generated';

/** Published database name (see `packages/server` `publish:local`). */
export const FOUR_CHAR_MODULE_NAME = 'zylem-entity-transforms-v2';

/**
 * WebSocket base URL for SpacetimeDB (see SpacetimeDB TS SDK: use `ws://` / `wss://`).
 * Override with `VITE_STDB_URI` (`ws://…`, `wss://…`, or `http(s)://…` which we normalize).
 */
export function getFourCharSpacetimeUri(): string {
  const raw = import.meta.env.VITE_STDB_URI ?? 'ws://127.0.0.1:3000';
  return normalizeSpacetimeClientUri(raw);
}

/**
 * Ensures a WebSocket scheme so the client matches official examples (`ws://localhost:3000`).
 * Accepts `http(s)://` and maps to `ws(s)://`.
 */
export function normalizeSpacetimeClientUri(uri: string): string {
  try {
    const u = new URL(uri);
    if (u.protocol === 'http:') {
      u.protocol = 'ws:';
      return u.toString();
    }
    if (u.protocol === 'https:') {
      u.protocol = 'wss:';
      return u.toString();
    }
    return uri;
  } catch {
    return uri;
  }
}

export type FourCharDbConnection = InstanceType<typeof DbConnection>;

/**
 * Connect to the published module and return a typed {@link DbConnection}.
 * Callers should register `db.*` callbacks, then `subscriptionBuilder()…subscribeToAllTables()`.
 */
export function connectFourCharModule(
  options: {
    onConnect?: (conn: FourCharDbConnection, identity: Identity, token: string) => void;
    onConnectError?: (ctx: ErrorContext, error: Error) => void;
    onDisconnect?: (ctx: ErrorContext, error?: Error) => void;
  } = {},
): FourCharDbConnection {
  const builder = DbConnection.builder()
    .withUri(getFourCharSpacetimeUri())
    .withDatabaseName(FOUR_CHAR_MODULE_NAME);

  if (options.onConnect) {
    builder.onConnect(options.onConnect);
  }
  if (options.onConnectError) {
    builder.onConnectError(options.onConnectError);
  }
  if (options.onDisconnect) {
    builder.onDisconnect(options.onDisconnect);
  }

  return builder.build();
}
