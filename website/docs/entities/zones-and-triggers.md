---
title: Zones and triggers
description: Sensor volumes with enter, held, and exit callbacks
sidebar_position: 6
---

[createZone](/docs/api/entity/functions/createZone) defines an invisible **sensor** volume. When another entity’s collider intersects the zone, the engine tracks occupancy and invokes your **enter**, **held**, and **exit** callbacks. Zones do not render; they are ideal for goals, checkpoints, damage auras, and interaction prompts.

## Minimal example

`website/snippets/entities/zones-and-triggers.ts`:

```typescript
import { createZone } from '@zylem/game-lib/entity';

const goal = createZone({
  name: 'goal-zone',
  size: { x: 4, y: 2, z: 4 },
  position: { x: 0, y: 1, z: 5 },
});

goal
  .onEnter(({ visitor, globals }) => {
    (globals as { inGoal?: boolean }).inGoal = true;
  })
  .onExit(({ visitor, globals }) => {
    (globals as { inGoal?: boolean }).inGoal = false;
  });
```

## Callbacks

Register with fluent helpers or inline options:

| Callback | When | Context |
| --- | --- | --- |
| [onEnter](/docs/api/entity/classes/ZylemZone#onenter) | First frame of overlap | [OnEnterParams](/docs/api/entity/type-aliases/OnEnterParams) |
| [onHeld](/docs/api/entity/classes/ZylemZone#onheld) | Each frame while overlapping | [OnHeldParams](/docs/api/entity/type-aliases/OnHeldParams) (`heldTime` accumulates) |
| [onExit](/docs/api/entity/classes/ZylemZone#onexit) | Overlap ends | [OnExitParams](/docs/api/entity/type-aliases/OnExitParams) |

Each params object includes `self` (the zone), `visitor` (the other entity), and `globals`. Held callbacks also receive `delta`.

Zones use [zoneCollision](/docs/api/entity/functions/zoneCollision) internally with `static: true` and sensor semantics so visitors keep their dynamic bodies.

## Variations

- Size defaults to `{ x: 1, y: 1, z: 1 }`; scale tall volumes for jump-through goals or flat pads for floor triggers.
- Filter who can trigger via `collisionType` / `collisionFilter` on the zone or visitor entities ([Physics collisions](/docs/physics/collisions)).
- For one-shot logic, gate `onHeld` with `heldTime` thresholds instead of polling distance in `onUpdate`.

## Pitfalls

- **Visitor identity** — callbacks receive the concrete `GameEntity` instance; compare `visitor.options.name` or attach a tag in `custom` if you spawn many similar bodies.
- **Exit ordering** — exits flush at the end of the collision pass; do not assume enter/exit pairs align with render frames when time scale changes.
- **No mesh** — zones are invisible in-game; use editor selection bounds or a debug box entity during level design if you need a visual guide.

## API reference

- [createZone](/docs/api/entity/functions/createZone)
- [ZylemZone](/docs/api/entity/classes/ZylemZone)
- [ZONE_TYPE](/docs/api/entity/variables/ZONE_TYPE)
- [OnEnterParams](/docs/api/entity/type-aliases/OnEnterParams) · [OnHeldParams](/docs/api/entity/type-aliases/OnHeldParams) · [OnExitParams](/docs/api/entity/type-aliases/OnExitParams)
