# Destructible 3D

`destructible-3d` adds `three-pinata` mesh fracturing to a Zylem entity.

## What It Does

- fractures the entity's primary mesh using `@dgreenheck/three-pinata`
- swaps the entity's collider set to per-fragment colliders
- restores the original mesh and colliders with `repair()`

This behavior defaults to compound fragment physics for compatibility, but it
can also spawn independent runtime fragment bodies.

## Usage

```ts
import {
	Destructible3DBehavior,
	FractureOptions,
	createBox,
} from '@zylem/game-lib';

const crate = createBox({
	name: 'crate',
});

const destructible = crate.use(Destructible3DBehavior, {
	fractureOptions: new FractureOptions({
		fractureMethod: 'voronoi',
		fragmentCount: 24,
		voronoiOptions: {
			mode: '3D',
		},
	}),
	fragmentPhysics: {
		mode: 'independent',
		outwardVelocity: 4,
	},
});

crate.onCollision(() => {
	destructible.fracture();
});
```

## Options

- `fractureOptions`: default `three-pinata` fracture settings
- `innerMaterial`: optional material for interior faces
- `collider`: fragment collider settings
- `fragmentPhysics`: fragment runtime behavior (`compound` by default)
- `prebakeWorkerUrl`: optional URL for the `destructible-prebake-worker` module; when set, `prebakeAsync()` runs fracture in a Web Worker via [Comlink](https://github.com/GoogleChromeLabs/comlink)

## Handle Methods

- `fracture(overrideOptions?)`
- `prebake(overrideOptions?)` — main-thread Voronoi prebake (geometry only; does not spawn fragment entities)
- `prebakeAsync(overrideOptions?)` — uses the worker when `prebakeWorkerUrl` is set; otherwise same as `prebake()` wrapped in a resolved promise
- `repair()`
- `isFractured()`
- `getFragments()`

## Notes

- The source mesh should be manifold/watertight for reliable results.
- If `entity.mesh` is unset but the entity has a loaded `group`, the behavior
  uses the first mesh it finds as the fracture source. Set `entity.mesh`
  yourself when you need a specific child mesh.
- Optimized GLB sources are normalized to plain float attributes and expanded
  to non-indexed geometry before fracturing to improve compatibility with
  quantized/interleaved meshes.
- Instanced entities are not supported.
- `fragmentPhysics.mode: 'compound'` keeps fragments on the source entity as a
  compound body.
- `fragmentPhysics.mode: 'independent'` spawns one dynamic body per fragment
  and restores the source entity on `repair()`.
- `prebake()` / `prebakeAsync()` compute and cache reusable fragment templates ahead of time without going through the full fracture runtime (no temporary fragment entities or physics churn).
- **Worker URL (Vite):** use `new URL('…/destructible-prebake-worker.ts', import.meta.url)` against the game-lib source tree during dev, or `new URL('@zylem/game-lib/dist/destructible-prebake-worker.js', import.meta.url)` when consuming the built package (see `packages/examples/src/demos/lib/destructible-prebake-worker-url.ts`).
- With `prebakeWorkerUrl`, concurrent `prebakeAsync()` calls on the **same** entity share one in-flight job; **different** entities no longer block each other on the main thread (the worker still runs jobs sequentially). Large pools of identical meshes may be smoother with synchronous `prebake()` per instance instead of many worker jobs.
- Fragment colliders default to convex hulls, with cuboid fallback if hull
  generation fails.
