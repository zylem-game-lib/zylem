---
title: Interval actions
description: moveBy, moveTo, rotateBy, delay, fadeOpacity, callFunc
sidebar_position: 2
---

Interval actions run for a fixed duration (in **milliseconds**) and then mark themselves done. They are the building blocks for tweens and for steps inside `sequence()`.

## Minimal example

Runnable sample: `website/snippets/actions/interval-actions.ts`.

```ts
import { moveBy, moveTo, rotateBy, delay, callFunc, fadeOpacity, sequence } from '@zylem/game-lib/actions';

entity.runAction(
	sequence(
		moveBy({ x: 4, duration: 800 }),
		delay(300),
		rotateBy({ y: 180, duration: 500 }),
		callFunc(() => {
			entity.runAction(fadeOpacity({ from: 1, to: 0.3, duration: 400 }));
		}),
		moveTo({ x: 0, y: 0, z: 0, duration: 1000 }),
	),
);
```

## Factories

| Function | Effect |
| --- | --- |
| `moveBy({ x?, y?, z?, duration })` | Displacement over time via velocity intent |
| `moveTo({ x, y, z, duration })` | Absolute position; displacement computed on first tick |
| `rotateBy({ x?, y?, z?, duration })` | Euler delta in **degrees**, applied as angular velocity |
| `delay(ms)` | No-op wait |
| `callFunc(fn)` | Runs `fn` once, completes immediately |
| `fadeOpacity({ from?, to?, duration, targets?, restoreOpaque? })` | Lerps material opacity on meshes under the entity |
| `resetEntityOpacity(entity, opacity?, transparent?)` | Instant opacity reset (not an `Action`) |

`moveBy` and `moveTo` use `setVelocityIntent` with mode `add` so parallel moves compose within the same frame. `rotateBy` accumulates into `transformStore.angularVelocity`.

## Opacity notes

- `fadeOpacity` traverses `entity.group` or `entity.mesh` unless you pass `targets`.
- Materials must expose `opacity` and `transparent`. The action forces `transparent: true` while fading.
- With `restoreOpaque: true` and `to >= 1`, opaque materials are restored when the fade completes.

## Pitfalls

- `moveTo` captures the starting position on its **first** tick after `reset()`; restarting the same action instance recomputes from the new position.
- Zero or negative `duration` skips motion for move/rotate helpers.
- `callFunc` inside `sequence` is the usual place for spawning entities or playing sound; keep heavy work out of `onTick` implementations you write yourself.

## API reference

- [moveBy](/docs/api/actions/functions/moveBy)
- [moveTo](/docs/api/actions/functions/moveTo)
- [rotateBy](/docs/api/actions/functions/rotateBy)
- [delay](/docs/api/actions/functions/delay)
- [callFunc](/docs/api/actions/functions/callFunc)
- [fadeOpacity](/docs/api/actions/functions/fadeOpacity)
- [resetEntityOpacity](/docs/api/actions/functions/resetEntityOpacity)
