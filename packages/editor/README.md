# @zylem/editor

The Zylem in-browser editor is an overlay panel that attaches to a running Zylem game and provides runtime inspection and debugging tools.

## What it does

- Lists all active stages and entities in an accordion panel
- Shows and edits entity properties (position, rotation, scale, custom globals)
- Displays a real-time console that mirrors `console.log` output from the game
- Provides play / pause / step controls
- Supports detachable, draggable floating panels
- Exposes a `<zylem-editor>` Web Component so it can be embedded in any HTML page

## Stack

| Dependency | Role |
|---|---|
| [Solid.js](https://www.solidjs.com/) | Reactive UI framework |
| [Kobalte](https://kobalte.dev/) | Accessible UI primitives (accordion, menus) |
| [Valtio](https://valtio.dev/) | Shared state with `@zylem/game-lib` debug stores |
| [Vanilla Extract](https://vanilla-extract.style/) | Type-safe CSS-in-TS (via `@zylem/zylem-styles`) |

## Directory layout (`src/`)

```
src/
├── components/
│   ├── common/          # FloatingPanel, Icon, PropertyRow, panel docking helpers
│   ├── console/         # Console panel — state, store, and UI
│   ├── editor-panel/    # AccordionMenu, DetachedPanel, DraggableAccordionItem
│   ├── entities/        # Entity list panel and state
│   ├── game/            # Game-level property panel
│   ├── stages/          # Stage list panel
│   ├── toolbar/         # Play/Pause, Add, Delete, Select, Debug buttons
│   ├── Editor.tsx        # Root editor component
│   ├── EditorContext.tsx # Context provider wrapping the whole editor
│   └── EditorToggleButton.tsx
├── web-components/
│   └── zylem-editor.tsx  # <zylem-editor> custom element definition
├── index.ts              # Public API exports
├── main.tsx              # Dev-mode entry point
└── types.ts              # Editor-specific TypeScript types
```

## Usage

### As a Web Component

```html
<zylem-editor></zylem-editor>
<script type="module">
  import '@zylem/editor/web-components';
</script>
```

### Programmatic mount

```ts
import { Editor } from '@zylem/editor';
// mount onto an existing DOM node
Editor.mount(document.getElementById('editor-root'));
```

## Development

```bash
# from repo root
pnpm --filter @zylem/editor dev   # Vite dev server
pnpm --filter @zylem/editor build # production build via tsup
```
