---
title: Camera feed
description: setCameraFeed for texture/video sources
sidebar_position: 4
---

**Camera feeds** render a secondary camera into a texture and display that texture on an in-scene mesh — security monitors, jumbotrons, portals, or picture-in-picture props.

## How it works

1. Create a camera with an offscreen target (`renderToTexture: { width, height }`) or let `setCameraFeed` allocate one.
2. Register the camera on the stage like any other camera so it updates and renders each frame.
3. Call `setCameraFeed(entity, camera)` on an entity with a mesh; the helper replaces the mesh material with a `MeshBasicMaterial` mapped to the camera’s render texture.

The feed camera uses the same pipeline, targets, and viewports as a normal camera. Only the **output** goes to a `RenderTarget` instead of a screen viewport (unless you also give it a partial viewport).

## Example

See `website/snippets/camera/camera-feed-screen.ts`:

- `feedCamera` with `renderToTexture`
- A thin box as the screen
- `setCameraFeed(me, feedCamera)` in `onSetup`

You can also call `camera.getRenderTexture()` and assign the texture yourself if you need a custom material or shader.

## Options

`CameraFeedOptions` (`width`, `height`) apply **only when the camera does not already have** a render target. Prefer sizing via `renderToTexture` at construction for predictable resolution.

## Multi-camera notes

The feed camera must be in the stage’s camera list and typically should **not** occupy the fullscreen viewport unless you want both on-screen and on-texture views. Deactivate it from the primary slot or give it a zero-size viewport if it should only render to texture — project setup varies; the common pattern is one primary gameplay camera plus RTT cameras updated by `CameraManager`.

## Pitfalls

- **Missing mesh**: `setCameraFeed` warns and returns if the entity has no mesh.
- **Performance**: Each feed camera is a full scene render at the target resolution. Keep RTT sizes modest.
- **Material replacement**: The helper overwrites `entity.mesh.material`; store a reference first if you need to restore it on destroy.

## API reference

- [setCameraFeed](/docs/api/core/functions/setCameraFeed), [CameraFeedOptions](/docs/api/core/interfaces/CameraFeedOptions)
- [CameraWrapper.getRenderTexture](/docs/api/core/classes/CameraWrapper#getrendertexture), [CameraOptions.renderToTexture](/docs/api/core/interfaces/CameraOptions)
