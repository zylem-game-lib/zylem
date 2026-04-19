# Zylem SpacetimeDB module

TypeScript SpacetimeDB module for replicated **world transforms + player animation state**. Toolchain version: **SpacetimeDB 2.1.x** (CLI and npm `spacetimedb` package should stay on the same minor).

## Prerequisites

- [Node.js](https://nodejs.org/) 22+ (matches the monorepo engines field)
- [SpacetimeDB CLI](https://spacetimedb.com/install) (`spacetime` or `spacetimedb-cli` on your `PATH`)

Optional: install the CLI into the repo-local `.tools/` directory (ignored by git):

```sh
curl -sSf https://install.spacetimedb.com | sh -s -- --root-dir .tools/spacetimedb -y
export PATH="$PWD/.tools/spacetimedb:$PATH"
```

The package scripts resolve the CLI in this order: `SPACETIME_CLI` env var, `../../.tools/spacetimedb/bin/current/spacetimedb-cli` from this package, then `spacetime` / `spacetimedb-cli` on `PATH`. When the repo-local `.tools/spacetimedb` install exists, the scripts also add that directory to `PATH` so the bundled `spacetime` launcher is available.

## Layout

| Path | Purpose |
|------|---------|
| [spacetimedb/src/index.ts](spacetimedb/src/index.ts) | Module schema (`entity_transform`, `player`) and reducers |
| [spacetimedb/package.json](spacetimedb/package.json) | Workspace package; depends on `spacetimedb` **2.1.0** |
| [scripts/run-spacetimedb-cli.sh](scripts/run-spacetimedb-cli.sh) | CLI resolver for build / publish / generate |
| [scripts/start-spacetimedb-server.sh](scripts/start-spacetimedb-server.sh) | Local server launcher with explicit listen/data-dir defaults |

## Schema

- **`entity_transform`** (public): `entity_id` (`u64`, primary key, auto-increment), `pos_{x,y,z}`, `rot_{x,y,z,w}`, `scale_{x,y,z}` (defaults 1), `anim_key`, `anim_pause_at_end`.
- **`player`** (public): `device_id` (primary key, unique), `display_name`, `color_u32`, `entity_id` (unique), `owner_identity` (unique).

Reducers:

- **`register_player`** – upsert by `device_id`; creates a transform row on first join (server-assigned spawn ring).
- **`set_entity_transform`** – client-authoritative MVP pose update; validates `device_id`, `entity_id`, and `ctx.sender` vs `owner_identity`.

Lifecycle:

- **`client_disconnected`** – removes the player row and their `entity_transform` row.

## TypeScript client bindings

Regenerate the browser SDK bindings into `@zylem/examples` after schema changes (same CLI as publish; run from `packages/server`):

```sh
pnpm run generate:bindings
```

Output path: [../examples/src/spacetimedb-generated](../examples/src/spacetimedb-generated).

## Scripts (from `packages/server`)

```sh
pnpm run build              # spacetimedb-cli build -p spacetimedb
pnpm run generate:bindings  # emit TS client bindings to packages/examples/src/spacetimedb-generated
pnpm run start:server       # local start on 127.0.0.1:3000 with data in packages/server/.data/spacetimedb
pnpm run publish:local      # publish to local server as database zylem-entity-transforms-v2
pnpm run dev                # build then publish:local
```

For `publish:local` and `dev`, start the standalone server first (`pnpm run start:server` or `spacetime start`). The package script defaults to `127.0.0.1:3000` and stores local data in `packages/server/.data/spacetimedb`.

Override the local defaults with `SPACETIME_SERVER_LISTEN_ADDR`, `SPACETIME_SERVER_DATA_DIR`, or explicit CLI flags after `--`, for example `pnpm run start:server -- --in-memory`.

## Render deploy

**Native Node web service:** Render sets `CI=true`, so `scripts/run-spacetimedb-cli.sh` automatically installs the SpacetimeDB CLI and Rust (`wasm32-unknown-unknown`) on first build when neither `spacetime` nor `spacetimedb-cli` is on `PATH`. You can still use `pnpm run build:render` at the repo root to install the same toolchain explicitly before `pnpm build`.

`scripts/start-spacetimedb-server.sh` listens on **`0.0.0.0:$PORT`** when **`RENDER=true`** and **`PORT`** is set (Render’s default for web services). That satisfies Render’s port scan. Override with **`SPACETIME_SERVER_LISTEN_ADDR`** if you need a different bind (e.g. loopback behind another proxy).

That native path publishes SpacetimeDB itself on the service port, but it does **not** also serve the examples SPA from the same origin. The same-origin `examples + /v1/*` setup described below is the Docker scaffold.

This package now includes a Render deployment scaffold (Blueprint at repository root):

- [render.yaml](../../render.yaml) – Blueprint service definition for a `zylem-spacetimedb` Docker web service.
- [render/Dockerfile](render/Dockerfile) – Multi-stage: builds `@zylem/examples` (Vite SPA), then installs SpacetimeDB, builds the module, copies the SPA into `/var/www/examples`, and verifies the module.
- [render/entrypoint.sh](render/entrypoint.sh) – Starts SpacetimeDB on an internal port, waits for readiness, auto-publishes `zylem-entity-transforms-v2`, then starts nginx.
- [render/nginx.conf.template](render/nginx.conf.template) – Reverse-proxies `/v1/*` to SpacetimeDB; serves the examples SPA on `/` (`try_files` for client routing); `/healthz` for health checks.

The Render setup assumes:

- a **paid web service plan** (`starter` in the Blueprint), because Render persistent disks are not available on the free plan;
- a persistent disk mounted at `/var/data`, because Render's normal service filesystem is ephemeral;
- your browser clients connect to the public Render URL, while SpacetimeDB itself only binds to `127.0.0.1:3000` inside the container.

### Loopback, nginx, and browser URIs

`SPACETIMEDB_HTTP_ADDR=127.0.0.1:3000` (see [render.yaml](../../render.yaml)) is intentional: SpacetimeDB listens only on the container loopback, so nothing off-machine can reach port 3000 directly. [nginx](render/nginx.conf.template) listens on `PORT` and reverse-proxies `/v1/*` (SpacetimeDB HTTP + WebSocket API) to that loopback address. The API your **browsers** use is therefore the service’s **public HTTPS origin** (`https://<your-service>.onrender.com`), which becomes **`wss://`** for the subscribe WebSocket—**not** `http://127.0.0.1:3000` or `:3000` on the host.

For **production builds** of `@zylem/examples` deployed **separately** (e.g. Render static site pointing at this service), set **`VITE_STDB_URI`** to the SpacetimeDB public URL, e.g. `https://<your-render-service>.onrender.com`. When the examples app is **served from the same Docker image** as SpacetimeDB, you can omit `VITE_STDB_URI`; the client uses `window.location.origin` so API and UI share one origin. See [packages/examples/.env.production.example](../examples/.env.production.example).

### Import into Render

1. In Render, create or open your existing `zylem` project.
2. Add a new Blueprint or web service using the Blueprint file at the repository root: `render.yaml`.
3. Keep the included persistent disk, or increase `sizeGB` if you need more storage.
4. After the first deploy, if the examples UI is **not** baked into this Docker image, configure its build with `VITE_STDB_URI=https://<your-render-service>.onrender.com`. Same-image deploys do not require that variable (see **Loopback, nginx, and browser URIs** above).

### Verify the Docker image locally

With [Docker](https://docs.docker.com/get-docker/) installed, from the repository root:

```sh
pnpm run verify:render-docker
```

This builds [`render/Dockerfile`](render/Dockerfile), runs a short-lived container, checks `GET /healthz`, checks that `GET /` returns HTML (examples SPA), verifies proxied SpacetimeDB HTTP endpoints (`/v1/ping`, `/v1/database/<db>/identity`), and opens a WebSocket to `/v1/database/<db>/subscribe`. Set `VERIFY_PORT` if `10000` is already in use on your machine.

### Auto-publish behavior

On boot, the container publishes `zylem-entity-transforms-v2` to the local in-container SpacetimeDB instance.

- **403 Forbidden / “not authorized to … update database”:** The standalone server stores the database on the persistent disk (`SPACETIMEDB_DATA_DIR`), which is **owned** by the Spacetime **identity** that first created it. The CLI used to save its login under `/root/.config` (ephemeral), so **every new container** got a **new** identity while the **old** database still expected the **previous** owner. The entrypoints set **`XDG_CONFIG_HOME`** to **`/var/data/.config`** (override with **`SPACETIMEDB_XDG_CONFIG_HOME`**) so the same identity is reused across deploys on the Render disk. If you already hit this error **before** that fix, do **one** of: clear the Spacetime data on the disk, or set **`SPACETIMEDB_PUBLISH_DELETE_DATA=true`** for a single deploy (accepts data loss), then set it back to **`never`**.
- Default conflict mode is `never`, so breaking schema changes fail the deploy instead of deleting data.
- To pass SpacetimeDB's `--delete-data` publish flag for breaking schema deploys, set `SPACETIMEDB_PUBLISH_DELETE_DATA=true` in Render (`on-conflict` is accepted as a legacy alias).
- To disable boot-time publish entirely, set `SPACETIMEDB_AUTO_PUBLISH=false`.

## Client SDK

Browser or Node clients should depend on the same major/minor as the module, e.g. in `@zylem/examples`:

```json
"spacetimedb": "2.1.0"
```

Use `import { ... } from 'spacetimedb'` / `spacetimedb/sdk` per [Client SDK](https://spacetimedb.com/docs/clients).

## References

- [SpacetimeDB docs](https://spacetimedb.com/docs)
- [TypeScript quickstart](https://spacetimedb.com/docs/quickstarts/typescript)
