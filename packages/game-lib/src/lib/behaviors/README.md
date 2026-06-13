# behaviors

The **behaviors** subsystem is a thin integration layer between `@zylem/game-lib` and the `@zylem/behaviors` package. Behaviors are pre-built, reusable gameplay mechanics (e.g. `WorldBoundary2DBehavior`, `ScreenWrap`, `Jumper2D`) that can be attached to any entity via `entity.use(Behavior, options)`.

## Files

| File | Role |
|---|---|
| `behavior-descriptor.ts` | Re-exports `@zylem/behaviors/core` — the `BehaviorDescriptor` type and utilities |
| `behavior-system.ts` | Re-exports `@zylem/behaviors/core` — the `BehaviorSystem` class used internally by entities |
| `index.ts` | Public barrel for this directory; re-exports both of the above |
| `new-behaviors.md` | Developer notes on adding new behaviors to the `@zylem/behaviors` package |
| `use-behavior.ts` | Internal helper that resolves a behavior descriptor and wires it to an entity |

## How it fits in

Behaviors are the primary extension point for gameplay logic that is common across many games. Rather than copying velocity-clamp or boundary-detection code into every `onUpdate`, developers attach a behavior once:

```ts
import { WorldBoundary2DBehavior } from '@zylem/game-lib/behavior';

sphere.use(WorldBoundary2DBehavior, {
  boundaries: { top: 3, bottom: -3, left: -6, right: 6 },
});
```

Under the hood, `entity.use()` calls into `BehaviorSystem` (defined in `@zylem/behaviors`) which registers the behavior's `setup`, `update`, and `destroy` hooks alongside the entity's own lifecycle.

## Where behaviors live

The actual behavior implementations (e.g. `WorldBoundary2DBehavior`, `ScreenWrapBehavior`, `PlatformerBehavior`) are in the separate `@zylem/behaviors` workspace package. This directory only contains the glue code that connects those behaviors to the game-lib entity model.
