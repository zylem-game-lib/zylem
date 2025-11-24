import { stageState } from '../../../../../game-lib/src/lib/stage/stage-state';
import { Component, For, createSignal, onCleanup, onMount } from 'solid-js';
import { printToConsole } from '../../../debug/console/console-state';
import {
  setHoveredEntity,
  resetHoveredEntity,
  debugState,
  getHoveredEntity,
} from '../../../../../game-lib/src/lib/debug/debug-state';
import './EntitiesSection.css';
import Info from 'lucide-solid/icons/info';
import { BaseEntityInterface } from '../../../../../game-lib/src/lib/types/entity-types';
import { subscribe } from 'valtio/vanilla';

interface EntityRowProps {
  entity: Partial<BaseEntityInterface>;
  index: number;
  hoveredUuid: string | null;
}

const EntityRow: Component<EntityRowProps> = (props) => {
  return (
    <div
      class={`entity-item ${
        props.hoveredUuid === props.entity.uuid ? 'hovered' : ''
      }`}
      onMouseEnter={() => {
        // Note: setHoveredEntity now expects a GameEntity, not a UUID
        // This needs to be updated to pass the entity object
        // For now, commenting out to prevent errors
        // TODO: Update to pass entity object
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
    getHoveredEntity()?.uuid ?? null,
  );

  onMount(() => {
    const unsub = subscribe(debugState, () => {
      setHoveredUuid(debugState.hoveredEntity?.uuid ?? null);
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
