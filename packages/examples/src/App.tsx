import { Component, Show } from 'solid-js';
import { useLocation } from '@solidjs/router';
import type { RouteSectionProps } from '@solidjs/router';
import { ZylemGameElement } from '@zylem/game-lib';
import { registerZylemEditor } from '@zylem/editor';
import { isScreenshotModeSearch } from './screenshot-mode';

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

const App: Component<RouteSectionProps> = (props) => {
  const location = useLocation();
  const screenshotMode = () => isScreenshotModeSearch(location.search);

  return (
    <>
      {props.children}
      <Show when={!screenshotMode()}>
        <zylem-editor class="fixed inset-0 z-[1000] pointer-events-none [&>*]:pointer-events-auto"></zylem-editor>
      </Show>
    </>
  );
};

export default App;
