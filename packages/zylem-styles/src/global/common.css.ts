import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../theme.css';

globalStyle('.selected', {
  background: vars.colors.primaryActive,
  boxShadow: 'inset 0 0 6px rgba(97, 166, 232, 0.4)',
});

globalStyle('button', {
  boxShadow:
    'inset 0 1px 0 rgba(255, 255, 255, 0.04), inset 0 -1px 0 rgba(0, 0, 0, 0.2)',
});

globalStyle('.overlay', {
  background:
    'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
  backgroundSize: '100% 3px',
  pointerEvents: 'none',
});

globalStyle('::-webkit-scrollbar', {
  width: '3px',
  height: '3px',
});

globalStyle('::-webkit-scrollbar-track', {
  background: 'transparent',
});

globalStyle('::-webkit-scrollbar-thumb', {
  background: vars.colors.primary,
  borderRadius: vars.borders.radius,
});

globalStyle('::-webkit-scrollbar-thumb:hover', {
  background: vars.colors.primaryActive,
});

globalStyle('::-webkit-scrollbar-thumb:active', {
  background: vars.colors.active,
});
