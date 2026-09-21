---
title: UI elements
description: Viewport rects and cooldown icons
sidebar_position: 9
---

HUD-style entities render through camera-attached sprites or quads so they stay aligned with the viewport. [createRect](/docs/api/entity/functions/createRect) draws rounded rectangles with optional strokes; [createCooldownIcon](/docs/api/entity/functions/createCooldownIcon) shows ability icons with a radial sweep driven by the shared cooldown store. Use them for overlays, panels, and action-bar feedback without a separate UI framework.

## Minimal example

`website/snippets/entities/ui-elements.ts`:

```typescript
import { createRect, createText, createCooldownIcon } from '@zylem/game-lib/entity';

const panel = createRect({
  width: 160,
  height: 48,
  fillColor: '#00000088',
  strokeColor: '#ffffff',
  screenPosition: { x: 12, y: 12 },
  stickToViewport: true,
});

const attackIcon = createCooldownIcon({
  cooldown: 'attack',
  icon: '/assets/ui/sword.png',
  screenAnchor: 'bottom-center',
  screenPosition: { x: 0, y: -16 },
  iconSize: 'md',
});
```

## Rectangles

[ZylemRect](/docs/api/entity/classes/ZylemRect) options include:

- **Layout** — `width`, `height`, `padding`, `radius`
- **Paint** — `fillColor`, `strokeColor`, `strokeWidth`
- **Viewport** — `stickToViewport`, `screenPosition`, `anchor` (0–100 per axis), `zDistance`
- **Bounds** — optional `bounds.screen` / `bounds.world` for clamping or world-locked panels

Rects rasterize to a canvas texture like [createText](/docs/entities/sprites-and-text); update colors or sizes by changing options and letting the entity refresh on the next frame.

## Cooldown icons

[createCooldownIcon](/docs/api/entity/functions/createCooldownIcon) reads progress from the cooldown behavior store ([CooldownBehavior](/docs/behaviors/catalog/cooldown)) using the string key in `cooldown`.

| Field | Purpose |
| --- | --- |
| `icon` | Background texture path |
| `fillColor` | Solid fill when no texture |
| `iconSize` | Preset (`xs`–`xl`), number (square), or `{ width, height }` ([IconSize](/docs/api/entity/type-aliases/IconSize)) |
| `screenAnchor` | Viewport reference point (`top-left`, `bottom-center`, and similar anchors) |
| `screenPosition` | Offset in **view units** from the anchor |
| `showTimer` | Draw remaining seconds in the center |
| `overlayColor` | Sweep overlay tint |

View units assume a 192-unit-tall virtual grid; width scales with aspect ratio so icons stay evenly spaced across resolutions.

## Variations

- Stack `createText` on top of `createRect` for titled panels (separate entities, matched `screenPosition`).
- Pair cooldown icons with [CooldownBehavior](/docs/behaviors/catalog/cooldown) on gameplay entities so the same key drives logic and UI.
- Set `stickToViewport: false` on rects when you want floating world markers implemented as textured quads.

## Pitfalls

- **Cooldown keys** must match the behavior registration; a typo shows a full icon with no sweep.
- **Anchor vs position** — rects use pixel-style `screenPosition` from the top-left by default; cooldown icons use anchor fractions plus view-unit offsets—do not mix the two coordinate systems on one layout without converting.
- **Performance** — large semi-transparent panels over the full viewport force overdraw; keep HUD regions small.

## API reference

- [createRect](/docs/api/entity/functions/createRect) · [ZylemRect](/docs/api/entity/classes/ZylemRect) · [RECT_TYPE](/docs/api/entity/variables/RECT_TYPE)
- [createCooldownIcon](/docs/api/entity/functions/createCooldownIcon)
- [IconSize](/docs/api/entity/type-aliases/IconSize)
