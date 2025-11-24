import { Component, createSignal, For, onMount, createEffect } from 'solid-js';
import { ZylemGameElement } from '@zylem/game-lib';

// Manually register web component if not already registered
if (!customElements.get('zylem-game')) {
  customElements.define('zylem-game', ZylemGameElement);
}

// We need to define the custom elements for TypeScript
declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'zylem-game': any;
      'zylem-editor': any;
    }
  }
}

import { examples } from './examples-config';

const App: Component = () => {
  const [activeExample, setActiveExample] = createSignal(examples[0]);
  const [isSidebarOpen, setIsSidebarOpen] = createSignal(true);
  const [searchTerm, setSearchTerm] = createSignal('');

  const filteredExamples = () => examples.filter(e => 
    e.name.toLowerCase().includes(searchTerm().toLowerCase())
  );

  return (
    <div class="flex h-screen w-screen bg-gray-900 text-white font-sans overflow-hidden">
      <aside class="w-64 border-r border-gray-700 flex flex-col bg-gray-900 z-10">
        <div class="p-4 border-b border-gray-700">
          <h1 class="text-xl font-bold mb-4 text-blue-400">Zylem Examples</h1>
          <input 
            type="text" 
            placeholder="Search..." 
            class="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </div>
        <div class="flex-1 overflow-y-auto">
          <For each={examples}>
            {(example) => (
              <button 
                class={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-l-4 ${activeExample()?.id === example.id ? 'bg-gray-800 border-blue-500 text-blue-400' : 'border-transparent text-gray-300'}`}
                onClick={() => setActiveExample(example)}
              >
                {example.name}
              </button>
            )}
          </For>
        </div>
      </aside>
      <main class="flex-1 relative flex flex-col">
        <ExampleRunner example={activeExample()} />
      </main>
    </div>
  );
};

const ExampleRunner: Component<{ example: any }> = (props) => {
  let gameElement: any;
  let editorElement: any;
  const [loading, setLoading] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  const [message, setMessage] = createSignal('');

  const loadExample =  async (path: string) => {
    setLoading(true);
    setProgress(0);
    setMessage('Loading example...');

    try {
      // Dynamic import
      // Note: Vite needs to know about these imports. 
      // Since they are in the same directory, we might need a glob import or specific switch.
      // For now, let's try explicit switch or a map if dynamic import fails.
      
      // Load the module dynamically using the config
      const module = await props.example.load();

      const game = module.default;
      
      if (gameElement && game) {
        // Set the game on the element (this injects the container)
        gameElement.game = game;

        // Subscribe to loading events BEFORE starting the game
        game.onLoading((event: any) => {
          console.log('Loading event:', event);
          if (event.type === 'progress') {
            setProgress(event.progress || 0);
            setMessage(event.message || '');
          } else if (event.type === 'complete') {
            setLoading(false);
          }
        });

        // Now start the game
        await game.start();
      }
    } catch (err) {
      console.error('Failed to load example', err);
      setMessage('Error loading example');
      setLoading(false);
    }
  };

  // Reload when example changes
  createEffect(() => {
      loadExample(props.example.path);
  });
  
  // Initial load
  onMount(() => {
      loadExample(props.example.path);
  });

  return (
    <div class="relative w-full h-full flex">
        <div class="flex-1 relative">
            <zylem-game ref={gameElement} class="block w-full h-full"></zylem-game>
            {loading() && (
                <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div class="text-center">
                        <div class="text-xl font-bold mb-2">Loading...</div>
                        <div class="w-64 h-2 bg-gray-700 rounded overflow-hidden">
                            <div class="h-full bg-blue-500 transition-all duration-200" style={{ width: `${progress() * 100}%` }}></div>
                        </div>
                        <div class="text-sm text-gray-400 mt-2">{message()}</div>
                    </div>
                </div>
            )}
        </div>
        {/* Editor panel temporarily disabled
        <div class="w-80 border-l border-gray-700 bg-gray-900">
            <zylem-editor ref={editorElement} class="block w-full h-full"></zylem-editor>
        </div>
        */}
    </div>
  );
};

export default App;
