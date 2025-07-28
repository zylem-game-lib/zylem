import { createEffect, createSignal, type Component } from 'solid-js';
import { consoleStore } from './console-store';
import { clearConsole } from './console-state';
import './Console.css';

/**
 * Console component for debug UI. Displays console messages and allows user input.
 */
export const Console: Component = () => {
  const [consoleContent, setConsoleContent] = createSignal(
    consoleStore.messages.join('\n'),
  );

  createEffect(() => {
    setConsoleContent(consoleStore.messages.join('\n'));
  });

  const handleInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    setConsoleContent(target.value);
  };

  return (
    <div class="zylem-debug-console-container">
      <div class="zylem-debug-console-header">
        <button onClick={clearConsole} class="zylem-debug-console-clear">
          Clear
        </button>
      </div>
      <textarea
        value={consoleContent()}
        onInput={handleInput}
        class="zylem-debug-console"
        spellcheck={false}
      />
    </div>
  );
};
