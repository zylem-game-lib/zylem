import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@zylem/styles';

export const listContainer = style({
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  padding: `${vars.spacing.sm} 0 ${vars.spacing.lg}`,
});

export const section = style({});

// Adjacent-sibling spacing — needs a real selector tying two `section`
// nodes together, so register it globally against the generated class.
globalStyle(`${section} + ${section}`, {
  marginTop: vars.spacing.xs,
});

export const sectionHeader = style({
  width: `calc(100% - ${vars.spacing.xxl})`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.spacing.md,
  padding: `${vars.spacing.md} ${vars.spacing.lg} ${vars.spacing.sm}`,
  background: 'transparent',
  border: 'none',
  color: `color-mix(in srgb, ${vars.colors.text} 78%, white 22%)`,
  cursor: 'pointer',
  textAlign: 'left',
  selectors: {
    '&:hover': {
      color: vars.colors.text,
    },
  },
});

export const sectionHeaderText = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: vars.spacing.sm,
  minWidth: 0,
});

export const sectionTitle = style({
  fontSize: '0.76rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
});

export const sectionCount = style({
  fontSize: '0.78rem',
  opacity: 0.58,
});

export const sectionIcon = style({
  flex: 'none',
  opacity: 0.7,
  transition: 'transform 0.18s ease, opacity 0.18s ease',
});

export const sectionIconExpanded = style({
  transform: 'rotate(180deg)',
  opacity: 1,
});

export const sectionItems = style({
  display: 'flex',
  flexDirection: 'column',
});

export const emptyState = style({
  padding: vars.spacing.lg,
  color: `color-mix(in srgb, ${vars.colors.text} 66%, white 34%)`,
  fontSize: '0.92rem',
});
