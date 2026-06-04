# Platformer 3D

## Purpose

Higher-level 3D platformer controller that bundles movement, jump/fall state,
and ground detection.

## Options

- `walkSpeed`
- `runSpeed`
- `jumpForce`
- `maxJumps`
- `gravity`
- `groundRayLength`
- `debugGroundProbe`

## Runtime components

- `platformer`
- `$platformer`
- `platformerState`
- `Platformer3DFSM`

## Handle methods

- `getState()`
- `isGrounded()`
- `getJumpCount()`
- `onPlatformCollision(ctx)`

## Example

```ts
const platformer = player.use(Platformer3DBehavior, {
  walkSpeed: 12,
  runSpeed: 24,
});
```

## Composition notes

Use this when you want one bundled controller. If you want a more composable
stack, combine a movement controller with `Jumper3D` instead.
