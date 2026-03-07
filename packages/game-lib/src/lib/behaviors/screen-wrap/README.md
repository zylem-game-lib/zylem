# Screen Wrap

## Purpose

Wraps an entity around a 2D rectangular play area.

## Options

- `width`
- `height`
- `centerX`
- `centerY`
- `edgeThreshold`

## Runtime state

- `ScreenWrapFSM`

## Handle methods

- Base behavior handle only: `getFSM()`, `getOptions()`, `ref`

## Example

```ts
ship.use(ScreenWrapBehavior, {
  width: 30,
  height: 20,
});
```

## Composition notes

Useful for Asteroids-style playfields. Pair with `ThrusterBehavior` or other
movement code that drives the entity near the screen edges.
