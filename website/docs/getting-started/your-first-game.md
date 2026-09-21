---
title: Your first game
description: A controllable sphere with a world boundary
sidebar_position: 2
---

This walkthrough builds the smallest interesting game: a sphere you move with the keyboard (or gamepad), clamped inside a rectangular playfield with [WorldBoundary2DBehavior](/docs/api/behavior/variables/WorldBoundary2DBehavior). You will use three subpaths—`core`, `entity`, and `behavior`—and finish by starting the game loop with `createGame(...).start()`.

The full runnable sample lives in `website/snippets/getting-started/first-game.ts` and matches the steps below.

## Step 1 — Create the ball

Import factory helpers and construct a sphere entity. Primitives such as `createSphere()` already know how to draw themselves and expose movement helpers like `moveXY`.

```typescript
import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';

const ball = createSphere();
```

## Step 2 — Add a world boundary behavior

Behaviors attach with `entity.use(Descriptor, options)`. `WorldBoundary2DBehavior` keeps the entity inside axis-aligned limits on the X/Y plane (typical top-down or tilted orthographic views).

```typescript
import { WorldBoundary2DBehavior } from '@zylem/game-lib/behavior';

ball.use(WorldBoundary2DBehavior, {
	boundaries: { top: 3, bottom: -3, left: -6, right: 6 },
});
```

The behavior runs in the simulation layer; you do not need to call it every frame unless you want hit feedback (see [WorldBoundary2DHandle](/docs/api/behavior/interfaces/WorldBoundary2DHandle)).

## Step 3 — Read input in `onUpdate`

Register an update callback on the entity. Each tick receives `inputs` (player slots), `delta` (seconds since last frame), and `me` (the entity). Scale movement by `delta` so speed stays consistent when the frame rate varies.

```typescript
ball.onUpdate(({ me, inputs, delta }) => {
	const { Horizontal, Vertical } = inputs.p1.axes;
	const speed = 600 * delta;
	me.moveXY(Horizontal.value * speed, -Vertical.value * speed);
});
```

Player one (`p1`) defaults to arrow keys and the left stick on a connected gamepad. Flip the sign on `Vertical` if “up” feels inverted for your camera.

## Step 4 — Start the game

Pass the ball (and optional config objects) into `createGame`, then await `start()` so assets and the first stage load before the loop runs.

```typescript
createGame(ball).start();
```

If you omit `start()`, nothing renders—the `Game` instance is constructed but the internal `ZylemGame` wrapper has not mounted yet.

## Complete example

```typescript
import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { WorldBoundary2DBehavior } from '@zylem/game-lib/behavior';

const ball = createSphere();

ball.use(WorldBoundary2DBehavior, {
	boundaries: { top: 3, bottom: -3, left: -6, right: 6 },
});

ball.onUpdate(({ me, inputs, delta }) => {
	const { Horizontal, Vertical } = inputs.p1.axes;
	const speed = 600 * delta;
	me.moveXY(Horizontal.value * speed, -Vertical.value * speed);
});

createGame(ball).start();
```

## Variations

- **Tighter arena** — shrink `left` / `right` / `top` / `bottom` in the behavior options.
- **Faster ball** — raise the `600` constant; keep the `* delta` factor.
- **Explicit stage** — pass `createStage({ … })` before the ball when you need camera or background options (see [Stages](/docs/game-and-stages/stages)).
- **Handle-based clamping** — store the return value of `ball.use(...)` and call `getMovement` if you compose movement from several sources.

## Pitfalls

- **Forgetting `start()`** — `createGame(ball)` alone does not mount the canvas or run updates.
- **Wrong import path** — behaviors come from `@zylem/game-lib/behavior`, not from `/core`.
- **Boundary vs. camera** — boundaries are simulation limits on X/Y; they do not automatically match what the camera sees unless you align numbers with your stage layout.
- **Focus** — keyboard input goes to the game container. Click the canvas (or focus the `<zylem-game>` host) if keys seem dead in an embedded layout.

## API reference

- [createGame](/docs/api/core/functions/createGame)
- [createSphere](/docs/api/entity/functions/createSphere)
- [WorldBoundary2DBehavior](/docs/api/behavior/variables/WorldBoundary2DBehavior)
- [WorldBoundary2DOptions](/docs/api/behavior/interfaces/WorldBoundary2DOptions)
- [Game.start](/docs/api/core/classes/Game#start)
