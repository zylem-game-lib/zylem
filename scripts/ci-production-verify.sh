#!/usr/bin/env bash
# Run typecheck, lint, and production build (CI / one-shot).
set -euo pipefail

_root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${_root_dir}"

pnpm run typecheck
pnpm run lint
pnpm run build:production
