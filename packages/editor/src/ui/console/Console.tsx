import { createEffect, createSignal, type Component } from 'solid-js';
import { consoleState, clearConsole } from '../../store';

/**
 * Console component for debug UI. Displays console messages and allows user input.
 */
export const Console: Component = () => {
  const [consoleContent, setConsoleContent] = createSignal(
    consoleState.messages.join('\n'),
  );

  createEffect(() => {
    setConsoleContent(consoleState.messages.join('\n'));
  });

  const handleInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    setConsoleContent(target.value);
  };

  return (
    <div class="zylem-console-container">
      <div class="zylem-console-header">
        <button onClick={clearConsole} class="zylem-button">
          Clear
        </button>
      </div>
      <textarea
        value={consoleContent()}
        onInput={handleInput}
        class="zylem-console"
        spellcheck={false}
      />
    </div>
  );
};
