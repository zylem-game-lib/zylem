import { Component } from 'solid-js';
import { stageState } from '../../../stage/stage-state';
import { printToConsole } from '../../console/console-state';
import { stageStateToString } from '../../../stage/stage-state';

export const StageConfigPanel: Component = () => (
  <div class="panel-content">
    <section class="zylem-debug-toolbar">
      <button
        class="zylem-debug-toolbar-btn"
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
        class="zylem-debug-toolbar-btn"
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
