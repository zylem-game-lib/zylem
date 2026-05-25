import { globalStyle, keyframes } from '@vanilla-extract/css';
import { vars } from '../theme.css';

const tooltipEnter = keyframes({
  from: { opacity: 0, transform: 'translateY(4px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

globalStyle('.zylem-toolbar', {
  display: 'flex',
  position: 'sticky',
  top: 0,
  gap: vars.spacing.md,
  padding: vars.spacing.md,
  zIndex: 1,
});

globalStyle('.zylem-toolbar.separator', {
  borderBottom: `${vars.borders.width} solid ${vars.colors.primary}`,
});

globalStyle('.zylem-toolbar-btn', {
  display: 'flex',
  alignItems: 'center',
  padding: vars.spacing.md,
  cursor: 'pointer',
});

globalStyle('.zylem-toolbar-btn:hover svg', {
  stroke: vars.colors.backgroundTranslucent,
});

globalStyle('.zylem-toolbar-btn.selected', {
  background: vars.colors.active,
  borderColor: vars.colors.active,
});

globalStyle('.zylem-toolbar-btn.selected svg', {
  stroke: vars.colors.backgroundTranslucent,
});

globalStyle('.zylem-icon', {
  width: vars.sizes.icon,
  height: vars.sizes.icon,
  stroke: vars.colors.primary,
});

globalStyle('.zylem-tooltip', {
  background: vars.colors.backgroundTranslucent,
  color: vars.colors.primary,
  padding: `${vars.spacing.sm} ${vars.spacing.md}`,
  marginTop: vars.spacing.sm,
  borderRadius: vars.borders.radius,
  border: `${vars.borders.width} solid ${vars.colors.primary}`,
  fontSize: vars.typography.fontSize,
  pointerEvents: 'none',
  zIndex: 1000,
});

globalStyle('.zylem-tooltip[data-enter]', {
  animation: `${tooltipEnter} 0.2s ease-out`,
});
