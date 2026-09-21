---
title: Persistent actions
description: throttle, onPress, onRelease
sidebar_position: 4
---

Persistent actions never finish (`done` stays false) and are registered with `entity.action()` so they are not removed when a notional duration elapses. They fit cooldown timers and one-frame edge detection on input or custom signals.

## Minimal example

Runnable sample: `website/snippets/actions/persistent-actions.ts`.

```ts
import { throttle, onPress, onRelease } from '@zylem/game-lib/actions';

const fireCooldown = player.action(throttle({ duration: 400 }));
const jumpPress = player.action(onPress());

player.onUpdate(({ me, inputs, delta }) => {
	jumpPress.check(inputs.p1.buttons.A.pressed);
	if (jumpPress.triggered) {
		me.moveY(8);
	}

	if (inputs.p1.buttons.X.pressed && fireCooldown.ready) {
		fireCooldown.consume();
		// fire weapon
	}
});
```

## Helpers

### `throttle({ duration })`

Repeating timer in milliseconds. Each frame the entity tick pass advances elapsed time; when elapsed reaches the interval, `ready` becomes true until you call `consume()`, which resets the timer.

### `onPress()` / `onRelease()`

Edge detectors for boolean signals (usually `inputs.p1.buttons.*.pressed`):

1. Actions tick first and clear `triggered`.
2. Your `onUpdate` calls `.check(isPressed)`.
3. `triggered` is true only on the rising (`onPress`) or falling (`onRelease`) edge.

You can feed any boolean, not just buttons.

## Pitfalls

- Do not call `throttle.tick` yourself; the entity action loop already ticks registered actions.
- Forgetting `.check()` on press/release helpers means `triggered` will always stay false.
- `onRelease` still takes the **pressed** state; it detects the transition from pressed to released.

## API reference

- [throttle](/docs/api/actions/functions/throttle)
- [onPress](/docs/api/actions/functions/onPress)
- [onRelease](/docs/api/actions/functions/onRelease)
