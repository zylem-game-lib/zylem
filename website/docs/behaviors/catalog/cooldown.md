---
title: Cooldown
description: Named timers shared with UI
sidebar_position: 10
---

`CooldownBehavior` registers named cooldowns on an entity and exposes ready/fire/reset/progress on the handle. Timers tick through a global store (`getCooldownStore`, `tickCooldowns`) so HUD widgets such as cooldown icons can read the same progress. No FSM—state is purely elapsed time per named entry.

## Minimal example

`website/snippets/behaviors/catalog/cooldown.ts`:

```typescript
import { CooldownBehavior } from '@zylem/game-lib/behavior';
import { moveBy } from '@zylem/game-lib/actions';

const cooldowns = hero.use(CooldownBehavior, {
  cooldowns: {
    attack: { duration: 1.5 },
    dash: { duration: 0.8, immediate: false },
  },
});

hero.onUpdate(({ me, inputs }) => {
  if (cooldowns.isReady('attack') && inputs.p1.buttons.A.pressed) {
    cooldowns.fire('attack');
  }
  if (cooldowns.isReady('dash') && inputs.p1.buttons.B.pressed) {
    cooldowns.fire('dash');
    me.runAction(moveBy({ x: 3, duration: 0.2 }));
  }
});
```

## Config

| Field | Role |
| --- | --- |
| `duration` | Seconds until ready after `fire`. |
| `immediate` | When true (default), cooldown starts ready; false starts on cooldown. |

## Standalone helpers

- `registerCooldown`, `fireCooldown`, `resetCooldown`, `getCooldown` — operate on the global store without attaching the behavior when you only need one-off timers.

## Pitfalls

- Names must match keys registered in options; unknown names throw or no-op depending on call site—stick to declared keys.
- Progress runs 0→1 where 1 is ready; UI may invert depending on art direction.
- Stage must tick cooldowns (game-lib stage systems call `tickCooldowns` each frame).

## API reference

- [`CooldownBehavior`](/docs/api), [`CooldownHandle`](/docs/api)
- [`tickCooldowns`](/docs/api), [`getCooldownStore`](/docs/api)
- Generated reference: [API](/docs/api)
