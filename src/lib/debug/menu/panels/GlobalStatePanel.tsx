import type { Component } from 'solid-js';
import { getGlobalState, state } from '../../../game/game-state';
import { printToConsole } from '../../console/console-state';

export const GlobalStatePanel: Component = () => (
  <div class="panel-content">
    <section class="zylem-debug-toolbar">
      <button
        class="zylem-debug-toolbar-btn"
        onClick={() => {
          const globalState = getGlobalState();
          printToConsole(
            `Global State: ${JSON.stringify(globalState, null, 2)}`,
          );
        }}
      >
        Print Global State
      </button>
      <button
        class="zylem-debug-toolbar-btn"
        onClick={() => {
          const allState = state;
          printToConsole(`All State: ${JSON.stringify(allState, null, 2)}`);
        }}
      >
        Print All
      </button>
    </section>
  </div>
);
