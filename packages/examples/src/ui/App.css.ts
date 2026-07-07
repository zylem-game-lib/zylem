import { globalStyle, style } from '@vanilla-extract/css';
import { vars, sprinkles } from '@zylem/ui';

/**
 * Full-bleed shell that hosts the active demo / `DemoViewer`. Mirrors the
 * original `.appShell` rule from `App.module.css` but composed with
 * sprinkles + the Zylem design tokens.
 */
export const appShell = style([
  sprinkles({
    position: 'relative',
    display: 'flex',
    width: 'full',
    overflow: 'hidden',
  }),
  {
    minHeight: '100dvh',
    background: vars.colors.background,
    color: vars.colors.text,
    fontFamily: vars.typography.fontFamily,
    '@media': {
      'screen and (max-width: 900px)': {
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'auto',
      },
    },
  },
]);

/**
 * Variant of `appShell` used when the viewport is in mobile-shell mode.
 * Applied alongside `appShell` (concatenated class string) so the media
 * query in `appShell` can still trigger when present.
 */
export const appShellMobile = style({
  display: 'block',
  height: '100dvh',
  minHeight: '100dvh',
  overflow: 'hidden',
  '@media': {
    'screen and (max-width: 900px)': {
      flexDirection: 'initial',
      overflow: 'hidden',
    },
  },
});

// Preserve the source-order child ordering that the original
// `App.module.css` declared via `:first-child` / `:last-child`. vanilla-extract
// requires nested selectors to reference the owning class, so we lift these
// into `globalStyle()` instead of inlining them on `appShell`.
globalStyle(`${appShell} > :first-child`, {
  '@media': {
    'screen and (max-width: 900px)': { order: 0 },
  },
});

globalStyle(`${appShell} > :last-child`, {
  '@media': {
    'screen and (max-width: 900px)': { order: 1 },
  },
});

/**
 * Overlay container for the floating `<zylem-editor>` web component. The
 * editor itself stays click-through; only its rendered children should
 * receive pointer events so demos behind the overlay remain interactive.
 */
export const editorOverlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  pointerEvents: 'none',
});

// Tailwind's `[&>*]:pointer-events-auto` arbitrary-variant equivalent —
// vanilla-extract has no shorthand for descendant rules, so we register
// the bare `globalStyle()` against the overlay class.
globalStyle(`${editorOverlay} > *`, {
  pointerEvents: 'auto',
});
