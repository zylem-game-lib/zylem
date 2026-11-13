# Navigation meshes

Zylem uses `recast-navigation` and `@recast-navigation/three` 0.44.0. Each loaded stage owns a `NavigationSession`; Recast loads when an asset is imported or a bake starts. Browser baking runs in a disposable module worker. Stage destruction cancels pending work and releases Detour and preview resources.

## Editor workflow

In the matching editor branch, open **Level Builder → Map Navigation**. Build level solids, adjust the agent dimensions, then **Bake navmesh**. **Test path** uses two clicks on solid surfaces. Orange obstacle volumes remove walkable space; cyan arrows represent one-way or two-way traversal links. Editing geometry, settings, exclusions, obstacles, or links invalidates the bake. Selection and editor-only sector visibility do not.

The source is authored `LevelDocument.solids`, including hidden sectors. Doodads and live stage entities are not inferred to be navigation geometry. Use level solids to represent their navigation collision, or author obstacle volumes. Excluding a solid removes all of its triangles, including its walls.

## Runtime API

After a stage has loaded, `stage.navigation` exposes its session. For a saved asset, import it without baking:

```ts
const navigation = stage.navigation;
if (navigation && level.navigation?.baked) {
  await navigation.load(level.navigation.baked);
  const route = navigation.findPath(
    { x: -5, y: 0, z: 0 },
    { x: 5, y: 0, z: 0 },
  );
  if (route.status === 'complete') {
    // Feed route.points to your character movement behavior.
  }
}
```

To bake from code:

```ts
const navigation = stage.navigation;
if (navigation) {
  navigation.sync(level);
  const baked = await navigation.bake();
  if (baked) {
    level.navigation = {
      ...createLevelNavigation(),
      ...level.navigation,
      baked,
    };
  }
}
```

Import `createLevelNavigation` from `@zylem/game-lib/navigation` or `@zylem/bridge`. The navigation subpath also exports `NavigationMesh`, `NavigationSession`, and `bakeNavigationData` for custom Three.js hosts. Standalone `NavigationMesh` instances must be disposed by their owner. `sync` automatically loads a matching saved asset asynchronously; use `await load(asset)` when code needs a ready mesh before querying.

Queries return `complete`, `partial`, or `unreachable`. A disconnected target can produce a partial route; do not treat that as reaching the destination. Endpoints snap within a search box (defaults: 1 unit horizontally, 2 vertically). `NavigationMesh.findPath` accepts custom half-extents. Waypoints do not implement locomotion, crowd avoidance, jumping, or climbing; gameplay owns those behaviors. Traversal links permit pathfinding across a gap but do not animate its crossing.

## Persistence and invalidation

`LevelDocument` remains version 2. Its optional `navigation` field contains settings, exclusions, blockers, links, and an optional bake. The bake is versioned Detour binary encoded as base64 so the editor's existing JSON host-save contract preserves it. Old documents need no migration. The editor includes navigation in undo/redo and dirty-state tracking.

The source hash covers bake inputs and generator version. Changed geometry never queries the old mesh. In-flight bakes are canceled when the source changes, and the editor rejects results for an old request, stage, or hash. Stale bytes can remain in the document until rebaking, but are not loaded automatically. `load` rejects an asset inconsistent with a session's synchronized document.

## Browser packaging and bounds

`dist/navigation-worker.js` ships with game-lib and embeds the Recast WASM payload. Keep it alongside the ESM chunks; let the app bundler process `new Worker(new URL(..., import.meta.url))`. Vite consumers should exclude `@zylem/game-lib` from `optimizeDeps` to preserve relative worker URLs, and include its nested CommonJS dependencies (`@zylem/game-lib > howler`, `@zylem/game-lib > typescript-fsm`). Include `@zylem/game-lib > recast-navigation` and `@zylem/game-lib > @recast-navigation/three` as well: game-lib imports Recast on the first bake or asset load, and a dependency Vite finds that late makes the dev server re-optimize and reload the page, which discards an unsaved level. The editor config includes this setup. CSP must permit the worker and WebAssembly compilation.

This version bakes one agent profile per document. Obstacles are static bake inputs, padded for agent radius/height. Up to 128 volumes are supported. Detour limits each volume's conservative bounds to eight tile layers; oversized volumes fail with an instruction to split them. The baker rejects empty/invalid geometry, caps the XZ raster grid at 16 million cells, and times out browser workers after two minutes. Imported base64 data is capped at 64 MiB. These bounds make failures explicit; this is not incremental streaming or runtime dynamic-obstacle support.

## Development and release order

Use the `feature/recast-navigation` branches of both repos with `zw link dev`, then build bridge and game-lib before the editor. Navigation ships in bridge 0.9.10, game-lib 0.9.11 and editor 0.9.11; earlier registry versions do not contain the bridge exports. Publish the bridge first, then game-lib against it, then update the editor's bridge and game-lib ranges and lockfile before releasing the editor.

Validation commands, after linking:

```sh
pnpm --filter @zylem/bridge build
pnpm --filter @zylem/bridge test
# The full game-lib build also expects the sibling simulation checkout.
pnpm --filter @zylem/game-lib build
pnpm --filter @zylem/game-lib exec vitest run tests/unit/navigation tests/unit/bridge tests/unit/level --project unit
pnpm --filter @zylem/game-lib test:navigation:bundle
```

The bundle test executes the shipped worker using browser globals, imports the emitted binary through the public entry point, and queries a complete path. It does not replace a visual browser smoke test.
