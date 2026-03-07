# Ricochet 3D

## Purpose

Computes 3D reflection results from collision context.

## Options

- `minSpeed`
- `maxSpeed`
- `speedMultiplier`
- `reflectionMode`
- `maxAngleDeg`

## Runtime state

- `Ricochet3DFSM`
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
const ricochet = sphere.use(Ricochet3DBehavior, {
  reflectionMode: 'simple',
});
```

## Composition notes

Prefer explicit contact normals when they are available. Position-based normal
inference is a fallback for simple wall or box interactions.
