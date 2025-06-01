import type { Component } from 'solid-js';
import { stageState } from '../../../state/stage-state';
import './EntitiesPanel.css';

export const EntitiesPanel: Component = () => (
  <div class="panel-content">
    <h2>Entities</h2>
    <p>Entities: {stageState.entities.length}</p>
    <div class="entity-list">
      {stageState.entities.map((entity) => (
        <div class="entity-item">
          <p>{entity.uuid}</p>
          <p>{entity.eid}</p>
        </div>
      ))}
    </div>
  </div>
);
