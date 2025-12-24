import {
  Component,
  createSignal,
  For,
  createEffect,
  onCleanup,
} from 'solid-js';
import { ZylemGameElement } from '@zylem/game-lib';
import { registerZylemEditor, editorEvents } from '@zylem/editor';

// Register web components
if (!customElements.get('zylem-game')) {
  customElements.define('zylem-game', ZylemGameElement);
}
registerZylemEditor();

// TypeScript declarations for custom elements
declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'zylem-game': any;
      'zylem-editor': any;
    }
  }
}

import { ExampleConfig, examples } from './examples-config';

const App: Component = () => {
  const startingExample = examples.find((e) => e.id === 'simple');
  const [activeExample, setActiveExample] = createSignal(startingExample || null);
  const [searchTerm, setSearchTerm] = createSignal('');

  const filteredExamples = () =>
    examples.filter((e) =>
      e.name.toLowerCase().includes(searchTerm().toLowerCase()),
    );

  return (
    <>
      <div class="flex h-screen w-screen bg-zylem-background text-zylem-text font-zylem overflow-hidden relative">
        {/* Scanline overlay effect */}
        <div class="overlay absolute inset-0 z-50"></div>

        <aside class="sidebar basis-[19.1%] flex-shrink-0 flex flex-col z-10">
          <div class="p-4 border-b border-zylem-background-active">
            <h1 class="text-xl font-bold mb-4 text-zylem-primary">Zylem Examples</h1>
            <input
              type="text"
              placeholder="Search..."
              class="w-full bg-zylem-background-hover border border-zylem-background-active rounded-zylem px-3 py-2 text-sm focus:outline-none focus:border-zylem-primary"
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
            />
          </div>
          <div class="flex-1 overflow-y-auto">
            <For each={filteredExamples()}>
              {(example) => (
                <button
                  class={`sidebar-item w-full text-left px-4 py-3 transition-colors border-l-4 ${activeExample()?.id === example.id
                    ? 'active'
                    : 'border-transparent text-zylem-text/80'
                    }`}
                  onClick={() => setActiveExample(example)}
                >
                  {example.name}
                </button>
              )}
            </For>
          </div>
        </aside>
        <main class="basis-[80.9%] flex-shrink-0 relative flex flex-col">
          {activeExample() ? (
            <ExampleRunner example={activeExample()!} />
          ) : (
            <div class="flex items-center justify-center h-full">
              <div class="text-center text-zylem-text/60">
                <p class="text-2xl mb-2">Select an example</p>
                <p class="text-sm">
                  Use the sidebar to select an example
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
      {/* Editor overlay - fixed position, doesn't block content */}
      <zylem-editor class="fixed inset-0 z-[1000] pointer-events-none [&>*]:pointer-events-auto"></zylem-editor>
    </>
  );
};

const ExampleRunner: Component<{ example: ExampleConfig }> = (props) => {
  let gameRef: ZylemGameElement | undefined;
  const [example, setExample] = createSignal(null);
  const [loading, setLoading] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  const [message, setMessage] = createSignal('');

  createEffect(() => {
    setLoading(true);
    setExample(null);
    props.example.load().then((gameModule) => {
      setExample(gameModule.default);
      setLoading(false);

      // Enable debug mode for the editor when game loads
      editorEvents.emit({ type: 'debug', payload: { enabled: true } });
    });
  });

  // Cleanup when unmounting
  onCleanup(() => {
    editorEvents.emit({ type: 'debug', payload: { enabled: false } });
  });

  return (
    <div class="relative w-full h-full flex">
      <div class="flex-1 relative">
        {example() && (
          <zylem-game
            ref={gameRef}
            class="block w-full h-full"
            game={example()}
          ></zylem-game>
        )}
        {loading() && (
          <div class="absolute inset-0 flex items-center justify-center bg-zylem-background z-50">
            <div class="text-center">
              <div class="text-xl font-bold mb-2">Loading...</div>
              <div class="w-64 h-2 bg-zylem-background-hover rounded-zylem overflow-hidden">
                <div
                  class="h-full bg-zylem-primary transition-all duration-200"
                  style={{ width: `${progress() * 100}%` }}
                ></div>
              </div>
              <div class="text-sm text-zylem-text/60 mt-2">{message()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
