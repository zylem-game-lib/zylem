import type { Component } from 'solid-js';
import { printToConsole } from '@lib/debug/console/console-state';
import { getGlobalState, state } from '~/lib/game/game-state';

export const GameSection: Component = () => (
  <div class="panel-content">
    <section class="zylem-debug-toolbar">
      <button
        class="zylem-debug-toolbar-btn zylem-debug-button"
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
        class="zylem-debug-toolbar-btn zylem-debug-button"
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
