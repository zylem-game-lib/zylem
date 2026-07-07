import { createSignal } from 'solid-js';

const initialOutput = `[INFO] Game initialized
[INFO] Stage loaded: main-level
[DEBUG] Entity count: 15
[INFO] Frame rate: 60 FPS`;

/** Mirror of the editor's Console: wrapper + textarea with overlaid clear button. */
export function ConsoleDemo() {
  const [content, setContent] = createSignal(initialOutput);

  return (
    <div class="zylem-console-container">
      <div class="zylem-console-wrapper">
        <textarea
          value={content()}
          onInput={(event) => setContent(event.currentTarget.value)}
          class="zylem-console"
          spellcheck={false}
        />
        <button type="button" onClick={() => setContent('')} class="zylem-console-clear zylem-button">
          Clear
        </button>
      </div>
    </div>
  );
}
