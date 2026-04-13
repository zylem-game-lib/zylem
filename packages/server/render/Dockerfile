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

RUN chmod +x /app/render/entrypoint.sh \
  && spacetime build -p /app/spacetimedb

EXPOSE 10000

CMD ["/bin/bash", "/app/render/entrypoint.sh"]
