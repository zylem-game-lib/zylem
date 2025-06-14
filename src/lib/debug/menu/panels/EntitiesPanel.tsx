import type { Component } from 'solid-js';
import { stageState } from '../../../state/stage-state';
import { GameEntity } from '~/lib/core';
import { printToConsole } from '../../../state/console-state';
import './EntitiesPanel.css';

const EntityInfo: Component<{ entity: GameEntity<any> }> = ({ entity }) => {
  const handleClick = () => {
    let entityInfo = 'Entity Properties:\n';

    for (const [key, value] of Object.entries(entity)) {
      entityInfo += `${key}: ${value}\n`;
    }

    printToConsole(entityInfo);
  };

  return (
    <button class="entity-item-wrapper" onClick={handleClick}>
      <ul class="entity-item">
        {Object.entries(entity.debugInfo).map(([key, value]) => (
          <li class="entity-info-item">
            <p>{key}:</p>
            <p>{value}</p>
          </li>
        ))}
      </ul>
    </button>
  );
};

export const EntitiesPanel: Component = () => (
  <div class="entity-list">
    {stageState.entities.map((entity) => (
      <EntityInfo entity={entity} />
    ))}
  </div>
);
