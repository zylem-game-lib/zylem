#!/usr/bin/env bash

set -Eeuo pipefail

PORT="${PORT:-10000}"
SPACETIMEDB_HTTP_ADDR="${SPACETIMEDB_HTTP_ADDR:-127.0.0.1:3000}"
SPACETIMEDB_DATA_DIR="${SPACETIMEDB_DATA_DIR:-/var/data/spacetimedb}"
SPACETIMEDB_MODULE_PATH="${SPACETIMEDB_MODULE_PATH:-/app/spacetimedb}"
SPACETIMEDB_DATABASE_NAME="${SPACETIMEDB_DATABASE_NAME:-zylem-entity-transforms-v2}"
SPACETIMEDB_AUTO_PUBLISH="${SPACETIMEDB_AUTO_PUBLISH:-true}"
SPACETIMEDB_PUBLISH_DELETE_DATA="${SPACETIMEDB_PUBLISH_DELETE_DATA:-never}"
# When true, wipe SPACETIMEDB_DATA_DIR before starting SpacetimeDB. This truly resets
# DB state — including ownership — so the caller identity always creates a fresh DB.
# Use when the DB is meant to be ephemeral (demos, staging). Publish-level --delete-data
# still requires ownership; wiping the data dir bypasses the pre-publish 403 entirely.
SPACETIMEDB_RESET_DATA_ON_BOOT="${SPACETIMEDB_RESET_DATA_ON_BOOT:-false}"
SPACETIMEDB_SERVER_URL="http://${SPACETIMEDB_HTTP_ADDR}"

is_truthy() {
  case "${1:-}" in
    "1" | true | yes | always | on | on-conflict) return 0 ;;
    *) return 1 ;;
  esac
}

append_publish_delete_data_arg() {
  case "${SPACETIMEDB_PUBLISH_DELETE_DATA}" in
    "" | "0" | false | no | never)
      ;;
    "1" | true | yes | always | on-conflict)
      publish_args+=(--delete-data)
      ;;
    *)
      echo "Unsupported SPACETIMEDB_PUBLISH_DELETE_DATA=${SPACETIMEDB_PUBLISH_DELETE_DATA}; use never, true, or on-conflict" >&2
      exit 1
      ;;
  esac
}

cleanup() {
  if [[ -n "${NGINX_PID:-}" ]]; then
    kill "${NGINX_PID}" 2>/dev/null || true
  fi
  if [[ -n "${SPACETIME_PID:-}" ]]; then
    kill "${SPACETIME_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

if is_truthy "${SPACETIMEDB_RESET_DATA_ON_BOOT}"; then
  echo "SPACETIMEDB_RESET_DATA_ON_BOOT=${SPACETIMEDB_RESET_DATA_ON_BOOT}: wiping ${SPACETIMEDB_DATA_DIR}"
  rm -rf "${SPACETIMEDB_DATA_DIR}"
fi
mkdir -p "${SPACETIMEDB_DATA_DIR}"

sed \
  -e "s|\${PORT}|${PORT}|g" \
  -e "s|\${SPACETIMEDB_HTTP_ADDR}|${SPACETIMEDB_HTTP_ADDR}|g" \
  /app/render/nginx.conf.template > /etc/nginx/conf.d/spacetimedb.conf

echo "Starting SpacetimeDB on ${SPACETIMEDB_HTTP_ADDR}"
spacetime start \
  --listen-addr "${SPACETIMEDB_HTTP_ADDR}" \
  --data-dir "${SPACETIMEDB_DATA_DIR}" \
  --non-interactive &
SPACETIME_PID=$!

ready=false
for _ in $(seq 1 60); do
  if spacetime server ping "${SPACETIMEDB_SERVER_URL}" >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 1
done

if [[ "${ready}" != "true" ]]; then
  echo "SpacetimeDB did not become ready in time" >&2
  exit 1
fi

if [[ "${SPACETIMEDB_AUTO_PUBLISH}" == "true" ]]; then
  publish_args=(
    publish
    "${SPACETIMEDB_DATABASE_NAME}"
    -s "${SPACETIMEDB_SERVER_URL}"
    -p "${SPACETIMEDB_MODULE_PATH}"
    -y
  )
  append_publish_delete_data_arg

  echo "Publishing ${SPACETIMEDB_DATABASE_NAME} from ${SPACETIMEDB_MODULE_PATH}"
  spacetime "${publish_args[@]}"
fi

echo "Starting nginx on port ${PORT}"
nginx -g 'daemon off;' &
NGINX_PID=$!

wait -n "${SPACETIME_PID}" "${NGINX_PID}"
exit $?
