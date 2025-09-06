# Zylem

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

>Note: This project is still in alpha. There are unfinished features and some APIs that may change.

## Installation

```bash
pnpm install
```

```bash
npm run dev
```

## Examples

>Note: The examples are not up to date with the latest version of Zylem.
[Check out the examples repo here](https://github.com/tcool86/zylem-examples/tree/master)

## Basic Usage

[Basic usage repo here](https://github.com/tcool86/zylem-basic)

```html
<!DOCTYPE html>
<html lang="en">
 <head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Zylem - Basic Usage</title>
  <link rel="stylesheet" href="./index.css" />
 </head>
 <body>
  <script src="./src/index.ts" type="module"></script>
 </body>
</html>
```

```typescript
import { game, sphere, makeMoveable } from '@tcool86/zylem';

const ball = await sphere();
makeMoveable(ball).onUpdate(({ entity, inputs }) => {
  const { Horizontal, Vertical } = inputs.p1.axes;
  entity.moveXY(Horizontal.value * 5, -Vertical.value * 5);
});

game(ball).start();
```
