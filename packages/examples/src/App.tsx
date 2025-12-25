import { Component } from 'solid-js';
import { ZylemGameElement } from '@zylem/game-lib';
import { registerZylemEditor } from '@zylem/editor';
import SidePanel from './components/SidePanel/SidePanel';
import DemoViewer from './components/DemoViewer/DemoViewer';

if (!customElements.get('zylem-game')) {
  customElements.define('zylem-game', ZylemGameElement);
}
registerZylemEditor();

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'zylem-editor': any;
    }
  }
}

const App: Component = () => {
  return (
    <>
      <div class="flex h-screen w-screen bg-zylem-background text-zylem-text font-zylem overflow-hidden relative">
        <SidePanel />
        <DemoViewer />
      </div>
      <zylem-editor class="fixed inset-0 z-[1000] pointer-events-none [&>*]:pointer-events-auto"></zylem-editor>
    </>
  );
};

export default App;
