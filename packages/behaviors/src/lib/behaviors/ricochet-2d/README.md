# Ricochet 2D

## Purpose

Computes 2D reflection results from collision context.

## Options

- `minSpeed`
- `maxSpeed`
- `speedMultiplier`
- `reflectionMode`
- `maxAngleDeg`

## Runtime state

- `Ricochet2DFSM`
- last computed ricochet result
- cooldown timestamp
- ricochet listeners

## Handle methods

- `getRicochet(ctx)`
- `applyRicochet(ctx)`
- `getLastResult()`
- `onRicochet(callback)`

## Example

```ts
const ricochet = ball.use(Ricochet2DBehavior, {
  reflectionMode: 'angled',
});
```

## Composition notes

Pair with `WorldBoundary2DBehavior` or collision callbacks. This is compute-first:
the caller decides when and how to apply the reflected velocity.
