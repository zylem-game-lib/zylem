---
title: Blueprints and serialization
description: EntityBlueprint, StageBlueprint, persistence, and hydration
sidebar_position: 3
---

Blueprints are data-only descriptions of stages and entities—what gets saved, synced, and rehydrated into live `Stage` instances. They sit between editor JSON and runtime factories.

## Runtime blueprint shape

**EntityBlueprint** (`EntitySchema`):

- `id` — stable entity id (becomes entity `name` when spawned)
- `type` — factory key (for example `sphere`, `box`, custom registered types)
- optional `position` — `[x, y]` tuple
- optional `data` — open record merged into factory options

**StageBlueprint** (`StageSchema`):

- `id`, optional `name`
- `entities` — array of entity blueprints
- optional `assets` — URL list for preloading or editor hints

Types: `EntityBlueprint`, `StageBlueprint` from `@zylem/game-lib/schema` or `@zylem/game-lib/core` (re-export).

## Editor JSON vs runtime

| Schema | Purpose |
| --- | --- |
| `EntityJsonSchema` / `StageJsonSchema` | Discriminated unions for Monaco and published JSON Schema |
| `EntitySchema` / `StageSchema` | Runtime persistence with flexible `data` |

Specialized data schemas exist for `text`, `sprite`, and `line` entity payloads (`TextEntityDataSchema`, etc.).

## Hydration

`StageFactory.createFromBlueprint` (internal to game-lib) creates a `Stage`, then for each entity blueprint calls `EntityFactory.createFromBlueprint`, which:

1. Looks up a creator by `type`
2. Spreads `data` into factory options
3. Maps `position` tuple to `{ x, y, z: 0 }`
4. Sets `name` from blueprint `id`

Games load blueprints through `Game` / `ZylemGame` when navigating stages or restoring saves.

## StageManager persistence

`StageManager` keeps a reactive window (`previous`, `current`, `next`) of `StageBlueprint` objects:

- **IndexedDB** — msgpack-encoded saves keyed by stage id
- **Static registry** — `registerStaticStage(id, blueprint)` for bundled levels
- **Transitions** — forward/back navigation preloads upcoming blueprints

`stageState` (valtio proxy) exposes the current blueprint for UI or tooling.

## Registering a static level

```typescript
import { StageManager, type StageBlueprint } from '@zylem/game-lib/core';

const hub: StageBlueprint = {
  id: 'hub',
  name: 'Hub',
  entities: [
    { id: 'portal', type: 'zone', position: [4, 0], data: { width: 2, height: 2 } },
  ],
};

StageManager.registerStaticStage('hub', hub);
```

Pair with [asset loading](./asset-loading.md) when `assets` lists models or textures entities reference.

## Pitfalls

- **Unknown `type`** — factory throws; register custom types before hydration.
- **2D positions** — blueprint positions are `[x, y]`; z defaults to 0 at spawn.
- **Do not confuse with game blueprint** — `game-blueprint.ts` configures `createGame` options; stage blueprints describe scene content.

## API reference

- [`EntityBlueprint`](/docs/api/schema/type-aliases/EntityBlueprint), [`StageBlueprint`](/docs/api/core/type-aliases/StageBlueprint)
- [`EntitySchema`](/docs/api/schema/variables/EntitySchema), [`StageSchema`](/docs/api/schema/variables/StageSchema)
- [`StageManager`](/docs/api/core/variables/StageManager), [`stageState`](/docs/api/core/variables/stageState)
