---
title: Sprites and text
description: Billboard sprites, sheets, animations, and canvas text
sidebar_position: 5
---

[createSprite](/docs/api/entity/functions/createSprite) renders textured billboards (single images, sprite sheets, or frame lists) with optional box colliders. [createText](/docs/api/entity/functions/createText) draws dynamic labels on a canvas-backed sprite, anchored to the camera viewport by default. Together they cover most 2D-style art and HUD strings without building custom UI meshes.

## Minimal example

`website/snippets/entities/sprites-and-text.ts`:

```typescript
import { createSprite, createText } from '@zylem/game-lib/entity';

const ship = createSprite({
  images: [{ name: 'ship', file: '/assets/sprites/ship.png' }],
  size: { x: 2, y: 2, z: 1 },
});

const scoreLabel = createText({
  name: 'score',
  text: 'Score: 0',
  stickToViewport: true,
  screenPosition: { x: 16, y: 16 },
});

scoreLabel.onUpdate(({ me, globals }) => {
  const score = (globals.score as number | undefined) ?? 0;
  me.updateText(`Score: ${score}`);
});
```

## Sprites

Sprite options extend [GameEntityOptions](/docs/api/entity/type-aliases/GameEntityOptions):

| Field | Purpose |
| --- | --- |
| `images` | Named texture files ([SpriteImage](/docs/api/entity/type-aliases/SpriteImage)) |
| `sheet` | One texture divided into a grid ([SpriteSheet](/docs/api/entity/type-aliases/SpriteSheet)) |
| `animations` | Named frame sequences ([SpriteAnimation](/docs/api/entity/type-aliases/SpriteAnimation)) |
| `size` | World-space billboard scale |
| `collisionSize` | Collider half-extents when different from visual size |

Prefer **sprite sheets** for characters: one texture, one draw call, UV windows shift per frame. Set `filter: 'nearest'` on the sheet for crisp pixel art.

Use [SPRITE_TYPE](/docs/api/entity/variables/SPRITE_TYPE) with `getEntityByName` on your stage handle for typed lookup ([Lookup and destroy](/docs/entities/lookup-and-destroy)).

## Text

Text entities default to **viewport-attached** sprites (`stickToViewport: true`):

- `text`, `fontFamily`, `fontSize`, `fontColor`, `backgroundColor`, `padding`
- `screenPosition` — offset in pixels from the anchor corner
- `zDistance` — depth ordering among HUD layers

Call [updateText](/docs/api/entity/classes/ZylemText#updatetext) whenever the string changes; the entity redraws its canvas texture on the next update.

For world-space labels, set `stickToViewport: false` and position the entity like any other node.

## Variations

- Sprites support the same behavior attachments as 3D entities (boundaries, shooters, particle emitters).
- Combine sprites with [createEntityFactory](/docs/api/entity/functions/createEntityFactory) to spawn many identical enemies from one template.
- Text entities register internal cleanup to dispose canvas resources—avoid retaining DOM references outside the entity.

## Pitfalls

- **Animation names** must match `SpriteAnimation.name`; missing frames throw at runtime when the clip starts.
- **Hi-DPI** — text rerasterizes when content changes; updating every frame with long strings can cost more than a dedicated UI rect.
- **Collision** — default sprite colliders are boxes sized from `size` / `collisionSize`; rotate the entity for aiming, not for thin hitboxes without adjusting `collisionSize`.

## API reference

- [createSprite](/docs/api/entity/functions/createSprite) · [ZylemSprite](/docs/api/entity/classes/ZylemSprite) · [SPRITE_TYPE](/docs/api/entity/variables/SPRITE_TYPE)
- [createText](/docs/api/entity/functions/createText) · [ZylemText](/docs/api/entity/classes/ZylemText) · [TEXT_TYPE](/docs/api/entity/variables/TEXT_TYPE)
- [SpriteSheet](/docs/api/entity/type-aliases/SpriteSheet) · [SpriteAnimation](/docs/api/entity/type-aliases/SpriteAnimation)
