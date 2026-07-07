import { style } from '@vanilla-extract/css';
import { vars, sprinkles } from '@zylem/ui';

export const listItem = style([
  sprinkles({
    width: 'full',
    display: 'block',
    textAlign: 'left',
    boxSizing: 'border-box',
    background: 'background',
  }),
  {
    padding: `${vars.spacing.sm} ${vars.spacing.lg}`,
    transition: 'opacity 0.15s ease, transform 0.15s ease',
    color: vars.colors.text,
    opacity: 0.88,
    background: 'transparent',
    border: 'none',
    fontFamily: vars.typography.fontFamily,
    fontSize: vars.typography.fontSize,
    cursor: 'pointer',
    selectors: {
      '&:hover': {
        opacity: 1,
        transform: 'translateY(-1px)',
      },
    },
  },
]);

/** Applied alongside {@link listItem} when the demo route matches. */
export const isActive = style({
  opacity: 1,
});
