import { createSignal, onCleanup, type Component } from 'solid-js';
import { subscribe } from 'valtio/vanilla';
import { consoleState, clearConsole } from '..';

/**
 * Console component displays an interactive console for debugging.
 */
export const Console: Component = () => {
  const [consoleContent, setConsoleContent] = createSignal(
    consoleState.messages.join('\n'),
  );

  // Subscribe to Valtio state changes and sync to Solid signal
  const unsubscribe = subscribe(consoleState, () => {
    setConsoleContent(consoleState.messages.join('\n'));
  });

  onCleanup(() => {
    unsubscribe();
  });

  const handleInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    setConsoleContent(target.value);
  };

  return (
    <div class="zylem-console-container">
      <div class="zylem-console-wrapper">
        <textarea
          value={consoleContent()}
          onInput={handleInput}
          class="zylem-console"
          spellcheck={false}
        />
        <button onClick={clearConsole} class="zylem-console-clear zylem-button">
          Clear
        </button>
      </div>
    </div>
  );
};
