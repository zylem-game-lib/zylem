# @zylem/zylem-styles

The Zylem design-token and utility CSS library used by `@zylem/editor` and any Zylem-based application that wants to share the same visual language.

## What it provides

- **Design tokens** — colour, spacing, typography, radius, and shadow variables defined as CSS custom properties via Vanilla Extract's `createTheme`.
- **Atomic sprinkles** — a `sprinkles()` utility for applying common layout/spacing classes without writing raw CSS.
- **Responsive breakpoints** — a `breakpoints` map for `@media` conditions.
- **Global styles** — pre-built CSS for editor components (accordion, console, sidebar, toolbar, etc.) that `@zylem/editor` applies at startup.
- **Font definitions** — `fonts.css` for any custom typefaces used by the editor.

## Directory layout (`src/`)

```
src/
├── index.ts              # Public API: vars, sprinkles, breakpoints
├── theme.css.ts          # createTheme — all design token values
├── sprinkles.css.ts      # defineProperties + createSprinkles
├── styles.ts             # Imports all global styles in dependency order
├── fonts.css             # @font-face definitions
└── global/
    ├── accordion.css.ts
    ├── checkbox.css.ts
    ├── common.css.ts
    ├── console.css.ts
    ├── detached-panel.css.ts
    ├── editor-base.css.ts
    ├── entities.css.ts
    ├── logo-data.ts        # Inline SVG/base64 logo
    ├── logo.css.ts
    ├── menu.css.ts
    ├── sidebar.css.ts
    └── toolbar.css.ts
```

## Usage

```ts
import { vars, sprinkles } from '@zylem/zylem-styles';

// Use a design token
const primaryColor = vars.color.primary;

// Apply atomic utilities
const className = sprinkles({ padding: 'md', display: 'flex' });
```

## Development

```bash
pnpm --filter @zylem/zylem-styles build
```

Vanilla Extract generates static CSS at build time so there is no runtime overhead.
