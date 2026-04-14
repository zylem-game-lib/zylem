import type { Identity } from 'spacetimedb';
import type { ErrorContext } from '../spacetimedb-generated';
import { DbConnection } from '../spacetimedb-generated';

/** Published database name (see `packages/server` `publish:local`). */
export const FOUR_CHAR_MODULE_NAME = 'zylem-entity-transforms-v2';

/**
 * WebSocket base URL for SpacetimeDB (see SpacetimeDB TS SDK: use `ws://` / `wss://`).
 * - **Dev:** defaults to `ws://127.0.0.1:3000`.
 * - **Production:** set `VITE_STDB_URI` to the public HTTPS origin (e.g. another Render service), or omit it when the examples app and SpacetimeDB share the same origin (Docker nginx image) so `window.location.origin` is used.
 * See `packages/server/README.md` (Render deploy) and `packages/examples/.env.production.example`.
 */
export function getFourCharSpacetimeUri(): string {
  const env = import.meta.env.VITE_STDB_URI;
  if (typeof env === 'string' && env.trim() !== '') {
    return normalizeSpacetimeClientUri(env);
  }
  if (import.meta.env.PROD && typeof globalThis !== 'undefined' && 'location' in globalThis) {
    const origin = (globalThis as unknown as Window).location?.origin;
    if (origin) {
      return normalizeSpacetimeClientUri(origin);
    }
  }
  return normalizeSpacetimeClientUri('ws://127.0.0.1:3000');
}

/** WHATWG URL parses `ws://10000` as host `0.0.39.16` (decimal IPv4 for 10000). That breaks WSS / mixed content. */
const LEGACY_DECIMAL_IPV4_FROM_SINGLE_NUMBER = '0.0.39.16';

function isBrowserHttps(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    'location' in globalThis &&
    (globalThis as { location?: { protocol?: string } }).location?.protocol === 'https:'
  );
}

function isLocalWebsocketHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

/**
 * Ensures a WebSocket scheme so the client matches official examples (`ws://localhost:3000`).
 * Accepts `http(s)://` and maps to `ws(s)://`.
 *
 * - `https://` → `wss://` (required for pages served over HTTPS; browsers block `ws://` as mixed content).
 * - On an HTTPS page, `ws://` to a non-localhost host is upgraded to `wss://`.
 * - Rejects ambiguous URIs like `ws://10000` (use `https://your-host` / `wss://your-host`, not a bare port).
 */
export function normalizeSpacetimeClientUri(uri: string): string {
  const trimmed = uri.trim();
  if (!trimmed) {
    throw new Error('SpacetimeDB URI is empty. Set VITE_STDB_URI for production builds.');
  }

  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    throw new Error(
      `Invalid SpacetimeDB URI "${uri}". Use an absolute URL such as https://your-spacetimedb-service.onrender.com (see packages/examples/.env.production.example).`,
    );
  }

  if (u.hostname === LEGACY_DECIMAL_IPV4_FROM_SINGLE_NUMBER) {
    throw new Error(
      `Invalid SpacetimeDB URI "${uri}". Values like ws://10000 are parsed as host ${LEGACY_DECIMAL_IPV4_FROM_SINGLE_NUMBER} by the URL standard. Set VITE_STDB_URI to the public https://… origin of your SpacetimeDB service (e.g. https://your-api.onrender.com), not Render's internal PORT.`,
    );
  }

  if (/^\d+$/.test(u.hostname)) {
    throw new Error(
      `Invalid SpacetimeDB URI "${uri}". Hostname "${u.hostname}" looks like a port number. Use https://hostname (for Render, the public service URL; you usually do not put :10000 in the client URI).`,
    );
  }

  if (u.protocol === 'https:') {
    u.protocol = 'wss:';
    return u.toString();
  }

  if (u.protocol === 'http:') {
    u.protocol = 'ws:';
  }

  if (u.protocol === 'ws:' && isBrowserHttps() && !isLocalWebsocketHost(u.hostname)) {
    u.protocol = 'wss:';
  }

  return u.toString();
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
