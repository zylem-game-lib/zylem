/*
 * Arena lobby overlay — three-column character select.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────┐
 *   │              top bar: carousel + swatches            │
 *   ├──────────┬──────────────────────────┬────────────────┤
 *   │ art card │     (lobby 3D preview)   │  stats/specs   │
 *   ├──────────┴──────────────────────────┴────────────────┤
 *   │              bottom bar: name + Enter                │
 *   └──────────────────────────────────────────────────────┘
 *
 * The middle row's center stays empty so the lobby stage's rotating
 * 3D character preview shows through. The art card and stats panel
 * dock to the left/right edges so the preview always has breathing
 * room between them.
 */
import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@zylem/styles';

export const overlay = style({
  position: 'absolute',
  inset: 0,
  zIndex: 55,
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
  gap: '0.75rem',
  padding: '1rem',
  pointerEvents: 'none',
});

globalStyle(`${overlay} > *`, {
  pointerEvents: 'auto',
});

// ─── Top bar (carousel + swatches) ──────────────────────────────────────

export const topBar = style({
  justifySelf: 'center',
  alignSelf: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
  width: 'min(560px, calc(100% - 2rem))',
  padding: '0.85rem 1rem',
  borderRadius: '0.75rem',
  background:
    'linear-gradient(to bottom, rgba(10, 12, 22, 0.7) 0%, rgba(10, 12, 22, 0.55) 100%)',
  border: `1px solid color-mix(in srgb, ${vars.colors.border} 70%, transparent)`,
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
  backdropFilter: 'blur(8px)',
});

export const carousel = style({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  width: '100%',
  gap: '0.5rem',
});

export const arrow = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.6rem',
  height: '2.6rem',
  borderRadius: '999px',
  border: '1px solid color-mix(in srgb, #ffffff 25%, transparent)',
  background: 'rgba(0, 0, 0, 0.35)',
  color: '#f5f5f5',
  cursor: 'pointer',
  transition:
    'background 120ms ease-out, border-color 120ms ease-out, color 120ms ease-out, transform 80ms ease-out',
  selectors: {
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.55)',
      borderColor: 'color-mix(in srgb, #ffffff 55%, transparent)',
      color: '#ffffff',
    },
    '&:active': {
      transform: 'scale(0.95)',
    },
  },
});

export const arrowIcon = style({
  width: '1.4rem',
  height: '1.4rem',
  display: 'block',
});

export const classLabel = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.1rem',
  textAlign: 'center',
  userSelect: 'none',
});

export const classKicker = style({
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'rgba(245, 245, 245, 0.55)',
});

export const className = style({
  fontSize: '1.5rem',
  fontWeight: 800,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#f5f5f5',
  textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
});

export const swatchRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: '0.45rem',
});

export const swatch = style({
  width: '1.6rem',
  height: '1.6rem',
  borderRadius: '999px',
  border: '2px solid color-mix(in srgb, #ffffff 35%, transparent)',
  padding: 0,
  cursor: 'pointer',
  transition:
    'transform 100ms ease-out, border-color 120ms ease-out, box-shadow 120ms ease-out',
  selectors: {
    '&:hover': {
      transform: 'scale(1.08)',
      borderColor: 'color-mix(in srgb, #ffffff 75%, transparent)',
    },
  },
});

export const swatchActive = style({
  borderColor: '#ffffff',
  boxShadow: [
    '0 0 0 2px rgba(255, 255, 255, 0.5)',
    '0 0 14px rgba(255, 255, 255, 0.35)',
  ].join(', '),
});

// ─── Middle row (art card | preview gap | stats panel) ───────────────────

export const middle = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1.5fr',
  gap: '1rem',
  alignItems: 'stretch',
  minHeight: 0,
  pointerEvents: 'none',
  '@media': {
    'screen and (max-width: 720px)': {
      gridTemplateColumns: '1fr 1fr',
    },
  },
});

globalStyle(`${middle} > *`, {
  pointerEvents: 'auto',
});

const panelBase = {
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '0.85rem',
  background:
    'linear-gradient(to bottom, rgba(10, 12, 22, 0.75) 0%, rgba(10, 12, 22, 0.55) 100%)',
  border: `1px solid color-mix(in srgb, ${vars.colors.border} 70%, transparent)`,
  boxShadow: '0 14px 36px rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(8px)',
  overflow: 'hidden',
} as const;

