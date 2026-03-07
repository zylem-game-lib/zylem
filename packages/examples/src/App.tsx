import { Component } from 'solid-js';
import { ZylemGameElement } from '@zylem/game-lib';
import { registerZylemEditor } from '@zylem/editor';
import SidePanel from './components/SidePanel/SidePanel';
import DemoViewer from './components/DemoViewer/DemoViewer';
import styles from './App.module.css';

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
      <div class={`bg-zylem-background text-zylem-text font-zylem ${styles.appShell}`}>
        <SidePanel />
        <DemoViewer />
      </div>
      <zylem-editor class="fixed inset-0 z-[1000] pointer-events-none [&>*]:pointer-events-auto"></zylem-editor>
    </>
  );
};

export default App;
