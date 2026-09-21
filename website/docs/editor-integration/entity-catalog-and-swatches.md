---
title: Entity catalog and swatches
description: Add palette registration and live shader/behavior apply
sidebar_position: 3
---

The editor Add palette and swatch drag-and-drop need serializable descriptors on the game side while factories stay in game-lib. `@zylem/game-lib/catalog` registers **entity types** and **swatch sources**; `GameBridge` publishes descriptors and applies `entity:apply-swatch` commands against live entities.

## Entity catalog

Each placeable type is an `EntityTypeRegistration`:

- Descriptor fields from `EntityTypeDescriptor` (`id`, `label`, optional `icon` SVG markup, `tags`, `group`, `description`, `defaultProps`)
- `create(context)` — factory receiving snapped `position`, optional surface `normal`, and merged `props`

API:

| Function | Role |
| --- | --- |
| `registerEntityType` / `registerEntityTypes` | Add or replace types; returns unregister |
| `registerBuiltInEntityTypes` | Primitives (box, sphere, zone, light, …) |
| `getEntityType`, `listEntityTypes` | Introspection |
| `buildCatalogDescriptors` | Serializable list for `catalog:snapshot` |
| `onEntityRegistryChanged` | Refresh palette when hosts register late |
| `clearEntityRegistry` | Tests |

Built-in types only include shapes placeable without external assets (no actors/sprites in the default set). Hosts register configured entities after loading models or spritesheets.

```typescript
import { registerEntityType, registerBuiltInEntityTypes } from '@zylem/game-lib/catalog';
import { createSphere } from '@zylem/game-lib/entity';

registerBuiltInEntityTypes();
registerEntityType({
  id: 'hero',
  label: 'Hero',
  group: 'Characters',
  defaultProps: { radius: 0.5 },
  create: ({ position, props }) =>
    createSphere({ name: 'hero', position, radius: (props.radius as number) ?? 0.5 }),
});
```

When the game starts, `GameBridge.publishCatalog(buildCatalogDescriptors())` sends the palette to the editor.

## Swatch registry

Swatches cross the bridge as `SwatchSpec`:

- `kind`: `'shader'` or `'behavior'`
- `source`: export name (`createLava`, `ThrusterBehavior`, …)
- `props`: factory options or behavior overrides

Register sources so `entity:apply-swatch` can resolve names:

| Function | Role |
| --- | --- |
| `registerSwatchSource` / `registerSwatchSources` | Register one or many |
| `registerSwatchSourcesFromModule` | Walk a module namespace for exports |
| `registerBuiltInBehaviorSwatchSources` | game-lib behavior descriptors |
| `getSwatchSource`, `listSwatchSources` | Lookup |
| `onSwatchRegistryChanged` | Notify on changes |
| `isBehaviorDescriptor` | Type guard helper |

Shader swatches call a `SwatchShaderFactory`; behavior swatches attach a `BehaviorDescriptor` (replacing same-key behaviors on the entity).

Bridge batching: one message can target many uuids × many swatches; the game applies in order, last shader wins per entity, behaviors replace matching keys. Results return on `entity:swatch-applied` with per-target success/failure reasons (`entity-not-found`, `unknown-source`, `no-material`, `invalid-props`).

Helper: `applySwatchesToSelection` from `@zylem/game-lib/bridge` for game-side tooling.

## Pitfalls

- **Icons are inline SVG** — not icon font names; ship markup in the descriptor.
- **Override ids** — registering the same `id` replaces a built-in type.
- **Unknown swatch source** — apply fails for that target; register sources at boot before editor connects.

## API reference

- [`registerEntityType`](/docs/api/catalog/functions/registerEntityType)
- [`registerSwatchSource`](/docs/api/catalog/functions/registerSwatchSource)
- [`EntityTypeDescriptor`](/docs/api/catalog/interfaces/EntityTypeDescriptor)
- [`EntityApplySwatchPayload`](/docs/api/bridge/interfaces/EntityApplySwatchPayload)

See [Bridge](./bridge.md) for `catalog:snapshot`, `entity:apply-swatch`, and `entity:swatch-applied`.
