# Thruster

## Purpose

Applies thrust and optional turn control to a physics body.

## Options

- `linearThrust`
- `angularThrust`
- `linearDamping`

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
Write input to `entity.$thruster.thrust`/`rotate` for facing-relative thrust or
`entity.$thruster.thrustX`/`thrustY` for world-space thrust.
