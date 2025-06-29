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

## Repository Governance

### Conventional commits

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `cleanup`: Removal of dead code, unused functionality, or code changes involving renaming
- `perf`: A code change that improves performance
- `test`: Adding missing or correcting existing tests
- `build`: Changes that affect the build system or external dependencies (example scopes: vite, npm, typescript, etc)
