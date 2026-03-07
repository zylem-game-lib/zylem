# Screen Visibility

## Purpose

Tracks whether an entity is visible inside one or more active camera frustums.

## Options

- `cameraName`
- `requireFullyVisible`
- `padding`
- `fallbackSize`
- `onChange`
- `onEnter`
- `onExit`

## Runtime state

- `ScreenVisibilityFSM`
- cached bounds state for visibility checks

## Handle methods

- `isVisible()`
- `isOffscreen()`
- `wasJustEntered()`
- `wasJustExited()`
- `getVisibleCameraNames()`
- `getState()`

## Example

```ts
const visibility = entity.use(ScreenVisibilityBehavior, {
  cameraName: 'main',
});
```

## Composition notes

Use for camera-aware activation, UI hints, or enter/exit effects. The system is
stage-scoped and queries active cameras from the scene.
