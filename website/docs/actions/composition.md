---
title: Composition
description: sequence, parallel, repeat, repeatForever
sidebar_position: 3
---

Composition helpers wrap other actions without subclassing. They implement the same `Action` interface, so you can nest them arbitrarily and pass the result to `entity.runAction()`.

## Minimal example

Runnable sample: `website/snippets/actions/composition.ts`.

```ts
import { moveBy, rotateBy, sequence, parallel, repeat, repeatForever, delay } from '@zylem/game-lib/actions';

patrol.runAction(
	repeat(
		sequence(
			parallel(
				moveBy({ x: 3, duration: 1500 }),
				rotateBy({ y: 90, duration: 1500 }),
			),
			delay(250),
			moveBy({ x: -3, duration: 1500 }),
		),
		3,
	),
);

spinner.runAction(repeatForever(rotateBy({ y: 360, duration: 2000 })));
```

## Semantics

| Helper | Duration | Completes when |
| --- | --- | --- |
| `sequence(...actions)` | Sum of child durations | Last child finishes |
| `parallel(...actions)` | Max child duration | All children finish |
| `repeat(action, times)` | `action.duration × times` | Ran `times` cycles |
| `repeatForever(action)` | `Infinity` | Never |

`sequence` forwards leftover delta time when a child finishes mid-frame, so chained short actions stay in sync with the frame clock.

## Pitfalls

- `repeatForever` never sets `done`; use `entity.clearActions()` or keep it on a dedicated entity you destroy.
- Empty `sequence()` completes immediately.
- `parallel` with mixed zero-duration and long-duration children still waits for the longest child.

## API reference

- [sequence](/docs/api/actions/functions/sequence)
- [parallel](/docs/api/actions/functions/parallel)
- [repeat](/docs/api/actions/functions/repeat)
- [repeatForever](/docs/api/actions/functions/repeatForever)
