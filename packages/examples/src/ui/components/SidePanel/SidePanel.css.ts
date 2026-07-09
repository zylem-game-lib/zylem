import { style } from '@vanilla-extract/css';
import { vars } from '@zylem/ui';

// Carries the glass-panel treatment itself (instead of the library `sidebar`
// class) so the aside can stay overflow-visible and the `left: 100%` toggle
// hangs outside the panel without creating scrollbars.
export const sidePanel = style({
  position: 'absolute',
  left: 0,
  top: 0,
  bottom: 0,
  width: '320px',
  maxWidth: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 100,
  background: vars.material.glassPanelDark,
  borderRight: '1px solid rgba(97, 166, 232, 0.28)',
  backdropFilter: `blur(${vars.effects.blurSm}) saturate(1.1)`,
  transform: 'translateX(0)',
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '@supports': {
    'not (backdrop-filter: blur(1px))': {
      background: vars.colors.surface,
    },
  },
  '@media': {
    'screen and (max-width: 900px)': {
      position: 'relative',
      top: 'auto',
      right: 'auto',
      bottom: 'auto',
      left: 'auto',
      width: '100%',
      maxHeight: 'min(32rem, 56dvh)',
      borderRight: 'none',
      borderBottom: `1px solid ${vars.colors.border}`,
      overflow: 'hidden',
      transform: 'none',
    },
  },
});

export const panelContent = style({
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

export const sidePanelClosed = style({
  transform: 'translateX(-100%)',
  '@media': {
    'screen and (max-width: 900px)': {
      transform: 'none',
      maxHeight: 'none',
    },
  },
});

export const panelContentClosed = style({
  '@media': {
    'screen and (max-width: 900px)': {
      display: 'none',
    },
  },
});

export const toggleButton = style({
  position: 'absolute',
  left: '100%',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '24px',
  height: '48px',
  background: vars.colors.surface,
  border: `1px solid ${vars.colors.border}`,
  borderLeft: 'none',
  borderRadius: `0 ${vars.borders.radius} ${vars.borders.radius} 0`,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.colors.text,
  transition: 'background 0.2s ease, color 0.2s ease',
  selectors: {
    '&:hover': {
      background: vars.colors.surfaceHover,
      color: vars.colors.primary,
    },
  },
  '@media': {
    'screen and (max-width: 900px)': {
      left: 'auto',
      right: vars.spacing.lg,
      top: vars.spacing.lg,
      transform: 'none',
      width: '2.25rem',
      height: '2.25rem',
      border: `1px solid color-mix(in srgb, ${vars.colors.border} 85%, transparent)`,
      borderRadius: '999px',
      background: `color-mix(in srgb, ${vars.colors.surface} 92%, black 8%)`,
      boxShadow: '0 8px 18px rgba(0, 0, 0, 0.18)',
    },
  },
});

export const toggleIcon = style({
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '@media': {
    'screen and (max-width: 900px)': {
      transform: 'rotate(-90deg)',
    },
  },
});

export const toggleIconClosed = style({
  transform: 'rotate(180deg)',
  '@media': {
    'screen and (max-width: 900px)': {
      transform: 'rotate(90deg)',
    },
  },
});
