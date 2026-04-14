#!/usr/bin/env bash
set -euo pipefail

_pkg_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
_default_listen_addr="${SPACETIME_SERVER_LISTEN_ADDR:-127.0.0.1:3000}"
_default_data_dir="${SPACETIME_SERVER_DATA_DIR:-${_pkg_root}/.data/spacetimedb}"

if [[ "${1:-}" == "--" ]]; then
  shift
fi

_has_listen_addr=0
_has_data_dir=0
_has_in_memory=0

for _arg in "$@"; do
  case "${_arg}" in
    -l|--listen-addr|--listen-addr=*)
      _has_listen_addr=1
      ;;
    --data-dir|--data-dir=*)
      _has_data_dir=1
      ;;
    --in-memory)
      _has_in_memory=1
      ;;
  esac
done

_cmd=(sh "${_pkg_root}/scripts/run-spacetimedb-cli.sh" start)

if [[ "${_has_listen_addr}" -eq 0 ]]; then
  _cmd+=(--listen-addr "${_default_listen_addr}")
fi

if [[ "${_has_data_dir}" -eq 0 && "${_has_in_memory}" -eq 0 ]]; then
  mkdir -p "${_default_data_dir}"
  _cmd+=(--data-dir "${_default_data_dir}")
fi

_cmd+=("$@")

exec "${_cmd[@]}"
