import { Component } from 'solid-js';
import { stageState, stageStateToString, printToConsole } from '../../../store';

export const StagesSection: Component = () => (
  <div class="panel-content">
    <section class="zylem-toolbar">
      <button
        class="zylem-toolbar-btn zylem-button"
        onClick={() => {
          const currentStageState = stageState;
          printToConsole(
            `Stage State: ${stageStateToString(currentStageState)}`,
          );
        }}
      >
        Print Stage State
      </button>
      <button
        class="zylem-toolbar-btn zylem-button"
        onClick={() => {
          const allStageState = stageState;
          printToConsole(
            `All Stage State: ${stageStateToString(allStageState)}`,
          );
        }}
      >
        Print All Stage
      </button>
    </section>
  </div>
);
