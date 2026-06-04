# Jumper 3D

## Purpose

Composable 3D jump behavior with coyote time, buffering, multi-jump, variable
jump height, and optional air control.

## Options

- `jumpHeight`
- `gravity`
- `maxFallSpeed`
- `maxJumps`
- `resetJumpsOnGround`
- `resetJumpsOnWall`
- `coyoteTimeMs`
- `jumpBufferMs`
- `minTimeBetweenJumpsMs`
- `variableJump`
- `planar`
- `fall`
- `groundRayLength`
- `debugGroundProbe`

## Runtime components

- `jumper`
- `$jumper`
- `jumperState`
- `Jumper3DFSM`

## Handle methods

- `getState()`
- `isJumping()`
- `getJumpsUsed()`
- `getJumpsRemaining()`

## Example

```ts
const jumper = player.use(Jumper3D, {
  jumpHeight: 2.5,
  maxJumps: 2,
});
```

## Composition notes

Designed to compose with `FirstPersonController` or another movement behavior.
It primarily owns vertical motion, with optional airborne planar control.
