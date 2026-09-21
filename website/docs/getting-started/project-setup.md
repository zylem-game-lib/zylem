---
title: Project setup
description: Vite, the web component host, and createGame().start()
sidebar_position: 3
---

Zylem needs a DOM mount point, a browser bundle, and an explicit call to `Game.start()` (unless you assign the game to `<zylem-game>`, which starts it for you). Choose between a **Vite (or bundler) entry** you control, or the **web component host** when the canvas should fill a custom element—common for embeds and editor harnesses.

## Vite + `createGame().start()`

Use this for standalone games: one TypeScript entry, one HTML page, full control over layout around the canvas.

**`index.html`** — give the engine a sized root. If you omit config, game-lib creates `#zylem-root` on `document.body` when `start()` runs; defining your own element keeps layout predictable.

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>My Zylem game</title>
		<style>
			html, body, #game { margin: 0; width: 100%; height: 100%; }
		</style>
	</head>
	<body>
		<div id="game"></div>
		<script type="module" src="/src/main.ts"></script>
	</body>
</html>
```

**`src/main.ts`** — pass `containerId` (or a `container` element reference) in the game options array, then start:

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

createGame({ containerId: 'game' }, ball).start();
```

See `website/snippets/getting-started/project-setup-vite.ts` for the game logic without HTML.

Run with `npm run dev` (Vite). Production builds should tree-shake unused subpaths as long as imports stay on `@zylem/game-lib/*` entry points.

## `<zylem-game>` web component host

Import `@zylem/game-lib/web-components` so the `zylem-game` custom element registers. Assign a `Game` instance to the element’s `game` property; the element attaches an internal shadow-DOM container, calls `start()`, and resizes the viewport from its layout box.

**HTML**

```html
<zylem-game style="display:block;width:100%;height:100vh;"></zylem-game>
```

**TypeScript**

```typescript
import { createGame } from '@zylem/game-lib/core';
import { createSphere } from '@zylem/game-lib/entity';
import { ZylemGameElement } from '@zylem/game-lib/web-components';

const ball = createSphere();
const host = document.querySelector('zylem-game');

if (host instanceof ZylemGameElement) {
	host.game = createGame(ball);
}
```

Setting `host.game` disposes any previous game, injects the shadow container into `game.options`, and awaits `start()`. When the node disconnects, the current game is disposed automatically.

Optional attributes:

- `viewport-profile` — `auto`, `mobile`, or `desktop`; forwarded into [device profile](/docs/api/core/type-aliases/DeviceProfile) resolution for input and layout.

See `website/snippets/getting-started/project-setup-web-component.ts`.

## Comparison

| Approach | Best when | Who calls `start()` | Mount target |
| --- | --- | --- | --- |
| Vite + `createGame().start()` | New games, full-page canvas | Your entry file | `#game`, `#zylem-root`, or `{ container: HTMLElement }` |
| `<zylem-game>` | Embeds, editor shell, resizable panel | `ZylemGameElement` when `game` is set | Shadow DOM div inside the custom element |

You can combine them: build entities in plain modules, `createGame(...)` in a factory, and assign the result to `<zylem-game>` in the shell.

## `createGame()` options shape

`createGame` accepts a rest list of **game options**: config objects, `createStage()` results, entities, globals, and other nodes. If you pass no stage, game-lib inserts a default stage automatically.

Common config fields (see [gameConfig](/docs/api/core/functions/gameConfig) and [ZylemGameConfig](/docs/api/core/interfaces/ZylemGameConfig)):

- `containerId` / `container` — where the WebGL canvas lives.
- `globals` — initial Valtio-backed game state.
- `stages` — explicit stage list when not passing `createStage()` as separate arguments.

Lifecycle hooks such as `onSetup`, `onUpdate`, and `onDestroy` also exist on the returned [Game](/docs/api/core/classes/Game) instance for game-wide logic.

## Pitfalls

- **Double mount** — do not call `start()` yourself *and* assign the same `Game` to `<zylem-game>`; the element already starts on assignment.
- **Zero-size host** — `<zylem-game>` needs a non-zero width and height (CSS or parent layout) or viewport sizing falls back to `0`.
- **Keyboard focus** — the web component focuses an internal focusable div; click the game if keys do not register.
- **Missing `start()` in Vite** — constructing `createGame(...)` without `start()` leaves a blank page.

## API reference

- [createGame](/docs/api/core/functions/createGame)
- [Game.start](/docs/api/core/classes/Game#start)
- [Game.setDisplayRuntime](/docs/api/core/classes/Game#setdisplayruntime)
- [ZylemGameElement](/docs/api/web-components/classes/ZylemGameElement)
- [ZylemGameState](/docs/api/web-components/interfaces/ZylemGameState)
- [gameConfig](/docs/api/core/functions/gameConfig)
