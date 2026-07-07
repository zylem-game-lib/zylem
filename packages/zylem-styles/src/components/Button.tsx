import type { JSX } from 'solid-js';
import { splitProps } from 'solid-js';

export type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * High-level wrapper around the global `.zylem-button` style. First component
 * of the @zylem/styles component library; future components (Toolbar,
 * Accordion, Panel, ...) should follow this same pattern: a thin Solid
 * component over the token-driven global styles.
 */
export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ['class', 'children']);
  return (
    <button type="button" class={local.class ? `zylem-button ${local.class}` : 'zylem-button'} {...rest}>
      {local.children}
    </button>
  );
}
