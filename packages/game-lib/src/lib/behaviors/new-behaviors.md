# Behaviors Guide

This directory contains the behavior system used by `entity.use(...)`.

The current architecture is:

- `behavior-descriptor.ts`: typed descriptor contract and handle typing
- `behavior-system.ts`: stage-scoped system interface and behavior-link lookup
- `use-behavior.ts`: helper for applying a behavior and narrowing the entity type
- `shared/`: internal utilities reused across behavior modules
- `<behavior>/`: one folder per public behavior module

## Core model

Each public behavior is made from a few pieces:

1. A descriptor created with `defineBehavior(...)`
2. A stage-scoped system created by `systemFactory`
3. Optional runtime components attached to the entity
4. Optional handle methods returned from `createHandle`
5. Optional FSM state when the behavior exposes discrete modes
6. Pure helpers or pure tick functions for the hot path when possible

Important: a behavior does **not** need an FSM just because it lives here.
Use an FSM only when the behavior has meaningful discrete runtime states that
the consumer needs to observe. `screen-visibility` and `ricochet-*` use FSMs.
`cooldown` does not need one. Some behaviors expose only the base handle.

## Behavior taxonomy

### Composable primitives and utilities

- `cooldown`
- `jumper-2d`
- `jumper-3d`
- `ricochet-2d`
- `ricochet-3d`
- `screen-visibility`
- `shooter-2d`
- `screen-wrap`
- `top-down-movement`
- `thruster`
- `world-boundary-2d`

These behaviors are small building blocks. They either compute results,
maintain simple state, or own one focused slice of motion.

### Higher-level controllers

- `first-person`
- `platformer-3d`

These are convenience behaviors that bundle multiple lower-level concerns into
one controller-shaped API.

## Current directory layout

```text
behaviors/
  behavior-descriptor.ts
  behavior-system.ts
  behavior.ts
  components.ts
  index.ts
  new-behaviors.md
  shared/
    bounds-2d.ts
    ground-probe-3d.ts
  cooldown/
  first-person/
  jumper-2d/
  jumper-3d/
  platformer-3d/
  ricochet-2d/
  ricochet-3d/
  screen-visibility/
  shooter-2d/
  screen-wrap/
  top-down-movement/
  thruster/
  world-boundary-2d/
```

## What belongs in a behavior folder

Use only the pieces the behavior actually needs:

- `index.ts`: barrel exports for the module
- `*.descriptor.ts`: public behavior descriptor, options, and handle types
- `*.behavior.ts`: pure or mostly-pure runtime logic when needed
- `*.fsm.ts`: only when state transitions are part of the public/runtime model
- `components.ts`: runtime config/input/state component factories when the behavior owns entity-side state
- `README.md`: concise behavior-specific documentation

Not every behavior needs every file.

## Authoring rules

- Prefer pure math/tick helpers for hot-path logic.
- Keep descriptor files focused on wiring systems, initializing components, and
  exposing handles.
- Put shared math or probe utilities in `shared/` when more than one behavior
  needs them.
- Preserve public behavior names and handle methods unless a change is strictly
  additive.
- When a behavior computes a result, prefer returning the result and letting the
  consumer decide how to apply it unless direct application is an explicit part
  of the handle API.

## Testing expectations

Each behavior should have active tests in `packages/game-lib/tests/unit/behaviors`.

Use the lightest test style that covers the behavior well:

- pure unit tests for math/tick functions
- FSM tests for state transition behavior
- small system tests for descriptor wiring and entity/ref integration
- demo coverage through `packages/examples` buildability

Skipped behavior specs should be replaced or reworked, not left dormant.

## Documentation expectations

This file is the directory-level guide.

Each behavior folder should also include a `README.md` covering:

- purpose
- options
- runtime components or state attached to the entity
- handle methods
- short usage example
- composition notes

## Public behavior modules

- [cooldown](./cooldown/README.md)
- [first-person](./first-person/README.md)
- [jumper-2d](./jumper-2d/README.md)
- [jumper-3d](./jumper-3d/README.md)
- [platformer-3d](./platformer-3d/README.md)
- [ricochet-2d](./ricochet-2d/README.md)
- [ricochet-3d](./ricochet-3d/README.md)
- [screen-visibility](./screen-visibility/README.md)
- [shooter-2d](./shooter-2d/README.md)
- [screen-wrap](./screen-wrap/README.md)
- [top-down-movement](./top-down-movement/README.md)
- [thruster](./thruster/README.md)
- [world-boundary-2d](./world-boundary-2d/README.md)
