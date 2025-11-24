# Zylem Game Library

A powerful and easy-to-use framework for creating simple 3D digital interactive applications using TypeScript.

**Why Zylem?**

I wanted to build something easy to jump into and deploy while still only writing code (no complex game IDEs).

**Who should use Zylem?**

This library is intended for hobbyist developers who want to play with 3D web technologies to build a game.

**What does Zylem do?**

The goal is to give you tools to build simple 3D games. It's basically comprised of:

- Rendering via ThreeJS with some capability to handle postprocessing built-in. [ThreeJS](https://threejs.org/)
- Collision handling, triggers, and rigid body physics via RapierRS [RapierRS](https://rapier.rs/)
- Game state management with Valtio [Valtio](https://valtio.dev/)
- Simplified input handling (gamepad, keyboard, mouse)

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
import { boundary2d, createGame, makeMoveable, sphere } from '@zylem/game-lib';

// Creates a moveable sphere
const ball = makeMoveable(await sphere());

// when the ball is updated, move it based on the inputs
ball.onUpdate(({ me, inputs, delta }) => {
  // get the horizontal and vertical inputs from player one's controller
  const { Horizontal, Vertical } = inputs.p1.axes;
  // set the speed of the ball based on the delta time for smoother movement
  const speed = 600 * delta;
  // move the ball based on the inputs and the speed
  me.moveXY(Horizontal.value * speed, -Vertical.value * speed);
});

// add a boundary behavior to the ball
ball.addBehavior(
  boundary2d({
    boundaries: {
      top: 3,
      bottom: -3,
      left: -6,
      right: 6,
    },
  }),
);

// start the game with the ball
createGame(ball).start();
```

## Development

This package is part of the Zylem monorepo. See the main repository README for development setup.
