import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../theme.css';

globalStyle('.zylem-menu', {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  background: vars.colors.backgroundTranslucent,
  borderRadius: vars.borders.radius,
  boxSizing: 'border-box',
  overflowY: 'auto',
  overflowX: 'hidden',
  pointerEvents: 'auto',
  fontFamily: vars.typography.fontFamily,
});

globalStyle('.zylem-menu::-webkit-scrollbar', {
  display: 'none',
});

globalStyle('.zylem-menu-header', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: vars.spacing.sm,
  borderBottom: `${vars.borders.width} solid ${vars.colors.primary}`,
});

globalStyle('.zylem-collapse-button', {
  flexShrink: 0,
  padding: vars.spacing.sm,
  fontSize: '12px',
  lineHeight: 1,
  marginRight: vars.spacing.sm,
});

globalStyle('.zylem-menu h3, .zylem-menu h4', {
  margin: 0,
});
