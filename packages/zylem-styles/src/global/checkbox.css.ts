import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../theme.css';

globalStyle('.zylem-checkbox-root', {
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.spacing.md,
  cursor: 'pointer',
  userSelect: 'none',
});

globalStyle('.zylem-checkbox-root[data-disabled]', {
  opacity: 0.5,
  cursor: 'not-allowed',
});

globalStyle('.zylem-checkbox-input', {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});

globalStyle('.zylem-checkbox-control', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '20px',
  border: `${vars.borders.width} solid ${vars.colors.primary}`,
  borderRadius: `calc(${vars.borders.radius} / 3)`,
  background: 'transparent',
  transition: 'background-color 0.15s ease, border-color 0.15s ease',
});

globalStyle('.zylem-checkbox-root:hover .zylem-checkbox-control', {
  borderColor: vars.colors.primaryHover,
  background: 'rgba(97, 166, 232, 0.1)',
});

globalStyle('.zylem-checkbox-root[data-checked] .zylem-checkbox-control', {
  background: vars.colors.primary,
  borderColor: vars.colors.primary,
});

globalStyle(
  '.zylem-checkbox-root[data-checked]:hover .zylem-checkbox-control',
  {
    background: vars.colors.primaryHover,
    borderColor: vars.colors.primaryHover,
  },
);

globalStyle('.zylem-checkbox-icon', {
  width: '14px',
  height: '14px',
  color: vars.colors.background,
  strokeWidth: 3,
});

globalStyle('.zylem-checkbox-label', {
  fontFamily: vars.typography.fontFamily,
  fontSize: vars.typography.fontSize,
  color: vars.colors.text,
});

globalStyle('.zylem-checkbox-root:hover .zylem-checkbox-label', {
  color: vars.colors.primary,
});
