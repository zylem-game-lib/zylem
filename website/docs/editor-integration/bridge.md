---
title: Bridge
description: Editor ↔ game protocol and game-side API
sidebar_position: 2
---

The bridge is a typed message bus between a running game (`@zylem/game-lib`) and an editor overlay (`@zylem/editor`). Both sides depend on `@zylem/bridge` only—no cross-imports—so `zylem-game` and editor custom elements stay decoupled while sharing one contract (`packages/bridge/src/protocol.ts`).

Game-lib exposes:

- `getZylemBridge()` — shared channel singleton
- `GameBridge` — game-side adapter wired inside `ZylemGame` (publish snapshots, handle commands)
- `announceBridgeReady`, `applySwatchesToSelection`, `BRIDGE_READY_EVENT`
- Re-exported payload types from `@zylem/bridge`

External hosts subscribe or send on `getZylemBridge().channel` after the `zylem-game` element fires `zylem:bridge:ready`.

```typescript
import { getZylemBridge, BRIDGE_READY_EVENT } from '@zylem/game-lib/bridge';

gameElement.addEventListener(BRIDGE_READY_EVENT, () => {
  const { channel } = getZylemBridge();
  channel.on('stage:snapshot', (snap) => { /* … */ });
  channel.send('playback:set', { paused: false });
});
```

High-frequency publishes use the channel `queue` so at most one message per animation frame coalesces (entity upserts, thumbnails).

## Game → editor (`GameToEditorMessages`)

| Message | Payload | Purpose |
| --- | --- | --- |
| `game:config` | `GameConfigPayload` | Game id, aspect, fullscreen, resolution, debug flag |
| `game:loading` | `GameLoadingPayload` | Load lifecycle: `start` / `progress` / `complete`, optional stage index |
| `game:status` | `{ paused?, debug? }` | Runtime flags |
| `game:variable` | `GameVariablePayload` | Global variable change (`path`, `value`, `previousValue`) |
| `game:notice` | `GameNoticePayload` | Console notice: `info` / `warn` / `error` + message |
| `stage:snapshot` | `StageSnapshotPayload` | Stage config + full entity list |
| `entity:upsert` | `EntitySummaryPayload[]` | Create or update entity summaries |
| `entity:removed` | `{ uuids: string[] }` | Entities left the stage |
| `entity:thumbnail` | `EntityThumbnailPayload[]` | Preview URL + bounds per entity |
| `entity:selection` | `EntitySelectionPayload` | Selected/hovered uuids (multi-select via `selectedUuids`) |
| `catalog:snapshot` | `{ entities: EntityTypeDescriptor[] }` | Add palette types |
| `scene:operation` | `SceneOperationPayload` | Committed undoable edit (`transform`, `create`, `delete`, `swatch`) |
| `entity:pick:result` | `EntityPickResultPayload` | Raycast answer for `entity:pick` |
| `entity:swatch-applied` | `EntitySwatchAppliedPayload` | Outcome of `entity:apply-swatch` |
| `cutscene:status` | `CutsceneStatusPayload` | Cutscene id, playback state, time, scene/shot ids |
| `cutscene:view` | `CutsceneViewPayload` | View/projection matrices + viewport for overlays |
| `camera:pose` | `CameraPosePayload` | Answer to `camera:pose:get` |

## Editor → game (`EditorToGameMessages`)

| Message | Payload | Purpose |
| --- | --- | --- |
| `debug:set` | `{ enabled: boolean }` | Toggle debug overlay |
| `tool:set` | `{ tool: BridgeDebugTool }` | `select`, `translate`, `rotate`, `scale`, `delete`, `add`, `none` |
| `playback:set` | `{ paused: boolean }` | Pause or resume simulation |
| `entity:select` | `EntitySelectPayload` | Select one uuid, many uuids, or clear; `mode`: `replace`, `add`, `subtract`, `toggle` |
| `entity:focus` | `{ uuid: string }` | Frame entity in view |
| `entity:transform` | uuid + optional `position`, `rotation`, `quaternion`, `scale` | Apply transform (quaternion authoritative when set) |
| `entity:create` | `{ typeId, props?, pose? }` | Spawn catalog type |
| `scene:operation:apply` | `{ op: SceneOperationPayload, direction: 'undo' \| 'redo' }` | Replay undo stack entry |
| `add:type:set` | `{ typeId: string \| null, props? }` | Arm Add tool with catalog type or disarm |
| `snap:set` | `SnapSettingsPayload` | Translation / rotation / scale snap increments |
| `grid:set` | `{ visible: boolean }` | Construction grid visibility |
| `stage:variable:set` | `{ key, value }` | Write stage variable |
| `pick:mode:set` | `{ enabled: boolean }` | Hover picking while dragging swatches |
| `entity:pick` | `EntityPickPayload` | Raycast at NDC; answered by `entity:pick:result` |
| `entity:apply-swatch` | `EntityApplySwatchPayload` | Apply shader/behavior swatches to uuids (batch cartesian product) |
| `cutscene:load` | `CutsceneLoadPayload` | Load preview cutscene; optional `autoplay`, `time` |
| `cutscene:play` | `{ from?: number }` | Play cutscene |
| `cutscene:pause` | `{}` | Pause cutscene |
| `cutscene:stop` | `{}` | Stop cutscene |
| `cutscene:seek` | `{ time: number }` | Scrub time (seconds) |
| `cutscene:unload` | `{}` | Unload cutscene; restore gameplay camera |
| `camera:pose:get` | `{ requestId: string }` | Request live camera pose |

`BridgeMessages` is the intersection of both maps; `BridgeMessageType` is keyof that union.

## Shared payload notes

- **Poses** — `BridgePose` carries optional `position`, Euler `rotation` (radians), authoritative `quaternion`, and `scale`.
- **Swatches** — `SwatchSpec`: `{ kind: 'shader' \| 'behavior', source, props }` where `source` is an export name registered in the [swatch registry](./entity-catalog-and-swatches.md).
- **Scene operations** — Game publishes operations; editor stores undo/redo and replays via `scene:operation:apply` because it cannot reconstruct entities from summaries alone.

## GameBridge host

`GameBridge.connect(host)` binds an object implementing `GameBridgeHost` (stage access, entity lookup, thumbnails, cutscene preview, catalog publish). Most games use the internal wiring in `ZylemGame`; custom embeds can instantiate `GameBridge` for partial integration.

## Pitfalls

- **Ready event** — commands sent before handlers connect are dropped; always listen for `zylem:bridge:ready`.
- **Partial swatch success** — batch apply returns per-target results; failures do not roll back successful targets.
- **Cutscene JSON** — bridge carries `CutsceneLoadPayload.definition` as untyped JSON to avoid circular deps; validate with [cutscene schema](../assets-and-data/json-schemas.md).

## API reference

- [`getZylemBridge`](/docs/api/bridge/functions/getZylemBridge)
- [`GameBridge`](/docs/api/bridge/classes/GameBridge)
- [`GameToEditorMessages`](/docs/api/bridge/type-aliases/GameToEditorMessages), [`EditorToGameMessages`](/docs/api/bridge/type-aliases/EditorToGameMessages)
