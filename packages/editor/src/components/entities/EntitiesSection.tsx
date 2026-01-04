import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { useEditor } from '../EditorContext';
import { EntityIcon } from './EntityIcon';
import { printToConsole } from '..';
import type { BaseEntityInterface } from '../../types';

/**
 * Handle entity button click - logs entity debug info to console.
 */
function handleEntityClick(entity: Partial<BaseEntityInterface>): void {
    printToConsole(`Entity: ${JSON.stringify(entity, null, 2)}`);
}

export const EntitiesSection: Component = () => {
    const { stage } = useEditor();

    return (
        <div class="panel-content">
            <section class="zylem-section">
                <h4 class="zylem-section-title">Entities ({stage.entities.length})</h4>
                <div class="entity-grid">
                    <For each={stage.entities}>
                        {(entity) => (
                            <button
                                class="entity-grid-item"
                                title={entity.uuid}
                                onClick={() => handleEntityClick(entity)}
                            >
                                <EntityIcon type={entity.type ?? 'Box'} />
                            </button>
                        )}
                    </For>
                </div>
            </section>
        </div>
    );
};

