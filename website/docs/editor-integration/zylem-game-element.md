---
title: zylem-game element
description: Web component host for the running game
sidebar_position: 1
---

The `zylem-game` custom element wraps a `Game` instance in a shadow DOM container sized to the element’s layout box. Editors and devtools mount the game inside their UI, attach a `Game` after construction, and drive debug or playback through element state and the [bridge](./bridge.md).

Import the element from `@zylem/game-lib/web-components` and register it by loading the module (side effect: `customElements.define('zylem-game', …)`).

## Layout and display

- `:host` is `display: block` at 100% width/height of its parent.
- An internal focusable `div` receives keyboard input; call `focus()` on the element when embedding in an iframe or panel.
- `ResizeObserver` keeps the game’s display runtime in sync with the element’s CSS size (`setDisplayRuntime` with viewport width/height).
- Attribute `viewport-profile` (`auto`, `mobile`, `desktop`) maps to device profile for resolution/aspect handling.

## Attaching a game

Set the `game` property to a `Game` from `createGame`. The element disposes any previous game, injects its container option (marked so only one host container wins), starts the loop, then dispatches `zylem:bridge:ready` (see `BRIDGE_READY_EVENT`) after `start()` settles so bridge commands are not lost on early listeners.

```typescript
import { createGame } from '@zylem/game-lib/core';
import '@zylem/game-lib/web-components';

const el = document.querySelector('zylem-game')!;
el.game = createGame({ /* … */ });
el.focus();
```

## Editor state mirror

The optional `state` property accepts `ZylemGameState`:

- `gameState.debugFlag` → internal `debugState.enabled`
- `toolbarState.tool` → debug tool (`select`, `translate`, `rotate`, …)
- `toolbarState.paused` → game pause flag

This mirrors toolbar UI into game-lib without sending bridge messages for every toggle.

## Lifecycle

`disconnectedCallback` disconnects the resize observer and disposes the game. Re-attaching requires assigning a new `game`.

## Pitfalls

- **Bridge timing** — wait for `zylem:bridge:ready` before sending editor commands; the game connects handlers during load.
- **Shadow DOM** — query the custom element, not inner nodes, for bridge events (they bubble composed).
- **Focus** — keyboard gameplay needs the inner container focused after the user selects the viewport.

## API reference

- [`ZylemGameElement`](/docs/api/web-components/classes/ZylemGameElement)
- [`ZylemGameState`](/docs/api/web-components/interfaces/ZylemGameState)
- [`BRIDGE_READY_EVENT`](/docs/api/bridge/variables/BRIDGE_READY_EVENT)
