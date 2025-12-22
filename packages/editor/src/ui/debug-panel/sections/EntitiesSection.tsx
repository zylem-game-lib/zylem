import { Component, For, createSignal, onCleanup, onMount } from 'solid-js';
import { subscribe } from 'valtio/vanilla';
import Info from 'lucide-solid/icons/info';
import { stageState, debugState, printToConsole, resetHoveredEntity, getHoveredEntityId } from '../../../store';
import type { BaseEntityInterface } from '../../../store/types';

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
        class="zylem-toolbar-btn zylem-button"
        onClick={() => {
          printToConsole(`Entity: ${JSON.stringify(props.entity, null, 2)}`);
        }}
      >
        <Info class="zylem-icon" />
      </button>
    </div>
  );
};

export const EntitiesSection: Component = () => {
  const [hoveredUuid, setHoveredUuid] = createSignal<string | null>(
    getHoveredEntityId(),
  );

  onMount(() => {
    const unsub = subscribe(debugState, () => {
      setHoveredUuid(debugState.hoveredEntityId);
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
