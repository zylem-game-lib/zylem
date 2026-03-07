# Jumper 2D

## Purpose

Composable 2D jump behavior that owns vertical motion only.

## Options

- `jumpHeight`
- `gravity`
- `maxFallSpeed`
- `maxJumps`
- `resetJumpsOnGround`
- `coyoteTimeMs`
- `jumpBufferMs`
- `minTimeBetweenJumpsMs`
- `variableJump`
- `groundRayLength`
- `debugGroundProbe`

## Runtime components

- `jumper2d`
- `$jumper2d`
- `jumper2dState`
- `Jumper2DFSM`

## Handle methods

- `getState()`
- `isJumping()`
- `getJumpsUsed()`
- `getJumpsRemaining()`

## Example

```ts
const jumper = player.use(Jumper2D, {
  jumpHeight: 3.5,
  maxJumps: 2,
});
```

## Composition notes

This behavior writes only Y velocity through velocity intents. Horizontal
movement should come from demo code or another controller.
