import {
  defineProperties,
  createSprinkles,
} from '@vanilla-extract/sprinkles';
import { vars } from './theme.css';

/**
 * Responsive conditions that mirror the breakpoints used across the
 * legacy `*.module.css` files. `desktop` is the default; declare narrower
 * overrides under `tablet` (≤900px) or `mobile` (≤720px).
 */
const conditions = {
  desktop: {},
  tablet: { '@media': 'screen and (max-width: 900px)' },
  mobile: { '@media': 'screen and (max-width: 720px)' },
} as const;

const spacingScale = {
  ...vars.spacing,
  none: '0',
  auto: 'auto',
} as const;

const sizeScale = {
  ...vars.spacing,
  ...vars.sizes,
  none: '0',
  auto: 'auto',
  full: '100%',
  screen: '100dvh',
} as const;

const radiusScale = {
  none: '0',
  sm: '4px',
  md: '8px',
  default: vars.borders.radius,
  lg: '16px',
  xl: '20px',
  pill: '999px',
} as const;

const responsive = defineProperties({
  conditions,
  defaultCondition: 'desktop',
  properties: {
    display: [
      'none',
      'block',
      'inline',
      'inline-block',
      'flex',
      'inline-flex',
      'grid',
      'inline-grid',
    ],
    position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
    flexDirection: ['row', 'row-reverse', 'column', 'column-reverse'],
    flexWrap: ['wrap', 'nowrap', 'wrap-reverse'],
    alignItems: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
    justifyContent: [
      'flex-start',
      'center',
      'flex-end',
      'space-between',
      'space-around',
      'space-evenly',
    ],
    flex: ['1', 'none', 'auto'],
    textAlign: ['left', 'center', 'right', 'justify'],
    textTransform: ['none', 'uppercase', 'lowercase', 'capitalize'],
    fontWeight: ['400', '500', '600', '700', '800'],
    boxSizing: ['border-box', 'content-box'],
    overflow: ['hidden', 'auto', 'scroll', 'visible'],
    overflowX: ['hidden', 'auto', 'scroll', 'visible'],
    overflowY: ['hidden', 'auto', 'scroll', 'visible'],
    padding: spacingScale,
    paddingTop: spacingScale,
    paddingRight: spacingScale,
    paddingBottom: spacingScale,
    paddingLeft: spacingScale,
    paddingInline: spacingScale,
    paddingBlock: spacingScale,
    margin: spacingScale,
    marginTop: spacingScale,
    marginRight: spacingScale,
    marginBottom: spacingScale,
    marginLeft: spacingScale,
    marginInline: spacingScale,
    marginBlock: spacingScale,
    gap: spacingScale,
    rowGap: spacingScale,
    columnGap: spacingScale,
    width: sizeScale,
    height: sizeScale,
    minWidth: sizeScale,
    minHeight: sizeScale,
    maxWidth: sizeScale,
    maxHeight: sizeScale,
  },
  shorthands: {
    px: ['paddingLeft', 'paddingRight'],
    py: ['paddingTop', 'paddingBottom'],
    mx: ['marginLeft', 'marginRight'],
    my: ['marginTop', 'marginBottom'],
    placeItems: ['alignItems', 'justifyContent'],
    size: ['width', 'height'],
  },
});

const color = defineProperties({
  properties: {
    color: vars.colors,
    background: vars.colors,
    backgroundColor: vars.colors,
    borderColor: vars.colors,
  },
});

const visual = defineProperties({
  properties: {
    borderRadius: radiusScale,
    borderWidth: {
      none: '0',
      hairline: '1px',
      default: vars.borders.width,
      bold: '2px',
    },
    borderStyle: ['solid', 'dashed', 'dotted', 'none'],
    fontFamily: { default: vars.typography.fontFamily },
    fontSize: { default: vars.typography.fontSize },
    lineHeight: ['1', '1.2', '1.35', '1.45', '1.5'],
    letterSpacing: {
      tight: '-0.01em',
      normal: '0',
      wide: '0.04em',
      wider: '0.08em',
      widest: '0.2em',
    },
  },
});

/**
 * Atomic-utility function generated from the Zylem token system.
 *
 * Usage:
 * ```ts
 * import { sprinkles } from '@zylem/styles';
 *
 * const card = style([
 *   sprinkles({ padding: 'lg', borderRadius: 'default', color: 'text' }),
 * ]);
 * ```
 */
export const sprinkles = createSprinkles(responsive, color, visual);

/** Inferred prop type of the sprinkles function — accept it on components. */
export type Sprinkles = Parameters<typeof sprinkles>[0];

/** Responsive conditions exposed for documentation/tooling. */
export const breakpoints = {
  tablet: '900px',
  mobile: '720px',
} as const;
