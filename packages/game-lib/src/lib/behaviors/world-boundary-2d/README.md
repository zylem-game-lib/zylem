# World Boundary 2D

## Purpose

Tracks which edges of a 2D world rectangle an entity is touching and exposes
movement helpers for boundary-aware motion.

## Options

- `boundaries`: `{ left, right, bottom, top }`

## Runtime state

- `WorldBoundary2DFSM`
- last computed boundary hits
- last sampled position

## Handle methods

- `getLastHits()`
- `getMovement(moveX, moveY)`

## Example

```ts
const boundary = ship.use(WorldBoundary2DBehavior, {
  boundaries: { left: -10, right: 10, bottom: -7.5, top: 7.5 },
});
```

## Composition notes

Useful for clamping player movement or as an input to ricochet coordination.
Pair with `Ricochet2DBehavior` through the boundary ricochet coordinator when
you want bounce behavior instead of hard clamping.
