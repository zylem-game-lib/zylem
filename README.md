# Zylem

A powerful and easy-to-use framework for creating simple 3D digital interactive applications using TypeScript.

>Note: This project is still in alpha. There are unfinished features and some APIs that may change.

## Installation

```bash
pnpm install
```

```bash
npm run dev
```

## Examples

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
  <main id="basic-game"></main>
  <script src="./src/index.ts" type="module"></script>
 </body>
</html>
```

```typescript
import { game, stage, sphere } from '@tcool86/zylem';

const example = game({
 id: 'basic-game',
 globals: {
  score: 0
 },
 stages: [
  stage({
   children: () => [
    sphere({
     update: ({ entity: ball, inputs }) => {
      const { moveRight, moveLeft, moveUp, moveDown } = inputs[0];
      if (moveRight) {
       ball.moveX(5);
      } else if (moveLeft) {
       ball.moveX(-5);
      } else if (moveUp) {
       ball.moveY(5);
      } else if (moveDown) {
       ball.moveY(-5);
      } else {
       ball.moveXY(0, 0);
      }
     }
    })
   ]
  })
 ],
});

example.start();
```

## Repository Governance

### Conventional commits

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing or correcting existing tests
- `build`: Changes that affect the build system or external dependencies (example scopes: vite, npm, typescript, etc)
