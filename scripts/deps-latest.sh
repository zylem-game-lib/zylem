#!/usr/bin/env sh
# Move every package.json in the pnpm workspace (root + packages/*) to the newest
# published dependency versions, patch-level by default.
#
#   pnpm deps:latest                  # write: bump manifests, then pnpm install
#   pnpm deps:latest --check          # verify only: exit 1 if anything is behind
#   pnpm deps:latest --target minor   # widen: patch (default) | minor | latest
#   pnpm deps:latest --include-zylem  # also touch @zylem/* pins (zw owns these)
#
# Also the body of two zw hooks (see README "Hooking into zw"):
#   zw:postunlink -> write mode, right after zw restored published versions
#   zw:prerelease -> --check, must not dirty the tree, fails the walk if stale
#
# @zylem/* is excluded unless asked for: zw retargets those pins itself
# (`zw update --to latest`, release-walk retargeting), and a patch-only bump here
# could undo an intentional exact pin. `workspace:` specifiers are never touched
# by ncu. `pnpm-workspace.yaml` overrides are not rewritten either, so a pinned
# override (three, @types/three) keeps winning.
#
# Exit codes: write mode exits 0 even when the registry is unreachable (a
# `zw run` offline must still start dev processes); --check fails hard.
set -eu

_root_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "${_root_dir}"

target="patch"
check=0
include_zylem=0

while [ $# -gt 0 ]; do
  case "$1" in
    --check) check=1 ;;
    --include-zylem) include_zylem=1 ;;
    --target)
      shift
      target="${1:-}"
      ;;
    --target=*) target="${1#--target=}" ;;
    -h|--help)
      sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "deps-latest: unknown argument '$1'" >&2
      exit 2
      ;;
  esac
  shift
done

case "$target" in
  patch|minor|latest) ;;
  *)
    echo "deps-latest: --target must be patch, minor or latest (got '$target')" >&2
    exit 2
    ;;
esac

prefix="deps-latest"
if [ -n "${ZW_HOOK:-}" ]; then
  prefix="deps-latest (${ZW_HOOK} ${ZW_PACKAGE:-})"
fi

set -- --workspaces --root --target "$target"
if [ "$include_zylem" -eq 0 ]; then
  set -- "$@" --reject '@zylem/*'
fi

if [ "$check" -eq 1 ]; then
  echo "${prefix}: checking dependencies against ${target} releases"
  # errorLevel 2: exit 1 when any dependency could be upgraded.
  if pnpm exec ncu "$@" --errorLevel 2; then
    echo "${prefix}: all dependencies are at their newest ${target} release"
    exit 0
  fi
  echo "${prefix}: dependencies are behind; run 'pnpm deps:latest' and commit the result" >&2
  exit 1
fi

echo "${prefix}: upgrading dependencies to newest ${target} releases"
if ! pnpm exec ncu "$@" --upgrade; then
  echo "${prefix}: could not query the registry; leaving manifests unchanged" >&2
  exit 0
fi

# Only reinstall when a manifest actually moved, so the lockfile and
# node_modules follow the bumps and a no-op run stays a no-op.
if git diff --quiet -- package.json 'packages/*/package.json'; then
  echo "${prefix}: nothing to update"
  exit 0
fi

# `lowest-direct` makes each re-resolved direct dependency land on the floor of
# its new range, i.e. exactly the version ncu chose. Plain `pnpm install` would
# resolve a caret range to the newest minor and the lockfile would jump further
# than the manifest asked for. Specifiers that did not change keep their
# existing lockfile entry either way.
echo "${prefix}: manifests changed, running pnpm install"
pnpm install --config.resolution-mode=lowest-direct
echo "${prefix}: done; review and commit package.json + pnpm-lock.yaml"
