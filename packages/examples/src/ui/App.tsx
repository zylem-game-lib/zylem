import { Component, Show } from 'solid-js';
import { useLocation } from '@solidjs/router';
import type { RouteSectionProps } from '@solidjs/router';
import { ZylemGameElement } from '@zylem/game-lib/web-components';
import { registerZylemEditor } from '@zylem/editor';
import { isScreenshotModeSearch } from '../screenshot-mode';
import {
  demoViewportStore,
  isMobileShellViewportMode,
} from '../store/demoViewportStore';
import { editorOverlay } from './App.css';

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
  const editorLauncherMode = () =>
    isMobileShellViewportMode(demoViewportStore.viewportControlsMode)
      ? 'hidden'
      : 'floating';

  return (
    <>
      {props.children}
      <Show when={!screenshotMode()}>
        <zylem-editor
          class={editorOverlay}
          launcher-mode={editorLauncherMode()}
        ></zylem-editor>
      </Show>
    </>
  );
};

export default App;
