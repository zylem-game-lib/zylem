import { stageState } from '../../../stage/stage-state';
import { Component, For } from 'solid-js';
import { printToConsole } from '../../console/console-state';
import { setHoveredEntity, resetHoveredEntity } from '../../debug-state';
import './EntitiesPanel.css';
import Info from 'lucide-solid/icons/info';
import { BaseEntityInterface } from '~/lib/types';

interface EntityRowProps {
  entity: Partial<BaseEntityInterface>;
  index: number;
}

export const EntityRow: Component<EntityRowProps> = (props) => {
  return (
    <div
      class="entity-item"
      onMouseEnter={() => {
        const uuid = props.entity.uuid;
        if (uuid) {
          setHoveredEntity(uuid);
        }
      }}
      onMouseLeave={() => {
        resetHoveredEntity();
      }}
    >
      <h4>{props.entity.name || `Entity ${props.entity.uuid}`}</h4>
      <div class="entity-details"></div>
      <button
        class="zylem-debug-toolbar-btn"
        onClick={() => {
          printToConsole(`Entity: ${JSON.stringify(props.entity, null, 2)}`);
        }}
      >
        <Info class="zylem-debug-icon" />
      </button>
    </div>
  );
};

export const EntitiesPanel: Component = () => (
  <div class="panel-content">
    <h3 class="zylem-exo-2">Active Entities</h3>
    <div class="entities-list">
      <For each={stageState.entities}>
        {(entity, index) => <EntityRow entity={entity} index={index()} />}
      </For>
    </div>
  </div>
);
