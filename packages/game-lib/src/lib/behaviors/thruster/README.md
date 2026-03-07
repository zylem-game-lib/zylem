# Thruster

## Purpose

Applies Asteroids-style thrust and turn control to a physics body.

## Options

- `linearThrust`
- `angularThrust`

## Runtime components

- `thruster`
- `$thruster`
- `ThrusterFSM`

## Handle methods

- Base behavior handle only: `getFSM()`, `getOptions()`, `ref`

## Example

```ts
ship.use(ThrusterBehavior, {
  linearThrust: 10,
  angularThrust: 5,
});
```

## Composition notes

This behavior is motion-focused and works well with `ScreenWrapBehavior`.
Write input to `entity.$thruster.thrust` and `entity.$thruster.rotate`.
