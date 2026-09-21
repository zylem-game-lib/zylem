---
title: Cutscene definition
description: CutsceneDefinition schema, tracks, and cameras
sidebar_position: 2
---

A cutscene document describes a single timeline in **seconds**. The TypeBox source is `CutsceneDefinitionSchema` in `@zylem/game-lib/cinematics`; the published JSON Schema is `@zylem/game-lib/schema/cutscene` (see [JSON schemas](../assets-and-data/json-schemas.md)).

## Top-level fields

| Field | Description |
| --- | --- |
| `id`, `name` | Identity |
| `duration` | Total length in seconds (must be positive) |
| `stage` | Stage id the cutscene was authored against (informational; may be `null`) |
| `skippable` | Whether `skip()` on the player is allowed |
| `scenes` | Time ranges with incoming picture transitions |
| `cameras` | Camera rigs (static, dolly, follow) |
| `dollies` | Spline paths referenced by dolly cameras |
| `tracks` | Camera, event, and audio tracks |

## Scenes

Each `CutsceneScene` has `start`, `end`, and `transitionIn` (`type`, `duration`, `easing`). Transition types include `cut`, `fade`, `wipe`, `radial`, `noise`, and `cells`. Duration is ignored for `cut`.

## Cameras and shots

**Cameras** define rig behavior:

- `pose` — base position and `lookAt`
- `fov` — vertical field of view (degrees)
- `keyframes` — timed overrides with easing between keyframes
- `dollyId` + `dollyEasing` — for `kind: 'dolly'`
- `target`, `offset`, `damping` — for `kind: 'follow'`

**Dolly paths** are named polylines (`points`, `closed`, `tension` for Catmull–Rom).

**Camera track** items are **shots**: `{ cameraId, start, end, blend }`. `blend.duration` controls how long the camera cross-fades from the previous shot (0 = hard cut).

## Event track

Each `EventItem` has a `time` and a discriminated `event`:

| `event.type` | Payload |
| --- | --- |
| `emit` | `name`, `payload` (stage event) |
| `playAnimation` | `entity`, `key` |
| `playSong` | `song`, `loop` |
| `stopSong` | optional `song` |
| `setVariable` | `name`, `value` |

## Audio track

Each `AudioItem` has `time`, `kind` (`song` or `sfx`), `ref` (song slug or SFX URL), `loop`, and `volume` (dB).

## Validation and math

Import schemas from `@zylem/game-lib/cinematics` or types only from the same module. Runtime helpers in `cutscene-math` (`sceneAt`, `shotAt`, `evaluateCutscene`, `cutsceneLength`, …) mirror the schema for players and tools.

## Pitfalls

- **Malformed JSON** — preview ignores definitions missing `tracks` or `cameras` arrays.
- **Follow / dolly targets** — entity names must exist on the host stage or look-at falls back poorly.
- **Song refs** — `playSong` and audio items need `resolveSong` on the stage host.

## API reference

- [`CutsceneDefinitionSchema`](/docs/api/cinematics/variables/CutsceneDefinitionSchema)
- [`CutsceneScene`](/docs/api/cinematics/type-aliases/CutsceneScene), [`CutsceneCamera`](/docs/api/cinematics/type-aliases/CutsceneCamera)
- [`CameraShot`](/docs/api/cinematics/type-aliases/CameraShot), [`CutsceneEvent`](/docs/api/cinematics/type-aliases/CutsceneEvent)
- [`evaluateCutscene`](/docs/api/cinematics/functions/evaluateCutscene), [`cutsceneLength`](/docs/api/cinematics/functions/cutsceneLength)
