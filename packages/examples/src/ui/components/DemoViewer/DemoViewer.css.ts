import { style } from '@vanilla-extract/css';
import { vars } from '@zylem/ui';

export const viewer = style({
  flex: 1,
  minWidth: 0,
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
});

export const container = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.md,
  height: '100%',
  minHeight: 0,
  '@media': {
    'screen and (max-width: 900px)': {
      gap: vars.spacing.sm,
    },
  },
});

export const containerScreenshot = style({
  gap: 0,
});

export const containerMobile = style({
  gap: 0,
  height: '100%',
  '@media': {
    'screen and (max-width: 900px)': {
      gap: 0,
    },
  },
});

export const stageArea = style({
  position: 'relative',
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  padding: `0 ${vars.spacing.lg} ${vars.spacing.lg}`,
  '@media': {
    'screen and (max-width: 900px)': {
      padding: `0 ${vars.spacing.md} ${vars.spacing.md}`,
    },
  },
});

export const viewportShell = style({
  minHeight: '100%',
  display: 'grid',
  placeItems: 'center',
  padding: `${vars.spacing.lg} 0 ${vars.spacing.xxl}`,
  '@media': {
    'screen and (max-width: 900px)': {
      minHeight: 'auto',
      padding: `${vars.spacing.sm} 0 ${vars.spacing.lg}`,
    },
  },
});

export const viewportFrame = style({
  position: 'relative',
  resize: 'both',
  overflow: 'hidden',
  minWidth: 'min(320px, 100%)',
  minHeight: '320px',
  maxWidth: '100%',
  borderRadius: '1.25rem',
  border: `1px solid color-mix(in srgb, ${vars.colors.border} 80%, transparent)`,
  background: [
    `radial-gradient(circle at top, color-mix(in srgb, ${vars.colors.primary} 18%, transparent), transparent 50%)`,
    `color-mix(in srgb, ${vars.colors.surface} 90%, black 10%)`,
  ].join(', '),
  boxShadow: [
    '0 20px 50px rgba(0, 0, 0, 0.28)',
    'inset 0 0 0 1px rgba(255, 255, 255, 0.04)',
  ].join(', '),
  '@media': {
    'screen and (max-width: 900px)': {
      minWidth: 'min(18rem, 100%)',
      minHeight: '14rem',
      borderRadius: '1rem',
    },
  },
});

export const gameContainer = style({
  position: 'relative',
  width: '100%',
  height: '100%',
});

export const gameContainerMobile = style({
  background: [
    `radial-gradient(circle at top, color-mix(in srgb, ${vars.colors.primary} 18%, transparent), transparent 54%)`,
    `linear-gradient(180deg, color-mix(in srgb, ${vars.colors.surface} 90%, black 10%), color-mix(in srgb, ${vars.colors.background} 92%, black 8%))`,
  ].join(', '),
});

export const mobileStageArea = style({
  position: 'relative',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
});

export const mobileViewportFrame = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
});

export const mobileInteractionShield = style({
  position: 'absolute',
  inset: 0,
  zIndex: 60,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
});

export const screenshotStage = style({
  flex: 1,
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  overflow: 'hidden',
});

export const screenshotGameFrame = style({
  position: 'relative',
  flex: 'none',
});

export const screenshotGame = style({
  display: 'block',
});

export const placeholder = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
});

export const placeholderContent = style({
  textAlign: 'center',
  color: vars.colors.text,
  opacity: 0.6,
});

export const placeholderTitle = style({
  fontSize: '1.5rem',
  marginBottom: vars.spacing.sm,
});

export const placeholderSubtitle = style({
  fontSize: '0.875rem',
});

export const loadingOverlay = style({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: vars.colors.background,
  zIndex: 50,
});

export const loadingContent = style({
  textAlign: 'center',
});

export const loadingTitle = style({
  fontSize: '1.25rem',
  fontWeight: 700,
  marginBottom: vars.spacing.sm,
});

export const progressBar = style({
  width: '16rem',
  height: '0.5rem',
  background: vars.colors.surfaceHover,
  borderRadius: vars.borders.radius,
  overflow: 'hidden',
});

export const progressFill = style({
  height: '100%',
  background: vars.colors.primary,
  transition: 'width 0.2s ease',
});

export const loadingMessage = style({
  fontSize: '0.875rem',
  color: vars.colors.text,
  opacity: 0.6,
  marginTop: vars.spacing.sm,
});
