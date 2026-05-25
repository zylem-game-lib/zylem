import { globalStyle, keyframes } from '@vanilla-extract/css';
import { vars } from '../theme.css';

const dropIndicatorPulse = keyframes({
  from: { opacity: 0.6 },
  to: { opacity: 1 },
});

globalStyle('.detached-panel', {
  minWidth: '250px',
  minHeight: '150px',
  position: 'fixed',
  display: 'flex',
  flexDirection: 'column',
});

globalStyle('.detached-panel-titlebar', {
  padding: `${vars.spacing.sm} ${vars.spacing.md}`,
  cursor: 'grab',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  userSelect: 'none',
});

globalStyle('.detached-panel-titlebar:active', {
  cursor: 'grabbing',
});

globalStyle('.detached-panel-content', {
  background: vars.colors.backgroundTranslucent,
  flex: 1,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',
});

globalStyle('.accordion-item--dragging', {
  opacity: 0.5,
});

globalStyle('.accordion-drag-ghost', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: vars.colors.backgroundTranslucent,
  border: `2px dotted ${vars.colors.accent}`,
  borderRadius: vars.borders.radius,
  color: vars.colors.primary,
  fontFamily: vars.typography.fontFamily,
  backdropFilter: `blur(${vars.spacing.sm})`,
  boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px ${vars.colors.accent}`,
  position: 'fixed',
  zIndex: 9999,
  pointerEvents: 'none',
});

globalStyle('.accordion-drop-indicator', {
  height: '4px',
  background: vars.colors.accent,
  borderRadius: '2px',
  margin: `${vars.spacing.sm} ${vars.spacing.md}`,
  boxShadow: `0 0 8px ${vars.colors.accent}`,
  animation: `${dropIndicatorPulse} 0.8s ease-in-out infinite alternate`,
});
