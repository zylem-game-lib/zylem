# Top Down Movement

## Purpose

Applies direct 2D movement and facing to an entity.

## Options

- `moveSpeed`

## Runtime components

- `topDownMovement`
- `$topDownMovement`
- `topDownMovementState`

## Handle methods

- `getFacingAngle()`

## Example

```ts
const mover = player.use(TopDownMovementBehavior, {
  moveSpeed: 10,
});
```

## Composition notes

Write move input to `entity.$topDownMovement.moveX/moveY` and aim input to
`faceX/faceY`. When aim input is idle, the last facing angle is preserved.
