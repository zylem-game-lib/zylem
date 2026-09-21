---
title: Lookup and destroy
description: Names, type symbols, cloning, and teardown
sidebar_position: 10
---

Every entity can carry a **name** for editor selection and runtime lookup. The handle from [createStage](/docs/api/core/functions/createStage) exposes `getEntityByName(name, typeSymbol?)`, which returns the live instance on the loaded stage, optionally narrowed with a **type symbol** such as [TEXT_TYPE](/docs/api/entity/variables/TEXT_TYPE). When an entity should leave the simulation, call [destroy](/docs/api/entity/functions/destroy) so lifecycle hooks and GPU resources run in the correct order.

## Minimal example

`website/snippets/entities/lookup-and-destroy.ts`:

```typescript
import { createGame, createStage, stageConfig } from '@zylem/game-lib/core';
import { createSphere, createText, destroy, TEXT_TYPE } from '@zylem/game-lib/entity';

const enemy = createSphere({ name: 'enemy' });
const status = createText({ name: 'status', text: 'Enemy alive' });
const mainStage = createStage(stageConfig(), enemy, status);

mainStage.onSetup(({ stage }) => {
  const label = stage.getEntityByName('status', TEXT_TYPE);
  label?.updateText('Enemy spawned');
});

mainStage.onUpdate(({ stage, globals }) => {
  const target = stage.getEntityByName('enemy');
  if (target) destroy(target, globals);
});
```

Pass `globals` from an update or setup callback when you call `destroy` outside a hook; the helper falls back to the active game globals when omitted.

## Typed lookup

Export type symbols from `@zylem/game-lib/entity` map to classes through [EntityTypeMap](/docs/api/entity/interfaces/EntityTypeMap):

```typescript
import { TEXT_TYPE, SPRITE_TYPE, BOX_TYPE } from '@zylem/game-lib/entity';

const label = stage.getEntityByName('score', TEXT_TYPE);
const ship = stage.getEntityByName('player-ship', SPRITE_TYPE);
```

When the type symbol is omitted, lookup returns a generic node type. When provided, TypeScript narrows the result to the matching entry in [EntityTypeMap](/docs/api/entity/interfaces/EntityTypeMap).

Symbols cover sprites, primitives, actors, zones, particles, lights, fog, lines, and other exported factories—see the map in the API reference.

## Cloning and factories

Official factories register clone support:

- [clone(overrides?)](/docs/api/entity/interfaces/GameEntity#clone) duplicates mesh, material, and behavior wiring.
- [createEntityFactory](/docs/api/entity/functions/createEntityFactory) builds many instances from one template entity ([TemplateFactory](/docs/api/entity/interfaces/TemplateFactory)).

Use factories for wave spawns; use `clone` for one-off duplicates with tweaked `name` or `position`.

## Destroy pipeline

[destroy](/docs/api/entity/functions/destroy) delegates to the entity’s internal `nodeDestroy`:

1. Child entities destroy first.
2. **onDestroy** callbacks run (game logic).
3. The node marks itself removed.
4. **onCleanup** callbacks and engine disposal run (textures, behaviors, physics registration).

Avoid calling `destroy` twice on the same entity; the node guards re-entry but your callbacks should still treat removal as idempotent.

## Variations

- Prefer names stable across saves (`'player'`, `'boss-gate'`) for cinematics and [cutscene hosts](/docs/cinematics/playing-cutscenes) that resolve entities by string.
- Use [onCollision](/docs/api/entity/interfaces/GameEntity#oncollision) on gameplay entities to call `destroy` on the other body when projectiles hit.
- Editor-placed entities often receive names from blueprint ids ([Blueprints](/docs/assets-and-data/blueprints-and-serialization)).

## Pitfalls

- **Stage scope** — lookup searches the **current** stage only; after a stage transition, refresh cached references in `onSetup` for the new stage.
- **Missing names** — duplicate names make lookup ambiguous; treat names as unique per stage.
- **Destroy timing** — do not destroy the entity whose `onUpdate` is currently running unless you exit the callback immediately after; defer removal to the end of the frame if you hit re-entrancy issues during collision handling.

## API reference

- [destroy](/docs/api/entity/functions/destroy)
- [EntityTypeMap](/docs/api/entity/interfaces/EntityTypeMap) · [EntityForType](/docs/api/entity/type-aliases/EntityForType)
- [createEntityFactory](/docs/api/entity/functions/createEntityFactory) · [TemplateFactory](/docs/api/entity/interfaces/TemplateFactory)
- Type symbols: [TEXT_TYPE](/docs/api/entity/variables/TEXT_TYPE), [SPRITE_TYPE](/docs/api/entity/variables/SPRITE_TYPE), [BOX_TYPE](/docs/api/entity/variables/BOX_TYPE), [ACTOR_TYPE](/docs/api/entity/variables/ACTOR_TYPE), [ZONE_TYPE](/docs/api/entity/variables/ZONE_TYPE)
