/**
 * Public TypeScript surface for `@zylem/styles`.
 *
 * - `vars` — typed handles to every Zylem design token, resolving to the
 *   legacy `--zylem-*` CSS custom properties. Use inside `style()`,
 *   `globalStyle()`, or `sprinkles()` calls.
 * - `sprinkles` — atomic-utility function generated from the same tokens.
 * - `breakpoints` / `tokenValues` — documentation/tooling helpers.
 *
 * Consumers should also import the CSS bundle once at app entry:
 * `import '@zylem/styles/styles.css'`.
 */
export { vars, tokenValues } from './theme.css';
export { sprinkles, breakpoints, type Sprinkles } from './sprinkles.css';
