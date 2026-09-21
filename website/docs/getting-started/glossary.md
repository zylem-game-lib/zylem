---
title: Glossary
description: Canonical vocabulary for the rest of the docs
sidebar_position: 5
---

These terms are used consistently across the Zylem docs. When a guide mentions a concept, it means the definition here—not a generic game-engine meaning.

## action

A timed or persistent helper in the action graph— for example `sequence`, `moveBy`, or interval-driven updates. Actions choreograph change on one or more entities; import from `@zylem/game-lib/actions`. Contrast with **behavior**, which participates in simulation systems.

## behavior

Capability attached with `entity.use(BehaviorDescriptor, options?)`. A behavior descriptor defines options, an optional **handle**, a stage-scoped system, and often an FSM in `@zylem/behaviors`. Example: **WorldBoundary2DBehavior** keeps an entity inside axis-aligned bounds.

## entity

A runtime object implementing `GameEntity`, usually created via factories such as `createSphere` or `createActor`. Entities have transforms, rendering, optional physics colliders, lifecycle callbacks, and attached behaviors.

## game

The instance returned by `createGame(...)`. It owns configuration resolution, the main loop, global state (Valtio), stage loading, and disposal. Must call `start()` (or assign to `<zylem-game>`) before frames run.

## globals

Reactive game-wide state stored through Valtio and initialized from `globals` on the game config. Use for score, inventory flags, or UI-visible values that outlive a single stage.

## handle

Object returned from `entity.use(...)` when a behavior exposes imperative APIs— for example reading boundary hits or driving a behavior FSM. Optional; not every behavior returns a handle.

## perspective

Camera framing mode for a stage (third person, first person, fixed, etc.). Configured on the stage/camera pipeline, not on individual entities.

## runtime

The `@zylem/runtime` WASM package: ECS storage, Rapier physics, and fixed-timestep stepping. Consumed indirectly through `@zylem/behaviors`; not part of typical game imports.

## simulation

The `@zylem/behaviors` layer: `createSimulation()`, entity registry, behavior FSMs, event translation, and ownership of the **runtime** instance. Game-lib forwards inputs and applies snapshots each frame.

## stage

A scene plus camera, lighting, entities, and stage-local settings. Represented by `createStage(...)` and managed by the stage manager when navigating between levels or menus.

## subpath

Public npm entry such as `@zylem/game-lib/core` or `@zylem/game-lib/entity`. Application code should import subpaths only, not a package root barrel.

## web component host

The `<zylem-game>` custom element (`ZylemGameElement`). Provides a shadow-DOM canvas container, calls `start()` when `game` is assigned, syncs size via `ResizeObserver`, and disposes on disconnect. Register by importing `@zylem/game-lib/web-components`.

## Layer stack (fixed order)

**game-lib → behaviors → runtime**

| Layer | Package | Responsibility |
| --- | --- | --- |
| Game framework | `@zylem/game-lib` | Rendering, input, assets, stages, entities, actions |
| Simulation | `@zylem/behaviors` | Simulation object, behavior FSMs, WASM bridge |
| Runtime | `@zylem/runtime` | WASM ECS and Rapier physics |

## API reference

- [Core module](/docs/api/core)
- [Entity module](/docs/api/entity)
- [Behavior module](/docs/api/behavior)
- [Web components](/docs/api/web-components)