export const artPanel = style([
  panelBase,
  {
    justifySelf: 'start',
    alignItems: 'center',
    padding: '0.85rem',
    gap: '0.6rem',
    width: '100%',
    maxWidth: '260px',
    '@media': {
      'screen and (max-width: 720px)': {
        gridColumn: 1,
      },
    },
  },
]);

export const artImage = style({
  flex: 1,
  width: '100%',
  minHeight: 0,
  objectFit: 'contain',
  borderRadius: '0.5rem',
  background: 'rgba(0, 0, 0, 0.25)',
});

export const tagline = style({
  margin: 0,
  fontSize: '0.85rem',
  lineHeight: 1.35,
  textAlign: 'center',
  color: 'rgba(245, 245, 245, 0.85)',
});

// Center column intentionally has no panel — it's a transparent gap so
// the lobby stage's rotating 3D preview is visible underneath.

export const statsPanel = style([
  panelBase,
  {
    justifySelf: 'end',
    width: '100%',
    maxWidth: '540px',
    padding: '1rem',
    gap: '0.85rem',
    overflowY: 'auto',
    '@media': {
      'screen and (max-width: 720px)': {
        gridColumn: 2,
      },
    },
  },
]);

export const sectionHeading = style({
  margin: '0 0 0.4rem 0',
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'rgba(245, 245, 245, 0.6)',
});

// Stats list

export const statList = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
});

export const statItem = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  padding: '0.3rem 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  fontSize: '0.9rem',
  selectors: {
    '&:last-child': {
      borderBottom: 0,
    },
  },
});

export const statKey = style({
  color: 'rgba(245, 245, 245, 0.7)',
});

export const statValue = style({
  color: '#f5f5f5',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
});

// Specials list

export const specialList = style({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.55rem',
});

export const specialItem = style({
  padding: '0.55rem 0.6rem',
  borderRadius: '0.5rem',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.07)',
});

export const specialHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
});

export const slotBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.5rem',
  height: '1.5rem',
  borderRadius: '0.35rem',
  background: 'rgba(255, 255, 255, 0.12)',
  color: '#f5f5f5',
  fontSize: '0.7rem',
  fontWeight: 800,
  letterSpacing: '0.05em',
});

export const specialIcon = style({
  width: '1.4rem',
  height: '1.4rem',
  objectFit: 'contain',
  filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5))',
});

export const specialName = style({
  flex: 1,
  fontSize: '0.95rem',
  fontWeight: 700,
  color: '#f5f5f5',
});

export const specialMeta = style({
  display: 'flex',
  gap: '0.3rem',
  flexShrink: 0,
});

export const specialMetaTag = style({
  display: 'inline-block',
  padding: '0.1rem 0.4rem',
  borderRadius: '0.3rem',
  background: 'rgba(255, 255, 255, 0.08)',
  color: 'rgba(245, 245, 245, 0.85)',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  fontVariantNumeric: 'tabular-nums',
});

export const specialDescription = style({
  margin: '0.4rem 0 0 0',
  fontSize: '0.8rem',
  lineHeight: 1.4,
  color: 'rgba(245, 245, 245, 0.75)',
});

// ─── Bottom bar (display name + commit) ──────────────────────────────────

export const controls = style({
  justifySelf: 'center',
  alignSelf: 'center',
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  width: 'min(560px, calc(100% - 2rem))',
  padding: '0.6rem 0.75rem',
  borderRadius: '0.6rem',
  background:
    'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.45) 100%)',
  border: `1px solid color-mix(in srgb, ${vars.colors.border} 70%, transparent)`,
  backdropFilter: 'blur(6px)',
});

export const input = style({
  flex: 1,
  padding: '0.55rem 0.75rem',
  borderRadius: '0.5rem',
  border: `1px solid color-mix(in srgb, ${vars.colors.border} 85%, transparent)`,
  background: 'rgba(0, 0, 0, 0.55)',
  color: '#f5f5f5',
  fontSize: '0.95rem',
  selectors: {
    '&:focus': {
      outline: `2px solid color-mix(in srgb, ${vars.colors.primary} 55%, transparent)`,
      outlineOffset: '1px',
    },
  },
});

globalStyle(`${input}::placeholder`, {
  color: 'rgba(245, 245, 245, 0.6)',
});

export const enter = style({
  padding: '0.55rem 1rem',
  border: 0,
  borderRadius: '0.5rem',
  fontWeight: 700,
  fontSize: '0.95rem',
  cursor: 'pointer',
  color: vars.colors.background,
  background: vars.colors.primary,
  selectors: {
    '&:hover': {
      filter: 'brightness(1.05)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
  },
});
