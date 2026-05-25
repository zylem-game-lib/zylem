import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../theme.css';

globalStyle('button', {
  all: 'unset',
});

globalStyle('#zylem-editor-container', {
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100%',
  height: '100%',
  zIndex: 1,
  pointerEvents: 'none',
});

globalStyle('#zylem-editor-toggle', {
  width: vars.sizes.iconLg,
  height: vars.sizes.iconLg,
  backgroundImage: 'var(--zylem-logo-url)',
  backgroundSize: 'contain',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  cursor: 'grab',
  zIndex: 1,
  pointerEvents: 'auto',
});

globalStyle('.zylem-exo-2', {
  fontFamily: vars.typography.fontFamily,
  fontOpticalSizing: 'auto',
  fontWeight: 400,
  fontStyle: 'normal',
});

globalStyle('.scrollable-y', {
  overflowY: 'scroll',
  overflowX: 'hidden',
  scrollBehavior: 'smooth',
});

globalStyle('.scroll-thin', {
  scrollbarWidth: 'thin',
  scrollbarColor: `${vars.colors.primary} transparent`,
});

globalStyle('.scroll-thin::-webkit-scrollbar', {
  width: '3px',
  height: '3px',
});

globalStyle('.scroll-thin::-webkit-scrollbar-track', {
  background: 'transparent',
});

globalStyle('.scroll-thin::-webkit-scrollbar-thumb', {
  backgroundColor: vars.colors.primary,
  borderRadius: `calc(${vars.borders.radius} / 4)`,
});

globalStyle('.scroll-thin::-webkit-scrollbar-thumb:hover', {
  backgroundColor: vars.colors.primaryActive,
});

globalStyle('.zylem-button', {
  background: 'none',
  color: vars.colors.primary,
  border: `${vars.borders.width} solid ${vars.colors.primary}`,
  borderRadius: vars.borders.radius,
  fontFamily: vars.typography.fontFamily,
  cursor: 'pointer',
  padding: `${vars.spacing.sm} ${vars.spacing.md}`,
  fontSize: vars.typography.fontSize,
  transition: 'background-color 0.2s ease, color 0.2s ease',
});

globalStyle('.zylem-button:hover', {
  background: vars.colors.primary,
  color: vars.colors.backgroundTranslucent,
});

globalStyle('.zylem-button:active', {
  background: vars.colors.active,
  color: vars.colors.backgroundTranslucent,
});

globalStyle('.floating-panel', {
  background: vars.colors.backgroundTranslucent,
  border: `${vars.borders.width} solid ${vars.colors.primary}`,
  borderRadius: vars.borders.radius,
  boxShadow: `0 ${vars.spacing.sm} 32px rgba(0, 0, 0, 0.4)`,
  backdropFilter: `blur(${vars.spacing.sm})`,
  pointerEvents: 'auto',
});

globalStyle('.floating-panel-titlebar', {
  padding: `${vars.spacing.sm} ${vars.spacing.md}`,
  background: vars.colors.accent,
  border: `1px solid ${vars.colors.background}`,
  borderRadius: `calc(${vars.borders.radius} - 1px) calc(${vars.borders.radius} - 1px) 0 0`,
  fontFamily: vars.typography.fontFamily,
  fontWeight: 600,
  transition: 'background-color 0.15s ease',
});

globalStyle('.floating-panel-titlebar:hover', {
  background: vars.colors.accentHover,
});

globalStyle('.floating-panel-titlebar:active', {
  background: vars.colors.accentActive,
  cursor: 'grabbing',
});

globalStyle('.floating-panel-title', {
  fontSize: vars.typography.fontSize,
  color: vars.colors.background,
  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
});

globalStyle('.floating-panel-button', {
  all: 'unset',
  cursor: 'pointer',
  padding: '2px 6px',
  fontSize: '10px',
  lineHeight: 1,
  color: vars.colors.background,
  borderRadius: `calc(${vars.borders.radius} / 3)`,
  transition: 'background-color 0.15s ease',
});

globalStyle('.floating-panel-button:hover', {
  background: 'rgba(0, 0, 0, 0.2)',
});

globalStyle('.floating-panel-button:active', {
  background: 'rgba(0, 0, 0, 0.3)',
});

globalStyle('.floating-panel-content', {
  background: 'transparent',
});

globalStyle('.floating-panel-controls', {
  display: 'flex',
  alignItems: 'center',
  gap: vars.spacing.xs,
});

globalStyle('.zylem-property-list', {
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.xs,
  padding: vars.spacing.sm,
  background: vars.colors.consoleBackground,
  borderRadius: `calc(${vars.borders.radius} / 2)`,
});

globalStyle('.zylem-property-row', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: `${vars.spacing.xs} ${vars.spacing.sm}`,
  borderBottom: `1px solid ${vars.colors.border}`,
});

globalStyle('.zylem-property-row:last-child', {
  borderBottom: 'none',
});

globalStyle('.zylem-property-label', {
  color: vars.colors.textSecondary,
  fontSize: `calc(${vars.typography.fontSize} - 1px)`,
  fontFamily: vars.typography.fontFamily,
});

globalStyle('.zylem-property-value', {
  color: vars.colors.primary,
  fontSize: vars.typography.fontSize,
  fontFamily: vars.typography.fontFamily,
  fontWeight: 500,
});

globalStyle('.zylem-property-value--clickable', {
  cursor: 'pointer',
  textDecoration: 'underline',
  textDecorationStyle: 'dotted',
  textUnderlineOffset: '2px',
});

globalStyle('.zylem-property-value--clickable:hover', {
  textDecorationStyle: 'solid',
  color: vars.colors.active,
});

globalStyle('.zylem-section', {
  padding: vars.spacing.sm,
});

globalStyle('.zylem-section-title', {
  margin: `0 0 ${vars.spacing.sm} 0`,
  fontSize: vars.typography.fontSize,
  fontFamily: vars.typography.fontFamily,
  color: vars.colors.textSecondary,
  fontWeight: 600,
});

globalStyle('.entity-grid', {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
  gap: vars.spacing.xs,
});

globalStyle('.entity-grid-item', {
  aspectRatio: '1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: vars.colors.consoleBackground,
  border: `1px solid ${vars.colors.border}`,
  borderRadius: `calc(${vars.borders.radius} / 2)`,
  cursor: 'pointer',
  transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
});

globalStyle('.entity-grid-item:hover', {
  background: vars.colors.accent,
  borderColor: vars.colors.primary,
  transform: 'scale(1.05)',
});

globalStyle('.entity-grid-item:active', {
  transform: 'scale(0.95)',
});

globalStyle('.entity-icon', {
  width: '20px',
  height: '20px',
  color: vars.colors.textSecondary,
});

globalStyle('.entity-grid-item:hover .entity-icon', {
  color: vars.colors.background,
});
