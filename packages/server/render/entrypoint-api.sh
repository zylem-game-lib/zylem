#!/usr/bin/env bash

set -Eeuo pipefail

PORT="${PORT:-10000}"
SPACETIMEDB_LISTEN_ADDR="${SPACETIMEDB_LISTEN_ADDR:-0.0.0.0:${PORT}}"
SPACETIMEDB_SERVER_URL="${SPACETIMEDB_SERVER_URL:-http://127.0.0.1:${PORT}}"
SPACETIMEDB_DATA_DIR="${SPACETIMEDB_DATA_DIR:-/var/data/spacetimedb}"
SPACETIMEDB_MODULE_PATH="${SPACETIMEDB_MODULE_PATH:-/app/spacetimedb}"
SPACETIMEDB_DATABASE_NAME="${SPACETIMEDB_DATABASE_NAME:-zylem-entity-transforms-v2}"
SPACETIMEDB_AUTO_PUBLISH="${SPACETIMEDB_AUTO_PUBLISH:-true}"
SPACETIMEDB_PUBLISH_DELETE_DATA="${SPACETIMEDB_PUBLISH_DELETE_DATA:-never}"

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
  if [[ -n "${SPACETIME_PID:-}" ]]; then
    kill "${SPACETIME_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

mkdir -p "${SPACETIMEDB_DATA_DIR}"

# See entrypoint.sh: persist CLI identity on the Render disk so publish matches DB owner.
SPACETIMEDB_XDG_CONFIG_HOME="${SPACETIMEDB_XDG_CONFIG_HOME:-/var/data/.config}"
export XDG_CONFIG_HOME="${SPACETIMEDB_XDG_CONFIG_HOME}"
mkdir -p "${XDG_CONFIG_HOME}"

echo "Starting SpacetimeDB API on ${SPACETIMEDB_LISTEN_ADDR}"
spacetime start \
  --listen-addr "${SPACETIMEDB_LISTEN_ADDR}" \
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

wait "${SPACETIME_PID}"
