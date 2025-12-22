import type { Component } from 'solid-js';
import { getGlobalState, state, printToConsole } from '../../../store';

export const GameSection: Component = () => (
  <div class="panel-content">
    <section class="zylem-toolbar">
      <button
        class="zylem-toolbar-btn zylem-button"
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
        class="zylem-toolbar-btn zylem-button"
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
