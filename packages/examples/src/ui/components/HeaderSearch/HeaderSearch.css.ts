import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from '@zylem/ui';

export const header = style({
  padding: vars.spacing.lg,
  borderBottom: `1px solid ${vars.colors.border}`,
  '@media': {
    'screen and (max-width: 900px)': {
      // 4rem right padding reserves room for the absolutely-positioned
      // toggle button; it's a layout offset, not generic spacing.
      padding: `${vars.spacing.lg} 4rem ${vars.spacing.lg} ${vars.spacing.lg}`,
    },
  },
});

export const title = style({
  fontSize: '1.25rem',
  fontWeight: 700,
  marginBottom: vars.spacing.lg,
  color: vars.colors.primary,
  '@media': {
    'screen and (max-width: 900px)': {
      fontSize: '1.1rem',
      marginBottom: vars.spacing.md,
    },
  },
});

export const searchInput = style({
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  background: vars.colors.surfaceHover,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: vars.borders.radius,
  padding: `${vars.spacing.sm} ${vars.spacing.md}`,
  fontSize: '0.875rem',
  fontFamily: vars.typography.fontFamily,
  color: vars.colors.text,
  selectors: {
    '&:focus': {
      outline: 'none',
      borderColor: vars.colors.primary,
    },
  },
  '@media': {
    'screen and (max-width: 900px)': {
      fontSize: '1rem',
    },
  },
});

globalStyle(`${searchInput}::placeholder`, {
  color: vars.colors.textSecondary,
});
