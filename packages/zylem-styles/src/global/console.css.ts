import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../theme.css';

globalStyle('.zylem-console-container', {
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  minHeight: 0,
  padding: vars.spacing.sm,
  height: '100%',
});

globalStyle('.zylem-console-wrapper', {
  position: 'relative',
  display: 'flex',
  flex: 1,
  minHeight: 0,
});

globalStyle('.zylem-console', {
  width: '100%',
  height: '100%',
  flex: 1,
  resize: 'none',
  background: vars.colors.consoleBackground,
  color: vars.colors.primary,
  fontSize: vars.typography.fontSize,
  border: `${vars.borders.width} solid ${vars.colors.primary}`,
  borderRadius: vars.borders.radius,
  padding: vars.spacing.md,
  boxSizing: 'border-box',
  outline: 'none',
  fontFamily: "'Courier New', monospace",
});

globalStyle('.zylem-console-clear', {
  position: 'absolute',
  top: vars.spacing.sm,
  right: vars.spacing.sm,
  padding: `4px ${vars.spacing.md}`,
  fontSize: '12px',
  zIndex: 1,
});
