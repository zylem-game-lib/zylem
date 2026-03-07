# First Person

## Purpose

High-level first-person controller that drives movement, look, and optional
viewmodel placement.

## Options

- `walkSpeed`
- `runSpeed`
- `lookSensitivity`
- `eyeHeight`
- `perspective`
- `viewmodel`

## Runtime components

- `firstPerson`
- `$fps`
- `firstPersonState`
- `FirstPersonFSM`

## Handle methods

- `getState()`
- `getYaw()`
- `getPitch()`
- `attachViewmodel(entity, offset)`

## Example

```ts
const controller = player.use(FirstPersonController, {
  perspective: fpsPerspective,
  walkSpeed: 8,
  runSpeed: 16,
});
```

## Composition notes

Use for bundled FPS movement. Pair with `Jumper3D` when jump behavior should
remain composable instead of being baked into the controller.
