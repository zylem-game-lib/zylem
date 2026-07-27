# @zylem/bridge

Typed communication bridge shared by `@zylem/game-lib` and `@zylem/editor`.

The `<zylem-game>` and `<zylem-editor>` custom elements stay fully decoupled:
neither imports the other. Both depend on this package, which provides:

- **Protocol** (`protocol.ts`) — the complete typed message map:
  `GameToEditorMessages` (config, loading, stage snapshots, entity upserts,
  thumbnails) and `EditorToGameMessages` (debug/tool/playback commands,
  entity selection/focus/transform).
- **Channel** (`channel.ts`) — `BridgeChannel extends EventTarget` with
  `send` (immediate), `queue` (coalesced once per animation frame, payloads
  merged by uuid where applicable), `on` (returns unsubscribe), and
  `getState` (last-known payload per type so a late-mounting editor hydrates
  instantly).
- **Registry** (`registry.ts`) — `getZylemBridge()` resolves a process-wide
  singleton via `Symbol.for` on `globalThis`, so duplicated module copies
  across bundles still share one channel. `announceBridgeReady()` dispatches
  a composed `zylem:bridge:ready` DOM event for decoupled discovery.

## Usage

```ts
import { getZylemBridge } from '@zylem/bridge';

const { channel } = getZylemBridge();

// Game side: publish high-frequency updates, coalesced per frame
channel.queue('entity:upsert', [{ uuid, name, type, position, rotation, scale }]);

// Editor side: subscribe + hydrate
const unsubscribe = channel.on('stage:snapshot', (snapshot) => { /* ... */ });
const current = channel.getState('stage:snapshot');

// Editor side: send commands
channel.send('tool:set', { tool: 'translate' });
```
