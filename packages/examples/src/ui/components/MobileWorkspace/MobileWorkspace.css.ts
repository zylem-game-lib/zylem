import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@zylem/styles';

// Layout-local custom properties: side-padding is aliased to a spacing
// token so the mobile shell stays aligned with the rest of the system;
// bottom-bar height is a layout size, not a spacing value.
const sidePadding = 'var(--mobile-shell-side-padding)';
const bottomBarHeight = 'var(--mobile-shell-bottom-bar-height)';

export const shell = style({
  vars: {
    '--mobile-shell-side-padding': vars.spacing.md,
    '--mobile-shell-bottom-bar-height': '5.25rem',
  },
  position: 'relative',
  height: '100%',
  minHeight: '100dvh',
  overflow: 'hidden',
  background: [
    `radial-gradient(circle at top, color-mix(in srgb, ${vars.colors.primary} 12%, transparent), transparent 42%)`,
    vars.colors.background,
  ].join(', '),
});

export const viewerLayer = style({
  position: 'relative',
  height: '100%',
});

export const drawer = style({
  position: 'absolute',
  right: 0,
  bottom: `calc(${bottomBarHeight} + env(safe-area-inset-bottom))`,
  left: 0,
  zIndex: 100,
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr) auto',
  minHeight: '18rem',
  maxHeight: 'min(72dvh, 42rem)',
  border: `1px solid color-mix(in srgb, ${vars.colors.border} 85%, transparent)`,
  borderBottom: 'none',
  borderRadius: '1.35rem 1.35rem 0 0',
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.colors.surface} 92%, black 8%), color-mix(in srgb, ${vars.colors.background} 94%, black 6%))`,
  boxShadow: [
    '0 -20px 50px rgba(0, 0, 0, 0.32)',
    'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
  ].join(', '),
  transform: `translateY(calc(100% + ${vars.spacing.lg}))`,
  opacity: 0,
  pointerEvents: 'none',
  transition: 'transform 0.24s ease, opacity 0.24s ease',
});

export const drawerOpen = style({
  transform: 'translateY(0)',
  opacity: 1,
  pointerEvents: 'auto',
});

export const drawerHandle = style({
  width: '3rem',
  height: '0.3rem',
  margin: `${vars.spacing.md} auto ${vars.spacing.xs}`,
  borderRadius: '999px',
  background: `color-mix(in srgb, ${vars.colors.textSecondary} 70%, white 30%)`,
  opacity: 0.8,
});

export const drawerScrollArea = style({
  overflow: 'auto',
  padding: `${vars.spacing.xs} ${sidePadding} ${vars.spacing.md}`,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.lg,
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.md,
});

export const sectionHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.spacing.md,
});

export const sectionTitle = style({
  margin: 0,
  fontSize: '0.88rem',
  fontWeight: 700,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  color: `color-mix(in srgb, ${vars.colors.text} 88%, white 12%)`,
});

export const sectionCount = style({
  fontSize: '0.78rem',
  fontWeight: 700,
  color: vars.colors.textSecondary,
});

export const sectionGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(5.75rem, 1fr))',
  gap: vars.spacing.md,
  '@media': {
    'screen and (min-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fill, minmax(7rem, 1fr))',
    },
  },
});

export const demoCard = style({
  all: 'unset',
  display: 'block',
  cursor: 'pointer',
});

export const demoCardActive = style({
  transform: 'translateY(-1px)',
});

export const emptyState = style({
  padding: `${vars.spacing.xl} ${vars.spacing.sm} ${vars.spacing.xxl}`,
  textAlign: 'center',
  fontSize: '0.9rem',
  color: vars.colors.textSecondary,
});

export const searchDock = style({
  padding: `${vars.spacing.md} ${sidePadding}`,
  borderTop: `1px solid color-mix(in srgb, ${vars.colors.border} 84%, transparent)`,
  background: `color-mix(in srgb, ${vars.colors.surface} 88%, black 12%)`,
});

export const searchInput = style({
  width: '100%',
  border: `1px solid color-mix(in srgb, ${vars.colors.border} 85%, transparent)`,
  borderRadius: '0.95rem',
  background: `color-mix(in srgb, ${vars.colors.background} 76%, black 24%)`,
  padding: `${vars.spacing.md} ${vars.spacing.lg}`,
  font: 'inherit',
  color: vars.colors.text,
  outline: 'none',
  selectors: {
    '&:focus': {
      borderColor: `color-mix(in srgb, ${vars.colors.primary} 72%, white 28%)`,
      boxShadow: `0 0 0 3px color-mix(in srgb, ${vars.colors.primary} 18%, transparent)`,
    },
  },
});

export const bottomBar = style({
  position: 'absolute',
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 30,
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: vars.spacing.md,
  minHeight: `calc(${bottomBarHeight} + env(safe-area-inset-bottom))`,
  padding: `${vars.spacing.md} ${sidePadding} calc(${vars.spacing.md} + env(safe-area-inset-bottom))`,
  borderTop: `1px solid color-mix(in srgb, ${vars.colors.border} 84%, transparent)`,
  background: `linear-gradient(180deg, color-mix(in srgb, ${vars.colors.surface} 95%, black 5%), color-mix(in srgb, ${vars.colors.background} 94%, black 6%))`,
  boxShadow: '0 -10px 32px rgba(0, 0, 0, 0.26)',
});

export const bottomButton = style({
  width: '3.4rem',
  height: '3.4rem',
  borderRadius: '1rem',
  border: `1px solid color-mix(in srgb, ${vars.colors.border} 84%, transparent)`,
  background: `color-mix(in srgb, ${vars.colors.surface} 90%, black 10%)`,
  color: vars.colors.text,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition:
    'transform 0.16s ease, background 0.16s ease, border-color 0.16s ease, color 0.16s ease',
  selectors: {
    '&:hover': {
      borderColor: `color-mix(in srgb, ${vars.colors.primary} 70%, white 30%)`,
      background: `color-mix(in srgb, ${vars.colors.primary} 18%, ${vars.colors.surface} 82%)`,
      color: 'white',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
  },
  '@media': {
    'screen and (min-width: 768px)': {
      width: '3.7rem',
      height: '3.7rem',
    },
  },
});

export const bottomButtonActive = style({
  borderColor: `color-mix(in srgb, ${vars.colors.primary} 70%, white 30%)`,
  background: `color-mix(in srgb, ${vars.colors.primary} 18%, ${vars.colors.surface} 82%)`,
  color: 'white',
});

globalStyle(`${bottomButton} svg`, {
  width: '1.45rem',
  height: '1.45rem',
});

export const bottomBarLabel = style({
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.xxs,
});

export const bottomBarCaption = style({
  fontSize: '0.68rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: vars.colors.textSecondary,
});

export const bottomBarTitle = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '0.95rem',
  fontWeight: 700,
  color: vars.colors.text,
});

export const editorButton = style({
  backgroundImage: 'var(--zylem-logo-url)',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '68% auto',
});
