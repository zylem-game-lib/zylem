import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../theme.css';

globalStyle('.zylem-accordion', {
  color: vars.colors.primary,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
});

globalStyle('.accordion-header', {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  transition: 'background-color 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
});

globalStyle('.accordion-header[data-expanded]', {
  backgroundColor: vars.colors.primaryActive,
});

globalStyle('.accordion-item', {
  position: 'relative',
  borderBottom: `1px solid ${vars.colors.primary}`,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  scrollbarWidth: 'none',
});

globalStyle('.accordion-item:last-child', {
  borderBottom: 'none',
});

globalStyle('.accordion-item[data-expanded]', {
  scrollbarWidth: 'thin',
  flex: 1,
  minHeight: 0,
});

globalStyle('.accordion-trigger', {
  width: '100%',
  padding: vars.spacing.md,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'none',
  border: 'none',
  color: vars.colors.primary,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
});

globalStyle('.accordion-trigger:hover', {
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
});

globalStyle('.accordion-trigger[data-expanded]', {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
});

globalStyle('.accordion-content', {
  overflowY: 'auto',
  flex: 1,
  minHeight: 0,
  transition: 'height 0.3s ease',
});

globalStyle('.accordion-trigger::after', {
  content: "'\\25BC'",
  right: vars.spacing.lg,
  position: 'relative',
  color: vars.colors.primary,
  fontSize: '12px',
  transition: 'transform 0.3s ease',
});

globalStyle('.accordion-trigger[data-expanded]::after', {
  transform: 'rotate(180deg)',
});

globalStyle('.panel-content', {
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.md,
  padding: vars.spacing.md,
  color: vars.colors.primary,
});
