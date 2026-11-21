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

Production systems receive a context with `world`, `scene`, `wasmStage`, and `getBehaviorLinks()`. The stage calls `attach(link)` when a behavior starts on a spawned entity and `detach(link)` when it stops: at `disable()`, at `unuse()`, and when the entity leaves the stage. `update` runs once per frame, and `destroy` runs once when the stage is torn down.

A system without `detach` cannot be stopped during play. Its handles throw `not removable at runtime` from `disable()` once the entity is spawned.

## Switchable behaviors with SlotBehaviorSystem

Extend `SlotBehaviorSystem` when game code should be able to switch the behavior on and off during play. See [Toggling behaviors at runtime](/docs/behaviors/overview#toggling-behaviors-at-runtime) for the game-author side. The base class keeps the list of running links, attaches each one when its entity has a runtime slot, attaches it again when that slot changes, and detaches it when the behavior stops. A toggle reuses the list's storage, so it allocates nothing.

`website/snippets/behaviors/slot-behavior-system.ts` is a complete behavior built on it:

```typescript
import {
	defineBehavior,
	SlotBehaviorSystem,
	type BehaviorEntityLink,
} from '@zylem/game-lib/behavior';
import { createSphere } from '@zylem/game-lib/entity';

interface PulseOptions {
	/** Pulses per second. */
	rate: number;
}

/** State the behavior keeps on the entity. Built once, then reused. */
interface PulseComponent {
	elapsed: number;
	value: number;
}

class PulseSystem extends SlotBehaviorSystem<PulseOptions> {
	/** Runs when the behavior starts on an entity: at spawn and at every enable(). */
	protected prepare(link: BehaviorEntityLink): void {
		link.entity.pulse ??= { elapsed: 0, value: 0 } satisfies PulseComponent;
	}

	/** Runs when the behavior stops: at disable(), unuse(), and when the entity leaves the stage. */
	protected release(link: BehaviorEntityLink): void {
		const pulse = link.entity.pulse as PulseComponent;
		pulse.elapsed = 0;
		pulse.value = 0;
	}

	/** Start the behavior in the runtime for this slot. Nothing to do for a pure TypeScript behavior. */
	protected attachRuntime(_slot: number, _options: PulseOptions): void {}

	/** Stop the behavior in the runtime for this slot. */
	protected detachRuntime(_slot: number): void {}

	/** Runs every frame for every entity whose behavior is on. */
	protected writeInputs(link: BehaviorEntityLink, _slot: number, delta: number): void {
		const pulse = link.entity.pulse as PulseComponent;
		const { rate } = link.ref.options as PulseOptions;
		pulse.elapsed += delta;
		pulse.value = Math.sin(pulse.elapsed * rate * Math.PI * 2);
	}
}

const PulseBehavior = defineBehavior({
	name: 'pulse',
	defaultOptions: { rate: 1 } as PulseOptions,
	systemFactory: (ctx) => new PulseSystem(ctx.wasmStage ?? null),
});

const orb = createSphere();
const pulse = orb.use(PulseBehavior, { rate: 2 });

// The base class makes the behavior switchable during play.
pulse.disable();
pulse.enable();
```

| Method | Required | When it runs |
| --- | --- | --- |
| `attachRuntime(slot, options, link)` | yes | The entity has a runtime slot and the behavior is starting, or the slot changed. Call the runtime's attach function here. |
| `detachRuntime(slot, link)` | yes | The behavior is stopping and the entity still owns the slot. Call the runtime's detach function here. |
| `writeInputs(link, slot, delta)` | yes | Every frame, for every running link. `slot` is `-1` while the entity has no runtime slot. |
| `prepare(link, options)` | no | The behavior is starting on an entity. Create its components and FSM here the first time, and reuse them after that. |
| `release(link)` | no | The behavior is stopping, or the stage is being torn down. Reset its components and FSM in place. |
| `beginFrame(delta)` | no | Once per frame, before any `writeInputs`. |

Keep these methods free of allocation so a toggle stays free of it:

- Create components and the FSM once in `prepare`, guarded by a check that they do not exist yet. Reset them in `release`; do not replace them.
- Pass the runtime one options object that the system owns and refills in `attachRuntime`.
- Read options from `link.ref.options` each time. `setOptions()` changes that object in place, then restarts the behavior.

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

For a switchable behavior, cover four cases: attach on a spawned entity, detach, restart on the same link, and a link whose entity gets its runtime slot later.

## Pitfalls

- `createHandle` runs at `use()` time; do not assume `ref.fsm` is initialized until after attach.
- Systems must detach cleanly. The stage detaches a link when its behavior is disabled and when its entity leaves the stage. At teardown it calls `destroy()` on the system instead, so release every remaining link there.
- `attach` can run more than once for the same link: again after the entity gets a new runtime slot, and after every `enable()`. Make it safe to repeat.
- Do not use `export * from '@zylem/behaviors'` inside game-lib barrels; named re-exports keep bundlers able to tree-shake.

## API reference

- [`defineBehavior`](/docs/api)
- [`BehaviorDescriptor`](/docs/api), [`BehaviorSystem`](/docs/api), [`BehaviorHandle`](/docs/api)
- [`SlotBehaviorSystem`](/docs/api/behavior/classes/SlotBehaviorSystem), [`BehaviorEntityLink`](/docs/api/behavior/interfaces/BehaviorEntityLink)
- Generated reference: [API](/docs/api)
