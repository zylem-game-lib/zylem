import { createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import './Menu.css';

/**
 * Console component for debug UI. Editable, scrollable, and fills available space.
 */
export const Console: Component = () => {
  const [value, setValue] = createSignal('');
  return (
    <textarea
      value={value()}
      onInput={(e) => setValue(e.currentTarget.value)}
      class="zylem-debug-console"
      spellcheck={false}
    />
  );
};
