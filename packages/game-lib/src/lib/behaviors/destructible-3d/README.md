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

## Handle Methods

- `fracture(overrideOptions?)`
- `repair()`
- `isFractured()`
- `getFragments()`

## Notes

- The source mesh should be manifold/watertight for reliable results.
- Instanced entities are not supported.
- `fragmentPhysics.mode: 'compound'` keeps fragments on the source entity as a
  compound body.
- `fragmentPhysics.mode: 'independent'` spawns one dynamic body per fragment
  and restores the source entity on `repair()`.
- Fragment colliders default to convex hulls, with cuboid fallback if hull
  generation fails.
