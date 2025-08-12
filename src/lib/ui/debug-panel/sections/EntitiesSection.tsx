import { stageState } from '../../../stage/stage-state';
import { Component, For, createSignal, onCleanup, onMount } from 'solid-js';
import { printToConsole } from '../../../debug/console/console-state';
import {
  setHoveredEntity,
  resetHoveredEntity,
  debugState,
  getHoveredEntity,
} from '../../../debug/debug-state';
import './EntitiesSection.css';
import Info from 'lucide-solid/icons/info';
import { BaseEntityInterface } from '~/lib/types';
import { subscribe } from 'valtio/vanilla';

interface EntityRowProps {
  entity: Partial<BaseEntityInterface>;
  index: number;
  hoveredUuid: string | null;
}

export const EntityRow: Component<EntityRowProps> = (props) => {
  return (
    <div
      class={`entity-item ${
        props.hoveredUuid === props.entity.uuid ? 'hovered' : ''
      }`}
      onMouseEnter={() => {
        const uuid = props.entity.uuid;
        if (uuid) {
          setHoveredEntity(uuid);
        }
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

export const EntitiesSection: Component = () => {
  const [hoveredUuid, setHoveredUuid] = createSignal<string | null>(
    getHoveredEntity(),
  );

  onMount(() => {
    const unsub = subscribe(debugState, () => {
      setHoveredUuid(debugState.hovered);
    });
    onCleanup(() => unsub());
  });

  return (
    <div class="panel-content" onMouseEnter={() => resetHoveredEntity()}>
      <div class="entities-list">
        <For each={stageState.entities}>
          {(entity, index) => (
            <EntityRow
              entity={entity}
              index={index()}
              hoveredUuid={hoveredUuid()}
            />
          )}
        </For>
      </div>
    </div>
  );
};
