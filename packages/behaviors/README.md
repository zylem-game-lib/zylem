# Zylem Behaviors

Tree-shakable Zylem behavior descriptors, systems, coordinators, and shared behavior helpers.

Use per-behavior entrypoints when you want bundlers to pull only the behavior family you import:

```ts
import { ScreenWrapBehavior } from '@zylem/behaviors/screen-wrap';
import { CooldownBehavior } from '@zylem/behaviors/cooldown';
```

The package is ESM-only and declares `sideEffects: false`.

## Requirements

- Node >= 22.12.0
- pnpm >= 10.32.1

## Commands

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
```
