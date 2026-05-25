import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../theme.css';

globalStyle('.sidebar', {
  background: vars.colors.surface,
  borderRight: `1px solid ${vars.colors.border}`,
});

globalStyle('.sidebar-item:hover', {
  background: vars.colors.surfaceHover,
});

globalStyle('.sidebar-item.is-active', {
  background: vars.colors.primaryActive,
  color: 'white',
  fontWeight: 600,
  boxShadow: 'inset 0 0 8px rgba(97, 166, 232, 0.4)',
});
