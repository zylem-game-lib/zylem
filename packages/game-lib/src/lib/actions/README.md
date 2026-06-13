# actions

The **actions** subsystem provides a composable, entity-scoped animation and state-change system. Actions encapsulate discrete, time-bound operations that modify an entity (movement, rotation, callbacks) without requiring boilerplate inside `onUpdate`.

## Core concepts

| Concept | Description |
|---|---|
| `Action` | Interface: `duration`, `done`, `tick()`, `reset()` |
| `BaseAction` | Abstract class with duration-in-ms → seconds bookkeeping |
| Interval action | Runs once over a fixed duration, then removes itself |
| Persistent action | Stays attached until manually cancelled (e.g. per-frame polls of input state) |

## Files

| File | Role |
|---|---|
| `action.ts` | `Action` interface and `BaseAction` base class |
| `interval-actions.ts` | `moveBy`, `moveTo`, `rotateBy`, `delay`, `callFunc` factory functions |
| `persistent-actions.ts` | `throttle`, `onPress`, `onRelease` — input-reactive persistent actions |
| `composition.ts` | `sequence`, `parallel`, `repeat`, `repeatForever` combinators |
| `global-change.ts` | `globalChange`, `variableChange` — helpers that mutate game globals |
| `capabilities/` | Low-level transform helpers (`applyTransform`, `moveable`, `rotatable`, `transformable`, `velocityIntents`) used internally by interval actions |

## How it fits in

Entities (see `../entities`) expose `entity.runAction(action)` and `entity.action(persistentAction)`. The entity's `nodeUpdate` loop calls `_tickActions` each frame, advancing all active actions and pruning completed ones. Actions integrate with the physics layer by writing to the entity's velocity-intent buffer rather than directly mutating `position`, which keeps Rapier's simulation consistent.

## Usage example

```ts
import { moveBy, sequence, delay } from '@zylem/game-lib/actions';

entity.runAction(
  sequence(
    moveBy({ x: 5, duration: 400 }),
    delay(200),
    moveBy({ x: -5, duration: 400 }),
  )
);
```
