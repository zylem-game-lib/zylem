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
  let previousMessageCount = consoleState.messages.length;

  // Subscribe to Valtio state changes and sync to Solid signal
  const unsubscribe = subscribe(consoleState, () => {
    const messages = consoleState.messages;
    const nextCount = messages.length;

    if (nextCount === 0) {
      if (previousMessageCount !== 0) {
        setConsoleContent('');
      }
      previousMessageCount = 0;
      return;
    }

    // Fast path: append only new messages instead of rebuilding the full string.
    if (nextCount > previousMessageCount) {
      const appendedText = messages.slice(previousMessageCount).join('\n');
      if (previousMessageCount === 0) {
        setConsoleContent(appendedText);
      } else if (appendedText.length > 0) {
        setConsoleContent((prev) => `${prev}\n${appendedText}`);
      }
      previousMessageCount = nextCount;
      return;
    }

    // Fallback for non-append mutations (replace/edit).
    setConsoleContent(messages.join('\n'));
    previousMessageCount = nextCount;
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
