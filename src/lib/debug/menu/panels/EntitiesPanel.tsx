import { stageState } from '../../../stage/stage-state';
import { Component, For } from 'solid-js';
import { printToConsole } from '../../console/console-state';
import './EntitiesPanel.css';

export const EntitiesPanel: Component = () => (
  <div class="panel-content">
    <h3>Active Entities</h3>
    <div class="entities-list">
      <For each={stageState.entities}>
        {(entity, index) => (
          <div class="entity-item">
            <h4>{entity.name || `Entity ${index()}`}</h4>
            <div class="entity-details">
              <For each={Object.entries(entity as any)}>
                {([key, value]) => (
                  <div class="entity-property">
                    <strong>{key}:</strong>
                    <p>{String(value)}</p>
                  </div>
                )}
              </For>
            </div>
            <button
              class="zylem-debug-toolbar-btn"
              onClick={() => {
                printToConsole(`Entity: ${JSON.stringify(entity, null, 2)}`);
              }}
            >
              Log Entity
            </button>
          </div>
        )}
      </For>
    </div>
  </div>
);
