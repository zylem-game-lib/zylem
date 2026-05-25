import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@zylem/styles';

export const overlay = style({
  position: 'absolute',
  inset: 0,
  zIndex: 55,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  background: `color-mix(in srgb, ${vars.colors.background} 82%, transparent)`,
  backdropFilter: 'blur(6px)',
});

export const panel = style({
  width: 'min(22rem, 100%)',
  padding: '1.25rem 1.35rem',
  borderRadius: '1rem',
  border: `1px solid color-mix(in srgb, ${vars.colors.border} 70%, transparent)`,
  background: `color-mix(in srgb, ${vars.colors.surface} 94%, black 6%)`,
  boxShadow: [
    '0 16px 40px rgba(0, 0, 0, 0.35)',
    'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
  ].join(', '),
});

export const title = style({
  margin: '0 0 0.35rem',
  fontSize: '1.2rem',
  fontWeight: 700,
  color: vars.colors.text,
});

export const hint = style({
  margin: '0 0 1rem',
  fontSize: '0.78rem',
  lineHeight: 1.45,
  color: vars.colors.text,
  opacity: 0.72,
});

export const code = style({
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '0.76em',
});

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  marginBottom: '0.85rem',
});

export const label = style({
  fontSize: '0.8rem',
  fontWeight: 600,
  color: vars.colors.text,
  opacity: 0.85,
});

export const input = style({
  width: 'stretch',
  padding: '0.5rem 0.65rem',
  borderRadius: '0.5rem',
  border: `1px solid color-mix(in srgb, ${vars.colors.border} 85%, transparent)`,
  background: vars.colors.background,
  color: vars.colors.text,
  fontSize: '0.95rem',
  selectors: {
    '&:focus': {
      outline: `2px solid color-mix(in srgb, ${vars.colors.primary} 55%, transparent)`,
      outlineOffset: '1px',
    },
  },
});

export const swatches = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.45rem',
});

export const swatch = style({
  width: '2rem',
  height: '2rem',
  borderRadius: '999px',
  border: '2px solid transparent',
  cursor: 'pointer',
  padding: 0,
  selectors: {
    '&:hover': {
      filter: 'brightness(1.08)',
    },
  },
});

export const swatchActive = style({
  borderColor: vars.colors.text,
  boxShadow: `0 0 0 2px color-mix(in srgb, ${vars.colors.primary} 45%, transparent)`,
});

export const enter = style({
  width: 'stretch',
  marginTop: '0.25rem',
  padding: '0.55rem 0.75rem',
  border: 0,
  borderRadius: '0.5rem',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  color: vars.colors.background,
  background: vars.colors.primary,
  selectors: {
    '&:hover': {
      filter: 'brightness(1.05)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    },
  },
});

globalStyle(`${input}::placeholder`, {
  color: `color-mix(in srgb, ${vars.colors.text} 60%, transparent)`,
});
