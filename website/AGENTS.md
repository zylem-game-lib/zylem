# Website agent conventions

These rules apply to every page under `website/docs/` and every snippet under `website/snippets/`.

## Imports

- Samples import from subpaths, e.g. `import { createGame } from '@zylem/game-lib/core'`.
- Never import from a root `@zylem/game-lib` barrel.

## Code style

- TypeScript only.
- Follow repo [biome.json](../biome.json): tabs, single quotes, semicolons.

## Vocabulary

Define terms once in `getting-started/glossary.md`, then use them consistently:

- **game** — the `createGame` instance and its loop
- **stage** — a scene plus camera, entities, and stage config
- **entity** — a `GameEntity` built with `createSphere`, `createActor`, …
- **behavior** — attached with `entity.use(...)`; made of a descriptor, optional handle, stage-scoped system, and optional FSM
- **action** — timed or persistent helpers such as `sequence` and `moveBy`
- **perspective** — camera framing (`ThirdPersonPerspective`, `FirstPersonPerspective`, …)
- **simulation** — `@zylem/behaviors` (`createSimulation()`, behavior FSMs)
- **runtime** — `@zylem/runtime` WASM (Rapier + ECS)

Layer story is fixed: **game-lib → behaviors → runtime**, as in [packages/game-lib/README.md](../packages/game-lib/README.md).

## Page shape

1. One-paragraph "what and when"
2. A minimal working example
3. Options / variations
4. Pitfalls
5. Closing **API reference** list linking into `/docs/api/<module>/...`

Complete runnable examples live in `website/snippets/<section>/*.ts` and are type-checked. Paste them into markdown fences (the site uses `markdown.format: 'md'`). Short fragments may be inline fences. Wrap HTML-like tags such as `` `<zylem-game>` `` in backticks so they are not parsed as JSX.

## Sources of truth

- Read the listed source files before writing. Do not document `API_OUTLINE.md` methods without confirming they exist.
- Diagrams are Mermaid fences only; no PlantUML, no SVGs.

## Ownership

- A track edits only its own `website/docs/<section>/` and `website/snippets/<section>/`.
- Cross-link other sections by slug; never edit those files.
- Done means: `pnpm build:lib && pnpm --filter @zylem/website typecheck:snippets && pnpm --filter @zylem/website build` passes, and no `Work in progress` admonition remains in the owned section.
- In a shared worktree, build with `--out-dir build/<track>` to avoid clobbering.
- Commit prefix `docs:` per [COMMIT_GUIDE.md](../COMMIT_GUIDE.md).
