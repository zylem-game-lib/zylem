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

// Layout wrapper for the shared `SearchInput` component; visual treatment
// comes from the HyperGlass `.zylem-search` global styles.
export const searchField = style({
  width: '100%',
});

globalStyle(`${searchField} input`, {
  '@media': {
    'screen and (max-width: 900px)': {
      fontSize: '1rem',
    },
  },
});
