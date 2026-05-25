import { globalStyle } from '@vanilla-extract/css';
import { vars } from '../theme.css';

globalStyle('.entities-list', {
  display: 'flex',
  flexDirection: 'column',
  gap: vars.spacing.md,
  overflowY: 'auto',
  overflowX: 'hidden',
});

globalStyle('ul', {
  all: 'unset',
});

globalStyle('.entity-item-wrapper', {
  all: 'unset',
  cursor: 'pointer',
});

globalStyle('.entity-item-wrapper.hovered .entity-item', {
  backgroundColor: vars.colors.successHover,
  color: vars.colors.primary,
});

globalStyle('.entity-item-wrapper:active .entity-item', {
  backgroundColor: vars.colors.active,
  color: vars.colors.backgroundTranslucent,
});

globalStyle('.entity-item', {
  display: 'grid',
  gap: vars.spacing.sm,
  gridTemplateColumns: '1fr 1fr 1fr',
  border: `${vars.borders.width} outset ${vars.colors.successHover}`,
  padding: vars.spacing.md,
  margin: `${vars.spacing.md} 0`,
  fontWeight: 600,
  transition: 'background-color 200ms cubic-bezier(0.075, 0.82, 0.165, 1)',
});

globalStyle('.entity-item.hovered', {
  backgroundColor: vars.colors.activeHover,
});

globalStyle('.entity-info-item', {
  display: 'grid',
  gridTemplateColumns: 'min-content max-content',
  gap: vars.spacing.sm,
});
