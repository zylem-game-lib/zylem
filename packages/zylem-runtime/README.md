# Zylem Runtime

`zylem-runtime` is the first Rust-based runtime package in the Zylem monorepo.

This initial scaffold is intentionally small:

- a native Rust crate that builds and tests today
- a tiny ECS-style world with entities, position, velocity, and a fixed-step update
- a minimal C ABI export surface that can compile to `wasm32-unknown-unknown`

## Why this exists

The current TypeScript engine is still the source of truth for authoring,
rendering, and most runtime orchestration. This package is a safe place to
start moving simulation-oriented logic into Rust without forcing a full engine
rewrite up front.

## Commands

From the repo root:

```bash
pnpm --filter @zylem/runtime build
pnpm --filter @zylem/runtime test
pnpm --filter @zylem/runtime typecheck
```

## Wasm build

The package is configured as both an `rlib` and a `cdylib`, so it is ready for
wasm compilation once the Rust target is installed.

Install the target once:

```bash
rustup target add wasm32-unknown-unknown
```

Then build:

```bash
pnpm --filter @zylem/runtime build:wasm
```

## Next steps

- add more ECS storage primitives beyond the demo position/velocity model
- define a stable host/runtime boundary for JavaScript integration
- introduce command buffers instead of per-entity host calls
- benchmark hot-path systems before widening the porting effort
