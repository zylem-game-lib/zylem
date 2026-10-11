---
title: UI elements
description: Viewport rects, ovals, images, and cooldown icons
sidebar_position: 9
---

HUD-style entities render through camera-attached sprites or quads so they stay aligned with the viewport. [createRect](/docs/api/entity/functions/createRect) draws rectangles, rounded rectangles, and ovals, optionally filled with an image; [createCooldownIcon](/docs/api/entity/functions/createCooldownIcon) shows ability icons with a radial sweep driven by the shared cooldown store. Use them for overlays, panels, portraits, and action-bar feedback without a separate UI framework.

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

const portrait = createRect({
  shape: 'ellipse',
  width: 64,
  height: 64,
  image: '/assets/ui/hero.png',
  strokeColor: '#ffffff',
  strokeWidth: 2,
  screenAnchor: 'top-right',
  screenPosition: { x: -12, y: 12 },
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
- **Shape** — `shape: 'rect'` (default) or `'ellipse'`, which inscribes an oval in the `width` × `height` box and ignores `radius`
- **Paint** — `fillColor`, `strokeColor`, `strokeWidth`, and `image`, a URL drawn over the fill, stretched to the box, and clipped to the shape (round portraits)
- **Viewport** — `stickToViewport`, `screenAnchor`, `screenPosition`, `anchor` (0–100 per axis), `zDistance`
- **Bounds** — optional `bounds.screen` / `bounds.world` for clamping or world-locked panels

Rects rasterize to a canvas texture like [createText](/docs/entities/sprites-and-text). Call `updateRect` with new colors, sizes, `shape`, or `image` to redraw one.

## Screen anchors

`screenAnchor` pins a rect or text to one of nine viewport points: `top-left`, `top-center`, `top-right`, `center-left`, `center`, `center-right`, `bottom-left`, `bottom-center`, or `bottom-right`. With an anchor set:

- `screenPosition` is a pixel offset from the anchor. Positive x is right and positive y is down, so offsets into the screen from a bottom-right anchor are negative.
- The element aligns to the same point, so a `bottom-right` rect sits inside that corner and a `top-center` rect is centered horizontally. Pass an explicit `anchor` to place a different point of a rect on the offset.

Without `screenAnchor`, rects treat `screenPosition` as their top-left pixel, and text centers on it (see [Sprites and text](/docs/entities/sprites-and-text#text)).

Pixels are measured in the camera's render resolution. A game with a fixed internal resolution lays out its HUD at that resolution and scales it with the rest of the frame.

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

- Stack `createText` on top of `createRect` for titled panels (separate entities, matched `screenAnchor` and `screenPosition`).
- Use `shape: 'ellipse'` with an `image` and a stroke for character portraits.
- Pair cooldown icons with [CooldownBehavior](/docs/behaviors/catalog/cooldown) on gameplay entities so the same key drives logic and UI.
- Set `stickToViewport: false` on rects when you want floating world markers implemented as textured quads.

## Pitfalls

- **Cooldown keys** must match the behavior registration; a typo shows a full icon with no sweep.
- **Anchor vs position** — rects and text offset from `screenAnchor` in pixels; cooldown icons share the same anchors but offset in view units. Do not mix the two coordinate systems on one layout without converting.
- **Cross-origin images** — a rect `image` from another origin must be served with CORS headers. Otherwise the browser taints the canvas and the texture cannot be uploaded.
- **Performance** — large semi-transparent panels over the full viewport force overdraw; keep HUD regions small.

## API reference

- [createRect](/docs/api/entity/functions/createRect) · [ZylemRect](/docs/api/entity/classes/ZylemRect) · [RECT_TYPE](/docs/api/entity/variables/RECT_TYPE)
- [createCooldownIcon](/docs/api/entity/functions/createCooldownIcon)
- [IconSize](/docs/api/entity/type-aliases/IconSize)
