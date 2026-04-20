import type { Identity } from 'spacetimedb';
import type { ErrorContext } from '../../../spacetimedb-generated';
import { DbConnection } from '../../../spacetimedb-generated';

/** Published database name (see `packages/server` `publish:local`). */
export const ARENA_MODULE_NAME = 'zylem-entity-transforms-v2';

/**
 * WebSocket base URL for SpacetimeDB (see SpacetimeDB TS SDK: use `ws://` / `wss://`).
 * - **Dev:** defaults to `ws://127.0.0.1:3000`.
 * - **Production:** set `VITE_STDB_URI` to the public HTTPS origin (e.g. another Render service), or omit it when the examples app and SpacetimeDB share the same origin (Docker nginx image) so `window.location.origin` is used.
 * See `packages/server/README.md` (Render deploy) and `packages/examples/.env.production.example`.
 */
export function getArenaSpacetimeUri(): string {
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

function getBrowserLocationOrigin(): string | null {
  if (typeof globalThis === 'undefined' || !('location' in globalThis)) {
    return null;
  }
  return (globalThis as { location?: { origin?: string } }).location?.origin ?? null;
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

function isSameOriginBrowserUri(uri: string): boolean {
  const browserOrigin = getBrowserLocationOrigin();
  if (!browserOrigin) {
    return false;
  }

  try {
    return new URL(uri).origin === browserOrigin;
  } catch {
    return false;
  }
}

function looksLikeViteHtmlFallback(contentType: string | null, body: string): boolean {
  if (!contentType?.includes('text/html')) {
    return false;
  }
  return body.includes('/@vite/client') || body.includes('/src/index.tsx');
}

function asErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

function toHttpProbeUrl(uri: string, path: string): URL {
  const url = new URL(path, uri);
  if (url.protocol === 'wss:') {
    url.protocol = 'https:';
  } else if (url.protocol === 'ws:') {
    url.protocol = 'http:';
  }
  return url;
}

/**
 * Same-origin deploys are expected to serve `/v1/*` from the current origin.
 * When Render is accidentally serving the Vite dev server instead of the Docker/nginx
 * scaffold, `/v1/ping` often falls back to index.html. Catch that before opening the WS.
 */
export async function preflightArenaSpacetimeUri(uri = getArenaSpacetimeUri()): Promise<void> {
  if (typeof fetch !== 'function' || !isSameOriginBrowserUri(uri)) {
    return;
  }

  const pingUrl = toHttpProbeUrl(uri, '/v1/ping');

  let response: Response;
  try {
    response = await fetch(pingUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'text/plain, application/json, text/html',
      },
    });
  } catch (error) {
    throw new Error(
      `Could not reach ${pingUrl.origin} before opening the SpacetimeDB websocket: ${asErrorMessage(error)}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `SpacetimeDB preflight failed at ${pingUrl} (${response.status} ${response.statusText}).`,
    );
  }

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('text/html')) {
    return;
  }

  const body = await response.text();
  if (looksLikeViteHtmlFallback(contentType, body)) {
    throw new Error(
      `SpacetimeDB preflight hit Vite HTML at ${pingUrl}. This host is serving the examples app instead of the /v1 API. Deploy the Docker/nginx + SpacetimeDB service from render.yaml, or point VITE_STDB_URI at the public SpacetimeDB service origin rather than the frontend host.`,
    );
  }

  throw new Error(
    `SpacetimeDB preflight at ${pingUrl} returned HTML instead of API output. Check that /v1/* is reverse-proxied to SpacetimeDB.`,
  );
}

export type ArenaDbConnection = InstanceType<typeof DbConnection>;

/**
 * Connect to the published module and return a typed {@link DbConnection}.
 * Callers should register `db.*` callbacks, then `subscriptionBuilder()…subscribeToAllTables()`.
 */
export function connectArenaModule(
  options: {
    onConnect?: (conn: ArenaDbConnection, identity: Identity, token: string) => void;
    onConnectError?: (ctx: ErrorContext, error: Error) => void;
    onDisconnect?: (ctx: ErrorContext, error?: Error) => void;
  } = {},
): ArenaDbConnection {
  const builder = DbConnection.builder()
    .withUri(getArenaSpacetimeUri())
    .withDatabaseName(ARENA_MODULE_NAME);

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
