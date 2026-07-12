# Zylem Game Library

A powerful and easy-to-use framework for creating simple 3D digital interactive applications using TypeScript.

**Why Zylem?**

I wanted to build something easy to jump into and deploy while still only writing code (no complex game IDEs).

**Who should use Zylem?**

This library is intended for hobbyist developers who want to play with 3D web technologies to build a game.

**What does Zylem do?**

The goal is to give you tools to build simple 3D games. It's basically comprised of:

- Rendering via ThreeJS with some capability to handle postprocessing built-in. [ThreeJS](https://threejs.org/)
- Collision handling, triggers, and rigid body physics simulated in WebAssembly (Rapier compiled to WASM via [@zylem/runtime](https://www.npmjs.com/package/@zylem/runtime), driven through [@zylem/behaviors](https://www.npmjs.com/package/@zylem/behaviors))
- Game state management with Valtio [Valtio](https://valtio.dev/)
- Simplified input handling (gamepad, keyboard, mouse)

**Architecture layers**

Zylem is split into three packages, each a strict layer over the one below:

| Layer | Package | Owns |
| --- | --- | --- |
| Game framework | `@zylem/game-lib` | Three.js rendering, input, assets, stages, game state |
| Simulation | `@zylem/behaviors` | `createSimulation()`, entity registry, behavior FSMs, event translation, runtime ownership |
| Runtime | `@zylem/runtime` | WASM module: ECS + Rapier physics, batched input/render/snapshot/event buffers |

Each frame, game-lib forwards behavior inputs into the simulation, calls `simulation.update(delta)` (fixed-timestep physics inside WASM), then syncs interpolated render poses onto Three.js objects. Disposal follows the same chain: `Game.dispose()` → `Simulation.dispose()` → WASM stage destroy.

Games normally never touch the runtime directly; for debug tooling there is an escape hatch: `game.experimental.getRuntime()` returns the underlying `Simulation`.

> Note: This project is still in alpha. There are unfinished features and some APIs that may change.

## Installation

```bash
npm install @zylem/game-lib
```

## Getting started with a basic game

[Basic example](https://github.com/zylem-game-lib/zylem-basic)

```typescript
/**
 * @author: Tim Cool
 *
 * @description: basic ball movement
 * the ball can be controlled with the arrow keys or gamepad
 * the ball cannot go outside the boundaries
 */
import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { WorldBoundary2DBehavior } from '@zylem/game-lib/behavior';

// Creates a sphere (movement capabilities are built-in)
const ball = createSphere();

// attach boundary behavior
ball.use(WorldBoundary2DBehavior, {
  boundaries: { top: 3, bottom: -3, left: -6, right: 6 },
});

// when the ball is updated, move it based on the inputs
ball.onUpdate(({ me, inputs, delta }) => {
  // get the horizontal and vertical inputs from player one's controller
  const { Horizontal, Vertical } = inputs.p1.axes;
  // set the speed of the ball based on the delta time for smoother movement
  const speed = 600 * delta;
  // move the ball based on the inputs and the speed
  me.moveXY(Horizontal.value * speed, -Vertical.value * speed);
});

// start the game with the ball
createGame(ball);
```

## Development

This package is part of the Zylem monorepo. See the main repository README for development setup.
