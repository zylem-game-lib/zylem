# Basic API understanding

## Camera Instance API

camera.addEffect(key: string, postProcessingPass: Pass) [addEffect example](https://jsfiddle.net/ko1vteua/)
camera.updateEffect(key: string, options: PassOptions)
camera.removeEffect(key: string)
camera.addBehavior(key: string, behavior: CameraBehavior) [i.e. followPlatformer or scroller]
camera.removeBehavior(key: string)
camera.addAction(cameraAction: CameraAction) [i.e. screenshake, temporary things]
camera.addWaypoints(...waypoints: CameraWaypoints) [waypoints example](https://jsfiddle.net/dLsg5o8u/)

### Perspectives

- Third Person 3D (Mario 64, World of Warcraft, etc)
- Isometric (Crossy Road, Starcraft 2, Diablo 4)
- First Person (Quake, Doom, Halo)
- 2D (Super Mario World, Metroid, The Legend of Zelda)
- Fixed Version (Pong, Breakout, Pacman)
- Isometric/Top-down (Diablo 1+2, Starcraft 1, Warcraft 1)
- Fixed 3D Prerendering (Final Fantasy 7, Resident Evil 1+2)

---

## 1) North-star goals

**Primary goals**

1. One `createCamera(...options)` that can produce any “camera experience” via _composition_ (perspectives + behaviors + actions + waypoints + effects).
2. Deterministic update order and predictable overrides (no “why is it jittering?” mysteries).
3. Smoothness tools built-in (damping, dead-zones, predictive lookahead, fixed timestep options).
4. Easy to extend: adding a new behavior/action/effect shouldn’t require editing core camera code.

**Non-goals (explicit)**

- Don’t build a full cinematic editor yet (only waypoints + simple runtime controls).
- Don’t hard-couple to a specific renderer beyond a thin adapter layer (Three.js now, but keep it abstract).

---

## 2) Mental model: the camera pipeline

Every frame, the camera should run a single pipeline with clear stages:

1. **Input collection** (target transforms, player input, time, dt, viewport)
2. **Base perspective** computes a _desired_ camera pose (position/rotation/FOV/zoom) from targets.
3. **Behaviors** modify desired pose (follow rules, constraints, collision, framing).
4. **Waypoints** optionally override/blend the pose (rails, cut-like transitions).
5. **Actions** apply transient offsets (screenshake, recoil, hit-stop camera bump).
6. **Smoothing** converts desired pose → final pose (damping/spring).
7. **Commit** final pose to underlying camera (Three camera, etc.)
8. **Post-processing effects** run in render pipeline (Passes)

Key concept: **separate “desired pose” from “final pose.”** Most bugs go away when everything writes to desired, and only one place finalizes.

---

## 3) Public API contracts (what you already have + what must be true)

You already have:

- `createCamera(...options: CameraOptions): CameraWrapper`
- Effects: `addEffect/updateEffect/removeEffect`
- Behaviors: `addBehavior/removeBehavior`
- Actions: `addAction`
- Waypoints: `addWaypoints`

What the agent must implement/maintain:

### CameraWrapper invariants

- `camera.addBehavior(key)` is **idempotent** per key (replace/overwrite allowed, but defined).
- `camera.addEffect(key)` is **idempotent** per key.
- `camera.addAction(action)` returns a **handle** or action has internal “done” state; actions must self-expire or be removable.
- `camera.addWaypoints(...wps)` appends by default; provide an option to replace/clear (even if via another method).

If you don’t want to expand the surface API, implement “replace semantics” via options on the waypoint object (e.g. `{ mode: 'replace' }`).

---

## 4) Core data types the agent should standardize around

### Pose + modifiers

```ts
export type CameraPose = {
  position: Vec3;
  rotation: Quat; // or Euler but pick one and stick to it
  fov?: number;
  zoom?: number;
  near?: number;
  far?: number;
  // optional: target point / lookAt for convenience
  lookAt?: Vec3;
};

export type PoseDelta = {
  position?: Vec3;
  rotation?: Quat;
  fov?: number;
  zoom?: number;
};
```

### Context (what every module receives)

```ts
export type CameraContext = {
  dt: number;
  time: number;
  viewport: { width: number; height: number; aspect: number };
  input?: unknown; // optional now; later unify input
  targets: Record<string, TransformLike>; // player, boss, focus points, etc.
  debug?: { enabled: boolean; draw: (x: any) => void };
};
```

### Behavior / Action interfaces

```ts
export type CameraBehavior = {
  // called every frame
  update(ctx: CameraContext, pose: CameraPose): CameraPose;
  // optional hooks
  onAttach?(ctx: CameraContext): void;
  onDetach?(ctx: CameraContext): void;
  priority?: number; // default 0
  enabled?: boolean;
};

export type CameraAction = {
  // actions are transient; they apply deltas
  update(ctx: CameraContext): PoseDelta;
  isDone(ctx: CameraContext): boolean;
  priority?: number;
};
```

### Waypoints: rails + blending

Waypoints should support:

- time-based interpolation (duration)
- curve path (Catmull-Rom / Bezier)
- “lookAt” rails separate from position rails
- easing
- blending in/out

```ts
export type CameraWaypoint = {
  at?: number; // absolute time OR
  duration?: number; // relative segment duration
  pose: Partial<CameraPose>;
  easing?: EasingName;
  hold?: number;
  mode?: 'append' | 'replace'; // optional control
};
```

---

## 5) Ordering and conflict rules (this is _critical_)

Tell the agent these rules are non-negotiable:

1. **Perspective is the base pose** (exactly one active perspective at a time; switching uses blending).
2. **Behaviors run next**, in `priority` order (low→high or high→low, but define it and keep it consistent).
3. **Waypoints can override** base/behavior pose using blending weights.
4. **Actions apply last** as deltas (so shake affects everything).
5. **Smoothing runs after all of the above** unless a module explicitly opts out.

Also define how multiple modules modify the same field:

- Position: additive or replace? (recommend: behaviors return a full pose; actions are additive deltas)
- Rotation: prefer slerp composition, not Euler addition.
- FOV/zoom: last-write-wins by priority, or blend by weight.

---

## 6) Perspectives: implement as presets + parameters

Instead of hardcoding “Third person / First person / 2D”, define them as **Perspective modules** that output a base pose.

### Perspective interface

```ts
export type CameraPerspective = {
  id: string;
  getBasePose(ctx: CameraContext): CameraPose;
  // optional: constraints or defaults for smoothing
  defaults?: { damping?: number; collision?: boolean };
};
```

### Required perspectives (v1)

- **Third Person 3D**
  - params: distance, height, shoulderOffset, pitch, yaw (or auto-yaw), targetKey
  - optional: auto-rotate based on movement direction

- **Isometric 3D**
  - params: angle (pitch/yaw), distance, targetKey, screen-space padding

- **First Person**
  - params: targetKey, eyeOffset, recoil hooks (via actions)

- **2D Side-scroller**
  - params: axis locks, deadzone, lookahead, bounds

- **2D Fixed**
  - params: fixed pose or fixed bounds framing

- **Top-down / 2D Isometric**
  - params: height, pitch, yaw, follow smoothing

- **Fixed 3D pre-render**
  - params: list of fixed cameras + triggers (waypoints can handle this)

Implementation note: “Fixed 3D prerender” is basically **waypoints + trigger volumes**; don’t special-case beyond helper behavior.

---

## 7) Behaviors library (starter set)

Ask the agent to implement these as separate files, composable:

**Follow behaviors**

- `followTarget` (core): follow a target transform with offsets, damping
- `platformerScroller`: deadzone + lookahead + vertical clamp
- `multiTargetFraming`: keep multiple targets in view by adjusting distance/FOV

**Constraints**

- `axisLock` (lock X/Y/Z translation or yaw/pitch/roll)
- `boundsClamp` (world bounds)
- `cameraCollision` (raycast/sweep to prevent clipping)

**Utility**

- `pixelPerfect2D` (snap camera to pixel grid)
- `shakeResistance` (reduce shake on certain axes)

Each behavior should be small and parameterized, not “one giant camera brain”.

---

## 8) Actions (transient effects) you want supported

Define actions as small “time functions → delta”.

**Must-haves**

- `screenShake({ amplitude, frequency, duration, falloff, axes })`
- `impulse({ posDelta?, rotDelta?, duration, easing })`
- `recoil({ pitch, yaw, duration })`
- `zoomPulse({ amount, duration })`

Actions should be stackable; order by priority; expired actions auto-remove.

---

## 9) Post-processing effects (Pass management)

Define a minimal “effect registry” contract:

- `addEffect(key, pass)` adds/overwrites pass and inserts into composer order.
- `updateEffect(key, options)` calls pass setters safely (no reflection magic unless you standardize it).
- `removeEffect(key)` removes and disposes if needed.

Also define **ordering**: effects should have an `order` number (default 0), so bloom can run after render pass but before FXAA, etc.

---

## 10) Debugging hooks (required for iteration speed)

Tell the agent to include:

- `camera.getState()` returning:
  - active perspective id
  - desired pose
  - final pose
  - active behaviors/actions/effects/waypoint segment + blend

- Optional debug draw:
  - frustum outline
  - target points
  - deadzone rectangle (2D)
  - collision ray

This will save you days.

---

## 11) Acceptance tests (concrete “done means done”)

Give the agent these test scenarios:

1. **Determinism**: same inputs → identical final pose (within epsilon).
2. **Priority**: higher priority behavior overrides lower; actions always apply last.
3. **Waypoint blending**: entering waypoint sequence smoothly blends from current pose, no jumps.
4. **Screen shake**: does not drift camera permanently; returns to baseline.
5. **2D pixel perfect**: camera movement snaps exactly to pixel grid when enabled.
6. **Collision**: third-person camera never clips through walls (basic case).
7. **Effect management**: add/update/remove doesn’t leak; composer order stable.

---

## 12) Milestones for the agent (so they don’t boil the ocean)

**Milestone A (core skeleton)**

- Pose pipeline + context + perspective base + behaviors + actions
- `getState()` debug
- A single third-person perspective + followTarget behavior

**Milestone B (2D + waypoints)**

- 2D sidescroller preset + deadzone/lookahead
- waypoint rails with easing + blending

**Milestone C (collision + polish)**

- camera collision behavior
- screen shake action
- effect registry order + disposal

---

## 13) A “hand-off” spec you can paste to the agent

You can literally paste this as the top comment in a ticket:

```md
Implement camera as a deterministic pose pipeline:
Perspective -> Behaviors (priority) -> Waypoints (blend/override) -> Actions (deltas) -> Smoothing -> Commit -> PostFX.

Standardize on CameraPose + PoseDelta + CameraContext.
Behaviors return full pose; Actions return deltas and self-expire.
Provide getState() for debugging: desired pose, final pose, active modules.

V1 perspectives: third-person, isometric, first-person, 2D side-scroller, top-down, fixed.
V1 behaviors: followTarget, deadzone+lookahead scroller, axisLock, boundsClamp, cameraCollision.
V1 actions: screenShake, impulse, recoil, zoomPulse.

Effects registry must be keyed, ordered, and removable with disposal.
Add acceptance tests for determinism, blending, shake stability, and collision.
```

---

If you want, paste what `CameraOptions`, `CameraWrapper`, and your existing `CameraBehavior` types look like today, and I’ll rewrite the above into a drop-in spec that matches your exact naming + patterns (including how you do vectors/quats in Zylem).
