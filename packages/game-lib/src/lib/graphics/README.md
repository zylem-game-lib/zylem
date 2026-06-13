# graphics

The **graphics** directory contains the rendering layer: the Three.js scene, material and mesh factories, the instancing system, fog, shaders, and custom post-processing.

## Root files

| File | Role |
|---|---|
| `zylem-scene.ts` | `ZylemScene` — thin wrapper around `THREE.Scene`; manages background colour, skybox, and the ambient light defaults |
| `mesh.ts` | `MeshFactory` — creates `THREE.Mesh` instances from a geometry + material description; shared by all entity builders |
| `material.ts` | `MaterialFactory` — resolves material options (color, texture, wireframe, PBR maps) into `THREE.Material` instances |
| `render-pass.ts` | Post-processing render pass helpers used by the camera pipeline |
| `instance-manager.ts` | `InstanceManager` — manages `THREE.InstancedMesh` for batched rendering of many identical objects |
| `runtime-instance-manager.ts` | Variant of `InstanceManager` driven by the WASM runtime's render buffer |
| `runtime-instanced-heat-material.ts` | Custom `THREE.ShaderMaterial` that colours instanced meshes by a "heat" float from the runtime buffer |

## Sub-directories

### `fog/`
Fog rendering using GLSL shader chunk replacement.

| File | Purpose |
|---|---|
| `fog-patcher.ts` | `FogMaterialPatcher` — scans the scene each frame and patches the standard Three.js fog shader chunks with height-fog and noise-modulated variants |
| `fog-shader-chunks.ts` | The GLSL replacement strings for `#include <fog_pars_fragment>` etc. |

### `geometries/`
Custom Three.js geometry constructors.

| File | Purpose |
|---|---|
| `xz-plane-geometry.ts` | Flat plane in the XZ plane (horizontal ground), as opposed to Three.js's default XY plane |

### `shaders/`
TSL (Three.js Shading Language / WebGPU node materials) and legacy GLSL shader modules.

| File | Purpose |
|---|---|
| `debug.shader.ts` | Visualises normals / UV coordinates for debugging |
| `fire.tsl.ts` | Animated fire effect using TSL noise nodes |
| `star.tsl.ts` | Procedural starfield background using TSL |
| `standard.tsl.ts` | Extended `MeshStandardNodeMaterial` with custom PBR extensions |

## How it fits in

The graphics layer sits between entities and Three.js. Entity builders call `MeshFactory` and `MaterialFactory` to produce Three.js objects, which are then added to `ZylemScene`. `InstanceManager` is used by the `massive-instancing` and similar demos and also by the WASM runtime path. The fog patcher is invoked from `ZylemFog.onUpdate` rather than being a global concern.
