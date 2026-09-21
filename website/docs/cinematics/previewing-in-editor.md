---
title: Previewing in the editor
description: CutscenePreviewController and bridge cutscene messages
sidebar_position: 4
---

Director mode previews cutscenes inside the running game. `ZylemGame` owns a `CutscenePreviewController` that loads definitions from the editor, binds `createCutscenePlayer` to the current stage, and publishes playback status and camera matrices back across the bridge.

## Lifecycle

1. Editor sends `cutscene:load` with a runtime-shaped definition (plain JSON).
2. If the stage is not ready yet, the controller **queues** the payload and applies it in `stageReady()`.
3. Optional `autoplay` and `time` seek after load.
4. Editor drives transport with `cutscene:play`, `cutscene:pause`, `cutscene:stop`, `cutscene:seek`, or `cutscene:unload`.
5. Game publishes `cutscene:status` (id, state, time, active scene/shot) and `cutscene:view` (view/projection matrices and viewport) for overlays and picking.

When the stage is torn down, `releaseStage()` disposes the player but keeps a pending load for the next stage.

## Editor → game commands

| Message | Payload | Effect |
| --- | --- | --- |
| `cutscene:load` | `definition`, optional `autoplay`, `time` | Load or hot-update definition |
| `cutscene:play` | optional `from` | Start or resume |
| `cutscene:pause` | — | Pause |
| `cutscene:stop` | — | Stop and rewind |
| `cutscene:seek` | `time` | Scrub without firing events (preview default) |
| `cutscene:unload` | — | Drop cutscene; return camera to gameplay |
| `camera:pose:get` | `requestId` | Request live camera pose |

## Game → editor events

| Message | Payload | Effect |
| --- | --- | --- |
| `cutscene:status` | `cutsceneId`, `state`, `time`, `sceneId`, `shotId` | Timeline UI sync |
| `cutscene:view` | `viewProjection`, `inverseViewProjection`, `viewport` | Draw guides; unproject pointers |
| `camera:pose` | `requestId`, `position`, `lookAt`, optional `fov` | Capture framing from the viewport |

Playback states: `idle`, `playing`, `paused`, `finished`.

## Capturing camera poses

Director sends `camera:pose:get` with a `requestId`; the game answers with `camera:pose` so authored shots can match the live view (`position`, `lookAt`, optional `fov`).

## Wiring a custom host

External tools can use the same messages via `@zylem/game-lib/bridge` without importing editor code. Subscribe on `getZylemBridge().channel` after `zylem:bridge:ready` on the `zylem-game` element.

Preview uses `fireEventsOnSeek: false` so scrubbing does not spam gameplay hooks.

## Pitfalls

- **Load before stage** — early `cutscene:load` is held until `stageReady()`; do not assume immediate playback.
- **Malformed definitions** — missing `tracks` or `cameras` is ignored with a console warning.
- **Same id** — reloading the same `id` calls `setDefinition` instead of recreating the player.

## API reference

- [`CutscenePreviewController`](/docs/api/cinematics/classes/CutscenePreviewController)
- Bridge payloads: [`CutsceneLoadPayload`](/docs/api/bridge/interfaces/CutsceneLoadPayload), [`CutsceneStatusPayload`](/docs/api/bridge/interfaces/CutsceneStatusPayload), [`CutsceneViewPayload`](/docs/api/bridge/interfaces/CutsceneViewPayload)
- [Bridge protocol](../editor-integration/bridge.md) — full message maps
