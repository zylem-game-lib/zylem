---
title: Reactive changes
description: globalChange and variableChange helpers
sidebar_position: 6
---

`globalChange`, `globalChanges`, `variableChange`, and `variableChanges` return `onUpdate` callbacks that fire when watched values change. They complement game-level subscriptions (`onGlobalChange` on the **game** instance) by keeping reactive logic next to entity update code.

Import them from `@zylem/game-lib/globals`, not from the actions module.

## Minimal example

Runnable sample: `website/snippets/actions/reactive-changes.ts`.

```ts
import { setGlobal, globalChange, globalChanges } from '@zylem/game-lib/globals';

marker.onUpdate(
	globalChange<number>('score', (value) => {
		scoreLabel.updateText(`Score: ${value ?? 0}`);
	}),
	globalChanges<number>(['score', 'highScore'], ([score, highScore]) => {
		marker.setPositionY(score === highScore ? 0.5 : 0);
	}),
);
```

Pass multiple callbacks to a single `onUpdate(...)` call; each runs every frame but only invokes your handler when its watched keys change.

## Globals vs stage variables

| Helper | Watches | Typical source |
| --- | --- | --- |
| `globalChange(key, fn)` | `ctx.globals[key]` | `setGlobal` / game config globals |
| `globalChanges(keys, fn)` | Several global keys | Multiplayer scores, shared flags |
| `variableChange(key, fn)` | `ctx.stage?.getVariable?.(key)` | Stage-scoped reactive variables |
| `variableChanges(keys, fn)` | Multiple stage variables | HUD tied to stage state |

For imperative reads and writes to variables on a **stage** or **entity** object, use `getVariable`, `setVariable`, and `createVariable` from the same module. Stage variable helpers in `variableChange` expect the active stage on the update context to expose `getVariable`.

## Comparison with game subscriptions

- `game.onGlobalChange('score', fn)` — central, game-scoped, survives across stages.
- `entity.onUpdate(globalChange('score', fn))` — colocated with entity logic; runs in the entity update ordering.

Use whichever matches where you already manage state. See [Globals and variables](../game-and-stages/globals-and-variables.md) for the broader model.

## Pitfalls

- The first callback skips the transition from `undefined` to `undefined`; initializing globals in `onSetup` avoids a spurious first frame.
- `variableChange` depends on `ctx.stage.getVariable`; if that method is missing, callbacks never see updates—prefer `getVariable(stage, key)` in custom code when needed.
- These helpers detect **reference** changes on globals; mutate objects in place only if you replace the global entry afterward.

## API reference

- [globalChange](/docs/api/globals/functions/globalChange)
- [globalChanges](/docs/api/globals/functions/globalChanges)
- [variableChange](/docs/api/globals/functions/variableChange)
- [variableChanges](/docs/api/globals/functions/variableChanges)
- [setGlobal](/docs/api/globals/functions/setGlobal)
