# Shooter 2D

## Purpose

Spawns and launches 2D projectiles toward a target.

## Options

- `projectileFactory`
- `projectileSpeed`
- `cooldownMs`
- `spawnOffset`
- `rotateProjectile`

## Runtime components

- `shooter2dState`

## Handle methods

- `isReady(source)`
- `fire({ source, stage, target })`

## Example

```ts
const shooter = player.use(Shooter2DBehavior, {
  projectileFactory: createBullet,
  projectileSpeed: 18,
  cooldownMs: 120,
});
```

## Composition notes

`fire(...)` is explicit about both `source` and `stage`. Pair it with a
movement behavior or coordinator that decides how aim input should be resolved.
