---
title: Writing a behavior
description: defineBehavior, systemFactory, and handles
sidebar_position: 4
---

Custom behaviors are descriptors created with `defineBehavior`. Each descriptor supplies default options, a `systemFactory` that builds a stage-scoped system, and optionally a `createHandle` factory for typed methods on the object returned from `entity.use(...)`. Add a new behavior when reusable logic needs entity refs, stage services (world, scene), or shared tick order—not for one-off sequences (use [actions](/docs/actions/overview) instead).

## Minimal example

`website/snippets/behaviors/writing-a-behavior.ts` shows the smallest useful descriptor:

```typescript
import { defineBehavior } from '@zylem/game-lib/behavior';
import { createSphere } from '@zylem/game-lib/entity';

const PingBehavior = defineBehavior({
  name: 'ping',
  defaultOptions: { intervalMs: 1000 },
  systemFactory: () => ({
    attach() {},
    detach() {},
    update(_world, _delta) {},
  }),
  createHandle: (ref) => ({
    getIntervalMs: () => ref.options.intervalMs,
  }),
});

const entity = createSphere();
const ping = entity.use(PingBehavior, { intervalMs: 500 });
```

Production systems receive a context with `world`, `scene`, and `getBehaviorLinks()`; implement `attach`, `detach`, and `update` per link.

## Design checklist

1. **Classify the behavior** — composable primitive (narrow API), higher-level controller, or FSM-backed mode machine. Add an FSM only when consumers must observe discrete states.
2. **Keep hot paths pure** — math and tick helpers should be testable without a full stage when possible.
3. **Store entity state in components** — use `components.ts` factories when the entity owns mutable input/config/state; document the `$input` field name.
4. **Prefer returning results** — let callers apply movement unless applying velocity is explicitly part of the handle API (see ricochet and boundary helpers).
5. **Export through game-lib** — public behaviors are re-exported from `packages/game-lib/src/lib/behaviors/index.ts` and `@zylem/game-lib/behavior`.

## File layout (in `@zylem/behaviors`)

Typical module shape:

```text
my-behavior/
  index.ts
  my-behavior.descriptor.ts
  my-behavior.behavior.ts   # optional pure logic
  my-behavior.fsm.ts        # only when needed
  components.ts             # when entity owns state
```

Internal shared math belongs in `shared/` only when multiple behaviors need it.

## Testing

Add coverage under `packages/game-lib/tests/unit/behaviors` (unit tests for pure helpers, FSM transition tests, or small system tests that drive `systemFactory` with mock links).

## Pitfalls

- `createHandle` runs at `use()` time; do not assume `ref.fsm` is initialized until after attach.
- Systems must detach cleanly—stage teardown re-indexes behavior links when entities are destroyed mid-game.
- Do not use `export * from '@zylem/behaviors'` inside game-lib barrels; named re-exports keep bundlers able to tree-shake.

## API reference

- [`defineBehavior`](/docs/api)
- [`BehaviorDescriptor`](/docs/api), [`BehaviorSystem`](/docs/api), [`BehaviorHandle`](/docs/api)
- Generated reference: [API](/docs/api)
