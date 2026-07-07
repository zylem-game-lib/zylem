import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@zylem/ui';

export const toolbar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.spacing.md,
  padding: `${vars.spacing.md} ${vars.spacing.lg} 0`,
  flexWrap: 'wrap',
  '@media': {
    'screen and (max-width: 720px)': {
      gap: vars.spacing.sm,
      padding: `${vars.spacing.md} ${vars.spacing.md} 0`,
    },
  },
});

export const toolbarGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.spacing.sm,
  flexWrap: 'wrap',
  '@media': {
    'screen and (max-width: 720px)': {
      gap: vars.spacing.xs,
    },
  },
});

export const toolbarLabel = style({
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  opacity: 0.6,
  '@media': {
    'screen and (max-width: 720px)': {
      display: 'none',
    },
  },
});

export const toolbarButton = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.4rem',
  height: '2.4rem',
  border: `1px solid color-mix(in srgb, ${vars.colors.border} 80%, transparent)`,
  background: `color-mix(in srgb, ${vars.colors.surface} 88%, black 12%)`,
  color: vars.colors.text,
  borderRadius: '999px',
  padding: 0,
  fontSize: '0.8rem',
  cursor: 'pointer',
});

export const buttonText = style({
  display: 'none',
  lineHeight: 1,
});

export const buttonIcon = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.1rem',
  height: '1.1rem',
  lineHeight: 0,
});

globalStyle(`${buttonIcon} svg`, {
  width: '100%',
  height: '100%',
});

export const toolbarButtonActive = style({
  background: vars.colors.primary,
  borderColor: vars.colors.primary,
  color: 'white',
});

export const viewportMeta = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.spacing.md,
  fontSize: '0.8rem',
  opacity: 0.72,
  '@media': {
    'screen and (max-width: 720px)': {
      width: '100%',
      justifyContent: 'space-between',
      fontSize: '0.75rem',
      paddingInline: vars.spacing.xs,
    },
  },
});

// Compact-toolbar variant: applied alongside `toolbar` and tweaks the
// descendants (label, button, group, meta). Originally expressed as
// `.toolbarCompact .toolbarLabel` etc. — `globalStyle` keeps those
// cross-class selectors working.
export const toolbarCompact = style({
  gap: vars.spacing.sm,
  padding: `${vars.spacing.md} ${vars.spacing.md} 0`,
});

globalStyle(`${toolbarCompact} ${toolbarGroup}`, {
  gap: vars.spacing.xs,
});

globalStyle(`${toolbarCompact} ${toolbarLabel}`, {
  display: 'none',
});

globalStyle(`${toolbarCompact} ${toolbarButton}`, {
  padding: 0,
  width: '2.4rem',
  height: '2.4rem',
});

globalStyle(`${toolbarCompact} ${buttonText}`, {
  display: 'none',
});

globalStyle(`${toolbarCompact} ${buttonIcon}`, {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

globalStyle(`${toolbarCompact} ${viewportMeta}`, {
  width: '100%',
  justifyContent: 'space-between',
  fontSize: '0.75rem',
  paddingInline: vars.spacing.xs,
});
