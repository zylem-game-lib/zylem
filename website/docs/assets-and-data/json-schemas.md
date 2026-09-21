---
title: JSON schemas
description: TypeBox sources and published schema exports
sidebar_position: 2
---

Zylem config that crosses the wire—entities, stages, game and stage config, input, songs, cutscenes—is described with [TypeBox](https://github.com/sinclairzx81/typebox) schemas in `@zylem/game-lib/schema`. On build, `scripts/emit-json-schemas.ts` writes plain JSON Schema Draft 07 files to `dist/schema/*.schema.json` for editors, Monaco, and external validators.

## Importing in TypeScript

```typescript
import {
  EntityJsonSchema,
  GameConfigJsonSchema,
  SongDefinitionSchema,
  CutsceneDefinitionSchema,
} from '@zylem/game-lib/schema';
```

Runtime blueprints use slightly looser shapes (`EntitySchema`, `StageSchema`) with open `data` records; editor-oriented unions (`EntityJsonSchema`, `StageJsonSchema`) discriminate known entity types (`text`, `sprite`, `line`) for validation and autocomplete.

Types re-exported from the same module include `EntityBlueprint`, `StageBlueprint`, `GameConfigJson`, `StageConfigJson`, `GameInputConfigJson`, and entity data helpers.

## Published JSON Schema files

After `pnpm build` in `@zylem/game-lib`, import static JSON from package subpaths:

| Export subpath | File | Source schema |
| --- | --- | --- |
| `@zylem/game-lib/schema/entity` | `entity.schema.json` | `EntityJsonSchema` |
| `@zylem/game-lib/schema/stage` | `stage.schema.json` | `StageJsonSchema` |
| `@zylem/game-lib/schema/game-config` | `game-config.schema.json` | `GameConfigJsonSchema` |
| `@zylem/game-lib/schema/stage-config` | `stage-config.schema.json` | `StageConfigJsonSchema` |
| `@zylem/game-lib/schema/input-config` | `input-config.schema.json` | `GameInputConfigSchema` |
| `@zylem/game-lib/schema/song` | `song.schema.json` | `SongDefinitionSchema` |
| `@zylem/game-lib/schema/cutscene` | `cutscene.schema.json` | `CutsceneDefinitionSchema` |

Example in a Vite or bundler project:

```typescript
import entitySchema from '@zylem/game-lib/schema/entity';
```

Use these in `$schema` URLs, AJV, or IDE YAML/JSON language services.

## Schema modules covered

Beyond blueprints, the package exports schemas for:

- **Input** — keyboard/mouse mappings, virtual touch layouts, player bindings
- **Stage config** — colors, gravity, GLTF loader options, asset loader config
- **Game config** — resolution, device profiles, fullscreen, debug flags

Song and cutscene schemas are duplicated from `@zylem/game-lib/audio` and `@zylem/game-lib/cinematics` so one import path covers all serialized documents.

## Emit pipeline

The emit script imports compiled schemas from `dist/schema.js` (built by tsup), strips TypeBox symbols, adds `$schema`, and writes one file per document. Run via `pnpm schema:emit` inside `packages/game-lib` (also part of the library `build` script).

## Pitfalls

- **Build order** — JSON files exist only after game-lib build; TypeScript types come from `dist/schema.d.ts`.
- **Runtime vs editor entity shape** — prefer `EntityJsonSchema` for saved files; `EntitySchema` for factory spreading at runtime.
- **Validation only** — schemas do not load assets or spawn entities; pair with [blueprints](./blueprints-and-serialization.md) and stage factories.

## API reference

- [`@zylem/game-lib/schema`](/docs/api/schema/) module index
- [`EntityJsonSchema`](/docs/api/schema/variables/EntityJsonSchema), [`GameConfigJsonSchema`](/docs/api/schema/variables/GameConfigJsonSchema)
