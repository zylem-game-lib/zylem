#!/usr/bin/env sh
# Usage: . scripts/load-env.sh   (sourced; loads .env if present)
#
# Tolerantly loads the repo .env into the environment. The repo .env uses a
# `KEY = "value"` style (spaces around `=`, quoted values) that plain POSIX
# `. ./.env` cannot source, so we normalize each assignment on read (strip the
# surrounding whitespace) before sourcing. The file itself is left untouched.
if [ -f .env ]; then
  set -a
  . /dev/stdin <<EOF
$(sed -E 's/^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=[[:space:]]*/\1=/' .env)
EOF
  set +a
fi
