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

## Swatches: pick and live apply

Dragging a configured shader or behavior ("swatch") onto the viewport is a
request/response exchange. The game owns raycasting and application; the
consumer only forwards pointer positions and the swatch description.

```ts
// Drag start: keep the hover outline painted while no Select tool is armed.
channel.send('pick:mode:set', { enabled: true });

// Each pointer move: `queue` keeps only the latest position per frame.
channel.queue('entity:pick', { requestId, ndc: { x, y } });
channel.on('entity:pick:result', ({ requestId, hit }) => { /* hit is an EntitySummaryPayload | null */ });

// Drop: apply to the last hit. The payload is batch-shaped so a multi-select
// apply is the same message with more uuids; every uuid × swatch pair is
// attempted and reported, and successful pairs form one undoable
// `scene:operation` of kind `swatch`.
channel.send('entity:apply-swatch', {
	uuids: [hit.uuid],
	swatches: [{ kind: 'shader', source: 'createLava', props: { speed: 2 } }],
	select: true,
});
channel.on('entity:swatch-applied', ({ opId, results }) => { /* results[i].ok / reason */ });

// Drag end
channel.send('pick:mode:set', { enabled: false });
```

`source` is the export name the game registered via
`registerSwatchSource` (`@zylem/game-lib/catalog`); unknown names come back as
`reason: 'unknown-source'`.
