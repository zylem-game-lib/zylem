# --- Stage 1: build @zylem/examples (Vite SPA) for nginx static hosting ---
FROM node:22-bookworm-slim AS examples-builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y --no-modify-path --default-toolchain stable \
  && /root/.cargo/bin/rustup target add wasm32-unknown-unknown

ENV PATH="/root/.cargo/bin:${PATH}"

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile \
  && pnpm --filter "@zylem/runtime" run build:wasm \
  && pnpm --filter "@zylem/styles" run build \
  && pnpm --filter "@zylem/game-lib" run build \
  && pnpm --filter "@zylem/editor" run build \
  && pnpm --filter "@zylem/examples" run build

# --- Stage 2: SpacetimeDB + nginx (proxies /v1/* to loopback, serves SPA on /) ---
FROM node:22-bookworm-slim

ARG SPACETIMEDB_VERSION=2.1.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates curl nginx \
  && rm -rf /var/lib/apt/lists/* \
  && rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf

RUN curl -sSf https://install.spacetimedb.com | sh -s -- --root-dir /opt/spacetimedb -y \
  && /opt/spacetimedb/spacetime version install "${SPACETIMEDB_VERSION}" --use -y

ENV PATH="/opt/spacetimedb:/opt/spacetimedb/bin/current:${PATH}"

WORKDIR /app

COPY packages/server/spacetimedb/package.json /app/spacetimedb/package.json

RUN cd /app/spacetimedb \
  && npm install --no-audit --no-fund

COPY packages/server/spacetimedb /app/spacetimedb
COPY packages/server/render /app/render

COPY --from=examples-builder /app/packages/examples/dist /var/www/examples

RUN chmod +x /app/render/entrypoint.sh \
  && spacetime build -p /app/spacetimedb

EXPOSE 10000

CMD ["/bin/bash", "/app/render/entrypoint.sh"]
