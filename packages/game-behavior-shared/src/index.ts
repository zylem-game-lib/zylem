/**
 * @zylem/game-behavior-shared
 *
 * Pure, runtime-agnostic helpers shared between @zylem/game-lib behaviors
 * and @zylem/utilities tooling (CLIs, browser workers). Each subfolder hosts
 * helpers for a single behavior; the root barrel re-exports them all so
 * consumers can `import { ... } from '@zylem/game-behavior-shared'`.
 *
 * No DOM, no Rapier, no game-lib runtime imports — just `three` and
 * behavior-specific peer libs (e.g. `@dgreenheck/three-pinata` for
 * destructible-prebake).
 */
export * from './destructible-prebake';
