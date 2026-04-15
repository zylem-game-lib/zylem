#!/usr/bin/env bash
# Local smoke test for the Render Docker image: SpacetimeDB + nginx + examples SPA.
# Usage (from repo root): bash scripts/verify-render-docker-image.sh
# Requires Docker. If docker is missing, exits 0 with a skip message (optional CI).
set -euo pipefail

_root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
_image="${IMAGE:-zylem-spacetimedb:local}"
_host_port="${VERIFY_PORT:-10000}"
_db_name="${SPACETIMEDB_DATABASE_NAME:-zylem-entity-transforms-v2}"
_name="zylem-render-verify-$$"

if ! command -v docker >/dev/null 2>&1; then
	echo "verify-render-docker-image: docker not found; skipping (install Docker to run this check locally)."
	exit 0
fi

cleanup() {
	docker rm -f "${_name}" 2>/dev/null || true
}

trap cleanup EXIT

echo "Building ${_image} ..."
docker build -f "${_root_dir}/packages/server/render/Dockerfile" -t "${_image}" "${_root_dir}"

echo "Starting container ${_name} (host http://127.0.0.1:${_host_port}) ..."
docker run --rm -d --name "${_name}" \
	-p "${_host_port}:10000" \
	-e PORT=10000 \
	-e SPACETIMEDB_DATABASE_NAME="${_db_name}" \
	-e SPACETIMEDB_DATA_DIR=/tmp/spacetimedb-verify \
	"${_image}"

_ready=0
for _ in $(seq 1 120); do
	if curl -fsS "http://127.0.0.1:${_host_port}/healthz" >/dev/null 2>&1; then
		_ready=1
		break
	fi
	sleep 1
done

if [[ "${_ready}" -ne 1 ]]; then
	echo "verify-render-docker-image: /healthz did not become ready in time" >&2
	docker logs "${_name}" >&2 || true
	exit 1
fi

echo "verify-render-docker-image: GET /healthz ok"

_html="$(curl -fsS "http://127.0.0.1:${_host_port}/")"
if ! printf '%s' "${_html}" | grep -qi '<!DOCTYPE html\|<html'; then
	echo "verify-render-docker-image: GET / did not return HTML" >&2
	exit 1
fi

echo "verify-render-docker-image: GET / (examples SPA) ok"

curl -fsS "http://127.0.0.1:${_host_port}/v1/ping" >/dev/null
echo "verify-render-docker-image: GET /v1/ping ok"

_db_identity="$(curl -fsS "http://127.0.0.1:${_host_port}/v1/database/${_db_name}/identity")"
if ! printf '%s' "${_db_identity}" | grep -Eq '^[0-9a-fA-F]{16,}$'; then
	echo "verify-render-docker-image: GET /v1/database/${_db_name}/identity did not return a hex identity" >&2
	echo "response: ${_db_identity}" >&2
	exit 1
fi

echo "verify-render-docker-image: GET /v1/database/${_db_name}/identity ok"

node --input-type=module - "${_host_port}" "${_db_name}" <<'NODE'
const hostPort = process.argv[2];
const dbName = process.argv[3];
const wsUrl = `ws://127.0.0.1:${hostPort}/v1/database/${dbName}/subscribe`;
const ws = new WebSocket(wsUrl, 'v1.json.spacetimedb');

const timeout = setTimeout(() => {
	console.error(`verify-render-docker-image: WebSocket subscribe timed out (${wsUrl})`);
	process.exit(1);
}, 5000);

ws.addEventListener('open', () => {
	clearTimeout(timeout);
	ws.close(1000, 'verify-render-docker-image');
	console.log(`verify-render-docker-image: WebSocket subscribe ok (${wsUrl})`);
	process.exit(0);
});

ws.addEventListener('error', event => {
	clearTimeout(timeout);
	const cause =
		event?.error instanceof Error ? event.error.message : 'unknown WebSocket error';
	console.error(`verify-render-docker-image: WebSocket subscribe failed (${wsUrl}): ${cause}`);
	process.exit(1);
});
NODE

echo "verify-render-docker-image: all checks passed."
