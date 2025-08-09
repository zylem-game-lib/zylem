import { stageState } from '../../../stage/stage-state';
import { Component, For } from 'solid-js';
import { printToConsole } from '../../../debug/console/console-state';
import {
  setHoveredEntity,
  resetHoveredEntity,
} from '../../../debug/debug-state';
import './EntitiesSection.css';
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
        class="zylem-debug-toolbar-btn zylem-debug-button"
        onClick={() => {
          printToConsole(`Entity: ${JSON.stringify(props.entity, null, 2)}`);
        }}
      >
        <Info class="zylem-debug-icon" />
      </button>
    </div>
  );
};

export const EntitiesSection: Component = () => (
  <div class="panel-content">
    <div class="entities-list">
      <For each={stageState.entities}>
        {(entity, index) => <EntityRow entity={entity} index={index()} />}
      </For>
    </div>
  </div>
);
