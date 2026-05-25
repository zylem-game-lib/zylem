import {
  createGlobalTheme,
  createGlobalThemeContract,
} from '@vanilla-extract/css';

/**
 * Concrete design-token values for the Zylem UI.
 *
 * Each leaf in this object is paired with a CSS custom-property name in
 * {@link varNames}. The two structures must stay in lock-step. Values feed
 * `createGlobalTheme`; names feed `createGlobalThemeContract` so the
 * generated CSS variables keep their legacy `--zylem-*` identifiers.
 */
const tokens = {
  colors: {
    primary: '#61A6E8',
    primaryHover: '#3B8AD8',
    primaryActive: '#0C6EB8',

    accent: '#E64534',
    accentHover: '#C93A2C',
    accentActive: '#A82F24',

    background: '#11151C',
    backgroundTranslucent: 'rgba(10, 20, 30, 0.46)',
    surface: '#1A1F27',
    surfaceHover: '#222831',
    border: '#2D3643',

    active: 'rgba(20, 255, 60, 0.7)',
    activeHover: 'rgba(20, 255, 60, 0.4)',
    successHover: '#2a6734b3',

    text: '#E6EBEF',
    textSecondary: '#88929E',

    consoleBackground: 'rgba(20, 40, 60, 0.25)',
    consoleText: '#61A6E8',
  },
  spacing: {
    xxs: '0.125rem',
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    xxl: '2rem',
    xxxl: '3rem',
  },
  sizes: {
    icon: '28px',
    iconSm: '16px',
    iconLg: '96px',
  },
  typography: {
    fontFamily: "'Exo 2', sans-serif",
    fontSize: '14px',
  },
  borders: {
    radius: '12px',
    width: '1.5px',
  },
} as const;

/**
 * Mirror of {@link tokens} where each leaf is the CSS custom-property name
 * (sans the leading `--`). Passed to `createGlobalThemeContract` so the
 * generated `var(...)` references resolve to the legacy `--zylem-*`
 * identifiers that the rest of the codebase already consumes.
 */
const varNames = {
  colors: {
    primary: 'zylem-color-primary',
    primaryHover: 'zylem-color-primary-hover',
    primaryActive: 'zylem-color-primary-active',

    accent: 'zylem-color-accent',
    accentHover: 'zylem-color-accent-hover',
    accentActive: 'zylem-color-accent-active',

    background: 'zylem-color-background',
    backgroundTranslucent: 'zylem-color-background-translucent',
    surface: 'zylem-color-surface',
    surfaceHover: 'zylem-color-surface-hover',
    border: 'zylem-color-border',

    active: 'zylem-color-active',
    activeHover: 'zylem-color-active-hover',
    successHover: 'zylem-color-success-hover',

    text: 'zylem-color-text',
    textSecondary: 'zylem-color-text-secondary',

    consoleBackground: 'zylem-color-console-background',
    consoleText: 'zylem-color-console-text',
  },
  spacing: {
    xxs: 'zylem-spacing-xxs',
    xs: 'zylem-spacing-xs',
    sm: 'zylem-spacing-sm',
    md: 'zylem-spacing-md',
    lg: 'zylem-spacing-lg',
    xl: 'zylem-spacing-xl',
    xxl: 'zylem-spacing-xxl',
    xxxl: 'zylem-spacing-xxxl',
  },
  sizes: {
    icon: 'zylem-size-icon',
    iconSm: 'zylem-size-icon-sm',
    iconLg: 'zylem-size-icon-lg',
  },
  typography: {
    fontFamily: 'zylem-font-family',
    fontSize: 'zylem-font-size',
  },
  borders: {
    radius: 'zylem-radius',
    width: 'zylem-border',
  },
} as const;

/**
 * Typed `vars` contract — leaves resolve to `var(--zylem-*)` strings. Use
 * inside `style()` / `globalStyle()` / `sprinkles()` to consume the design
 * tokens with autocomplete and type safety.
 */
export const vars = createGlobalThemeContract(varNames);

createGlobalTheme(':root', vars, tokens);

/** Token values as a plain readonly object, exported for downstream tooling. */
export const tokenValues = tokens;
