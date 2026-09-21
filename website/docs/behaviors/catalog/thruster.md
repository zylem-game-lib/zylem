---
title: Thruster
description: Asteroids-style thrust and rotation
sidebar_position: 3
---

`ThrusterBehavior` applies linear and angular thrust through the WASM runtime. Input lives on `$thruster` (`thrust`, `rotate`, optional `thrustX` / `thrustY` for vector thrust). An FSM tracks idle, active, boost, docked, and disabled modes for presentation or gating without touching Rapier directly.

## Minimal example

`website/snippets/behaviors/catalog/thruster.ts`:

```typescript
import { ThrusterBehavior } from '@zylem/game-lib/behavior';

ship.use(ThrusterBehavior, { linearThrust: 15, angularThrust: 8 });

ship.onUpdate(({ inputs }) => {
  ship.$thruster.thrust = inputs.p1.buttons.A.held > 0 ? 1 : 0;
  ship.$thruster.rotate = inputs.p1.axes.Horizontal.value;
});
```

For twin-stick vector thrust plus shooting, use [MultidirectionalSpaceShooterCoordinator](/docs/behaviors/coordinators) instead of hand-wiring rotation and `Shooter2DBehavior`.

## Options

| Option | Default | Notes |
| --- | --- | --- |
| `linearThrust` | 10 | Forward force scale. |
| `angularThrust` | 5 | Rotation torque scale. |
| `linearDamping` | optional | Override damping. |

## Pitfalls

- Entity needs a dynamic rigid body; thrust does nothing on kinematic-only entities.
- FSM observes input; it does not zero `$thruster` for you when disabled—gate input in game code if needed.

## API reference

- [`ThrusterBehavior`](/docs/api), [`ThrusterFSM`](/docs/api), [`ThrusterState`](/docs/api)
- Generated reference: [API](/docs/api)
