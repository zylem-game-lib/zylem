import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@zylem/styles';

export const previewFrame = style({
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  flex: 'none',
  borderRadius: '1rem',
  overflow: 'hidden',
  border: `1px solid color-mix(in srgb, ${vars.colors.border} 82%, transparent)`,
  background: [
    `radial-gradient(circle at top left, rgba(56, 103, 214, 0.24), transparent 58%)`,
    `linear-gradient(180deg, #14284f 0%, #09152d 100%)`,
  ].join(', '),
  boxShadow: [
    '0 12px 30px rgba(0, 0, 0, 0.18)',
    'inset 0 0 0 1px rgba(255, 255, 255, 0.04)',
  ].join(', '),
  transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
});

export const previewFrameActive = style({
  borderColor: `color-mix(in srgb, ${vars.colors.primary} 82%, white 18%)`,
  boxShadow: [
    '0 14px 34px rgba(0, 0, 0, 0.22)',
    `0 0 0 1px color-mix(in srgb, ${vars.colors.primary} 55%, transparent)`,
    'inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
  ].join(', '),
});

export const previewFrameCompact = style({
  aspectRatio: '1 / 1',
  borderRadius: '0.95rem',
});

export const previewImage = style({
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  opacity: 0,
  transition: 'opacity 0.18s ease',
});

export const previewImageLoaded = style({
  opacity: 1,
});

export const previewFallback = style({
  width: '100%',
  height: '100%',
  background: [
    'radial-gradient(circle at top left, rgba(111, 155, 255, 0.22), transparent 52%)',
    'linear-gradient(180deg, #173463 0%, #0b1730 100%)',
  ].join(', '),
});

export const previewCaption = style({
  position: 'absolute',
  right: 0,
  bottom: 0,
  left: 0,
  padding: `${vars.spacing.lg} ${vars.spacing.md} ${vars.spacing.md}`,
  background: [
    'linear-gradient(',
    '180deg,',
    'rgba(7, 16, 34, 0) 0%,',
    'rgba(9, 26, 58, 0.78) 30%,',
    'rgba(10, 28, 68, 0.96) 100%',
    ')',
  ].join(' '),
});

export const previewTitle = style({
  color: 'white',
  fontSize: '0.9rem',
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '0.01em',
  textWrap: 'balance' as 'normal',
});

// Compact-variant overrides for descendant caption/title — equivalent to
// the original `.previewFrameCompact .previewCaption` / `.previewTitle`
// rules. globalStyle keeps the cross-class selector intact.
globalStyle(`${previewFrameCompact} ${previewCaption}`, {
  padding: vars.spacing.md,
});

globalStyle(`${previewFrameCompact} ${previewTitle}`, {
  fontSize: '0.78rem',
});
