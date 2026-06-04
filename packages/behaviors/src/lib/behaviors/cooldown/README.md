# Cooldown

## Purpose

Registers and advances named cooldowns in the global cooldown store.

## Options

- `cooldowns`: record of cooldown names to `{ duration, immediate? }`

## Runtime state

- No FSM
- Uses the shared cooldown store in `cooldown-store.ts`

## Handle methods

- `isReady(name)`
- `fire(name)`
- `reset(name)`
- `getProgress(name)`

## Example

```ts
const cooldowns = player.use(CooldownBehavior, {
  cooldowns: {
    attack: { duration: 0.5 },
  },
});
```

## Composition notes

Use with actions, UI, or combat behaviors that need named timers.
