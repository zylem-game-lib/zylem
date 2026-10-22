---
title: API cheatsheet
description: Public game-author functions, one line each
sidebar_position: 6
---

The calls most games make, grouped by import. Each name links to its signature in the [API reference](/docs/api). Editor tooling, the runtime, schemas, and shader-authoring exports stay there.

## [Game and stage](/docs/game-and-stages/game)

`@zylem/game-lib/core`. Stage setup is in [Stages](/docs/game-and-stages/stages).

| Name | What it does |
| --- | --- |
| [`createGame`](/docs/api/core/functions/createGame) | Build the game from stages, entities, or a config. It owns the loop, input, and stage list. |
| [`gameConfig`](/docs/api/core/functions/gameConfig) | Typed session config — id, globals, resolution, device profile — passed into `createGame`. |
| [`start`](/docs/api/core/classes/Game#start) | Resolve config, load the first stage, and start requesting frames. |
| [`pause`](/docs/api/core/classes/Game#pause), [`resume`](/docs/api/core/classes/Game#resume) | Pause the loop, or resume it and reset the frame timer. |
| [`reset`](/docs/api/core/classes/Game#reset) | Reload the first stage. Pass a transition to blend instead of cutting. |
| [`nextStage`](/docs/api/core/classes/Game#nextstage), [`previousStage`](/docs/api/core/classes/Game#previousstage) | Load the next or previous stage. Pass a transition to blend instead of cutting. |
| [`setInputConfiguration`](/docs/api/core/classes/Game#setinputconfiguration) | Merge keyboard, mouse, and touch presets onto the game or a [stage](/docs/api/core/functions/createStage). Later configs win on key conflicts. |
| [`onSetup`](/docs/api/core/classes/Game#onsetup), [`onUpdate`](/docs/api/core/classes/Game#onupdate), [`onDestroy`](/docs/api/core/classes/Game#ondestroy) | Game hooks: after the first stage’s setup, once per frame, and when the game is torn down. |
| [`createStage`](/docs/api/core/functions/createStage) | Build a stage: scene, physics, cameras, and entities. |
| [`stageConfig`](/docs/api/core/functions/stageConfig) | Typed stage config: background, gravity, variables, physics rate, and post effects. |
| [`stage.add`](/docs/api/core/functions/createStage) | Add entities before or after the stage loads. |
| [`stage.onSetup`](/docs/api/core/functions/createStage), [`onUpdate`](/docs/api/core/functions/createStage), [`onDestroy`](/docs/api/core/functions/createStage) | Stage hooks: when the stage starts, every frame, and when it unloads. |
| [`getEntityByName`](/docs/api/core/functions/createStage) | Find a live entity on the loaded stage by name. |
| [`addCamera`](/docs/api/core/functions/createStage), [`setActiveCamera`](/docs/api/core/functions/createStage) | Register a camera on the stage and choose which one draws. |
| [`entitySpawner`](/docs/api/core/functions/entitySpawner) | Spawn a factory onto a live stage at absolute coordinates, or relative to another entity. |
| [`vessel`](/docs/api/core/functions/vessel) | Empty group that forwards lifecycle events to its children. |
| [`crossfadeTransitionShader`](/docs/api/core/variables/crossfadeTransitionShader) | Default blend when `nextStage`, `previousStage`, or `reset` passes a transition. |

## [Camera](/docs/camera/overview)

Also `@zylem/game-lib/core`.

| Name | What it does |
| --- | --- |
| [`createCamera`](/docs/api/core/functions/createCamera) | Camera handle: projection, viewport, targets, and the pose pipeline. |
| [`createPerspective`](/docs/api/core/functions/createPerspective), [`Perspectives`](/docs/api/core/variables/Perspectives) | Build a framing mode. `Perspectives` names third person, first person, fixed 2D, and the other built-ins. |
| [`addTarget`](/docs/api/core/classes/CameraWrapper#addtarget), [`setPerspective`](/docs/api/core/classes/CameraWrapper#setperspective), [`addBehavior`](/docs/api/core/classes/CameraWrapper#addbehavior), [`setViewport`](/docs/api/core/classes/CameraWrapper#setviewport) | Frame an entity, switch framing, install a keyed pipeline behavior, or set the canvas rectangle in 0–1 fractions. |
| [`createFollowTarget`](/docs/api/core/functions/createFollowTarget) | Lerp the camera toward a target plus an offset. |
| [`createPlatformFollow`](/docs/api/core/functions/createPlatformFollow) | Follow per axis with delay, settle, or off, so a jump can leave the camera still until landing. |
| [`createStrategyPan`](/docs/api/core/functions/createStrategyPan) | Pan from the viewport edges or a stick. |
| [`setCameraFeed`](/docs/api/core/functions/setCameraFeed) | Draw a camera’s offscreen view onto a mesh. |

## [Entities](/docs/entities/overview)

`@zylem/game-lib/entity`.

| Name | What it does |
| --- | --- |
| [`createBox`](/docs/api/entity/functions/createBox) | Cube mesh and collider. |
| [`createSphere`](/docs/api/entity/functions/createSphere) | Sphere mesh and collider. |
| [`createPlane`](/docs/api/entity/functions/createPlane) | Ground or wall plane, including tiles and height maps. |
| [`createSprite`](/docs/api/entity/functions/createSprite) | Billboard or sprite-sheet image. |
| [`createRect`](/docs/api/entity/functions/createRect) | Screen-space rectangle, rounded rectangle, or oval. |
| [`createText`](/docs/api/entity/functions/createText) | Screen-space label. |
| [`createZone`](/docs/api/entity/functions/createZone) | Invisible sensor with enter, held, and exit callbacks. |
| [`createActor`](/docs/api/entity/functions/createActor) | Loaded 3D model with animation and a collider fit to the mesh. |
| [`createDisk`](/docs/api/entity/functions/createDisk), [`createCone`](/docs/api/entity/functions/createCone), [`createPyramid`](/docs/api/entity/functions/createPyramid), [`createCylinder`](/docs/api/entity/functions/createCylinder), [`createPill`](/docs/api/entity/functions/createPill) | Extra solid meshes: disk, cone, pyramid, cylinder, and capsule. |
| [`createLight`](/docs/api/entity/functions/createLight) | Ambient, hemisphere, directional, point, or spot light. |
| [`createFog`](/docs/api/entity/functions/createFog) | Scene fog, with optional height falloff and noise. |
| [`createLine`](/docs/api/entity/functions/createLine) | World-space polyline. |
| [`createParticleSystem`](/docs/api/entity/functions/createParticleSystem) | An entity that plays a particle effect. |
| [`createCooldownIcon`](/docs/api/entity/functions/createCooldownIcon) | HUD icon that sweeps from a named cooldown. |
| [`destroy`](/docs/api/entity/functions/destroy) | Run the entity’s destroy lifecycle and release it. |
| [`onSetup`](/docs/api/entity/interfaces/GameEntity#onsetup), [`onUpdate`](/docs/api/entity/interfaces/GameEntity#onupdate), [`onDestroy`](/docs/api/entity/interfaces/GameEntity#ondestroy) | Entity hooks for spawn, each frame, and teardown. |
| [`use`](/docs/api/entity/interfaces/GameEntity#use) | Attach a behavior and return its handle. |
| [`add`](/docs/api/entity/interfaces/GameEntity#add) | Attach mesh parts, colliders, or child entities. |
| [`onCollision`](/docs/api/entity/interfaces/GameEntity#oncollision) | Run a callback when this entity’s collider hits another. |
| [`runAction`](/docs/api/entity/interfaces/GameEntity#runaction), [`action`](/docs/api/entity/interfaces/GameEntity#action) | Play a timed action until it finishes, or keep a persistent action until you clear it. |
| [`setPosition`](/docs/api/entity/interfaces/GameEntity#setposition), [`moveXY`](/docs/api/entity/interfaces/GameEntity#movexy), [`setRotationY`](/docs/api/entity/interfaces/GameEntity#setrotationy) | Place the entity, set this frame’s planar velocity, or set yaw. |

## [Behaviors](/docs/behaviors/overview)

`@zylem/game-lib/behavior`. Attach with `entity.use`.

| Name | What it does |
| --- | --- |
| [`WorldBoundary2DBehavior`](/docs/api/behavior/variables/WorldBoundary2DBehavior), [`WorldBoundary3DBehavior`](/docs/api/behavior/variables/WorldBoundary3DBehavior) | Report which edges the body is touching, and clamp movement along blocked axes. |
| [`ScreenWrapBehavior`](/docs/api/behavior/variables/ScreenWrapBehavior) | Teleport to the opposite edge of a rectangle. |
| [`Ricochet2DBehavior`](/docs/api/behavior/variables/Ricochet2DBehavior), [`Ricochet3DBehavior`](/docs/api/behavior/variables/Ricochet3DBehavior) | Compute a bounce from a collision normal. |
| [`Platformer2DBehavior`](/docs/api/behavior/variables/Platformer2DBehavior), [`Platformer3DBehavior`](/docs/api/behavior/variables/Platformer3DBehavior) | Walk, run, jump, and ground state. The runtime owns the character controller. |
| [`Jumper2DBehavior`](/docs/api/behavior/variables/Jumper2DBehavior), [`Jumper3DBehavior`](/docs/api/behavior/variables/Jumper3DBehavior) | Coyote time, jump buffering, and multi-jump, paired with your own horizontal movement. |
| [`TopDownMovementBehavior`](/docs/api/behavior/variables/TopDownMovementBehavior) | Top-down move and facing. |
| [`ThrusterBehavior`](/docs/api/behavior/variables/ThrusterBehavior) | Linear and angular thrust from an input vector. |
| [`FirstPersonBehavior`](/docs/api/behavior/variables/FirstPersonBehavior) | First-person move and look. |
| [`Shooter2DBehavior`](/docs/api/behavior/variables/Shooter2DBehavior) | Spawn projectiles from a factory on a cooldown when fire is requested. |
| [`ScreenVisibilityBehavior`](/docs/api/behavior/variables/ScreenVisibilityBehavior) | Track whether the entity is inside an active camera frustum. |
| [`Destructible3DBehavior`](/docs/api/behavior/variables/Destructible3DBehavior) | Fracture a mesh into physics fragments. |
| [`ParticleEmitterBehavior`](/docs/api/behavior/variables/ParticleEmitterBehavior), [`particlePresets`](/docs/api/behavior/variables/particlePresets) | Play a GPU particle effect on an entity. `particlePresets` builds the effect definition. |
| [`CooldownBehavior`](/docs/api/behavior/variables/CooldownBehavior) | Named timers on an entity, with ready, fire, reset, and progress on the handle. |
| [`registerCooldown`](/docs/api/behavior/functions/registerCooldown), [`fireCooldown`](/docs/api/behavior/functions/fireCooldown), [`getCooldown`](/docs/api/behavior/functions/getCooldown), [`tickCooldowns`](/docs/api/behavior/functions/tickCooldowns) | Register, fire, read, and tick named cooldowns in the shared store that cooldown icons read. |

## [Actions](/docs/actions/overview)

`@zylem/game-lib/actions`. Pass them to `runAction` or `action`. Durations are in milliseconds. Per-frame movement is the entity methods above.

| Name | What it does |
| --- | --- |
| [`moveBy`](/docs/api/actions/functions/moveBy) | Move by an offset over a duration. |
| [`moveTo`](/docs/api/actions/functions/moveTo) | Move to a position over a duration. |
| [`rotateBy`](/docs/api/actions/functions/rotateBy) | Rotate by an Euler offset, in degrees, over a duration. |
| [`fadeOpacity`](/docs/api/actions/functions/fadeOpacity) | Lerp material opacity. |
| [`delay`](/docs/api/actions/functions/delay), [`callFunc`](/docs/api/actions/functions/callFunc) | Wait, or run a function once, as a step in a sequence. |
| [`sequence`](/docs/api/actions/functions/sequence), [`parallel`](/docs/api/actions/functions/parallel), [`repeat`](/docs/api/actions/functions/repeat), [`repeatForever`](/docs/api/actions/functions/repeatForever) | Run actions in order, at the same time, or in a loop. |
| [`throttle`](/docs/api/actions/functions/throttle), [`onPress`](/docs/api/actions/functions/onPress), [`onRelease`](/docs/api/actions/functions/onRelease) | Stay registered: ready every few milliseconds, or a one-frame press or release edge. |

## [Input](/docs/input/overview)

`@zylem/game-lib/input`, plus `defaultTouchControls` from `@zylem/game-lib/input-ui`. Pass the result to `setInputConfiguration`. In `onUpdate`, read `inputs.p1.axes` and `inputs.p1.buttons`.

| Name | What it does |
| --- | --- |
| [`useArrowsForAxes`](/docs/api/input/functions/useArrowsForAxes), [`useWASDForAxes`](/docs/api/input/functions/useWASDForAxes), [`useIJKLForAxes`](/docs/api/input/functions/useIJKLForAxes), [`useArrowsForSecondaryAxes`](/docs/api/input/functions/useArrowsForSecondaryAxes) | Map arrow, WASD, or IJKL keys onto primary axes. `useArrowsForSecondaryAxes` maps arrows onto the look axes. |
| [`useArrowsForDirections`](/docs/api/input/functions/useArrowsForDirections), [`useWASDForDirections`](/docs/api/input/functions/useWASDForDirections), [`useIJKLForDirections`](/docs/api/input/functions/useIJKLForDirections) | Map arrow, WASD, or IJKL keys onto direction buttons. |
| [`useMouse`](/docs/api/input/functions/useMouse), [`useMouseLook`](/docs/api/input/functions/useMouseLook), [`useScreenCenterLook`](/docs/api/input/functions/useScreenCenterLook) | Track the cursor, pointer-lock look onto the secondary axes, or drive yaw and pitch from the cursor’s offset to the canvas center. |
| [`useVirtualControls`](/docs/api/input/functions/useVirtualControls), [`defaultTouchControls`](/docs/api/input-ui/functions/defaultTouchControls) | Draw an on-screen joystick and buttons. `defaultTouchControls` is that layout with a theme. |
| [`mergeInputConfigs`](/docs/api/input/functions/mergeInputConfigs) | Combine presets into one config. On a key conflict, the later config wins. |

## [Globals and variables](/docs/game-and-stages/globals-and-variables)

`@zylem/game-lib/globals`.

| Name | What it does |
| --- | --- |
| [`createGlobal`](/docs/api/globals/functions/createGlobal), [`getGlobal`](/docs/api/globals/functions/getGlobal), [`setGlobal`](/docs/api/globals/functions/setGlobal) | Create a game-wide value if it is missing, read it, or write it. Paths can be dotted, such as `player.health`. |
| [`createVariable`](/docs/api/globals/functions/createVariable), [`getVariable`](/docs/api/globals/functions/getVariable), [`setVariable`](/docs/api/globals/functions/setVariable) | The same helpers, scoped to a stage or another object. |
| [`onGlobalChange`](/docs/api/globals/functions/onGlobalChange), [`onVariableChange`](/docs/api/globals/functions/onVariableChange) | Subscribe when a global or variable path changes. |

## [Audio](/docs/audio/sound-effects)

`@zylem/game-lib/audio`.

| Name | What it does |
| --- | --- |
| [`ricochetSound`](/docs/api/audio/functions/ricochetSound), [`pingPongBeep`](/docs/api/audio/functions/pingPongBeep) | Play a short procedural beep. |
| [`Howl`](/docs/api/audio/classes/Howl) | Howler class for playing sound files. |
| [`createSongPlayer`](/docs/api/audio/functions/createSongPlayer) | Play a Creator music-mode song. Tone.js loads the first time you use it. |

## [Cinematics](/docs/cinematics/playing-cutscenes)

`@zylem/game-lib/cinematics`.

| Name | What it does |
| --- | --- |
| [`createCutscenePlayer`](/docs/api/cinematics/functions/createCutscenePlayer) | Drive the live camera from a cutscene and fire its event and audio hooks. |
| [`createStageCutsceneHost`](/docs/api/cinematics/functions/createStageCutsceneHost) | Give the player a stage’s camera, entity positions, songs, and transitions. |

## [Graphics](/docs/rendering/background-shaders)

`@zylem/game-lib/graphics`.

| Name | What it does |
| --- | --- |
| [`createBackgroundShader`](/docs/api/graphics/functions/createBackgroundShader) | Wrap a TSL color node as a sky for `stageConfig`. |
