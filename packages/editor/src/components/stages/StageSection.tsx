import { Component, For, createSignal, onMount, onCleanup } from 'solid-js';
import { stageState, stageStateToString } from './stage-state';
import { printToConsole } from '..';

// Event name constant - must match game-lib's STAGE_STATE_CHANGE
const STAGE_STATE_CHANGE = 'STAGE_STATE_CHANGE';

interface StageEntity {
    uuid: string;
    name: string;
}

export const StageSection: Component = () => {
    const [entities, setEntities] = createSignal<StageEntity[]>([]);

    onMount(() => {
        const handleStageStateChange = (event: Event) => {
            const customEvent = event as CustomEvent<{ entities: StageEntity[] }>;
            if (customEvent.detail?.entities) {
                setEntities(customEvent.detail.entities);
            }
        };

        window.addEventListener(STAGE_STATE_CHANGE, handleStageStateChange);

        onCleanup(() => {
            window.removeEventListener(STAGE_STATE_CHANGE, handleStageStateChange);
        });
    });

    return (
        <div class="panel-content">
            <section class="zylem-toolbar">
                <button
                    class="zylem-toolbar-btn zylem-button"
                    onClick={() => {
                        printToConsole(`Stage State: ${stageStateToString(stageState)}`);
                    }}
                >
                    Print Stage State
                </button>
            </section>
            <section class="zylem-section">
                <h4 class="zylem-section-title">Entities ({entities().length})</h4>
                <ul class="zylem-list">
                    <For each={entities()}>
                        {(entity) => (
                            <li class="zylem-list-item">
                                <span class="zylem-entity-name">{entity.name}</span>
                            </li>
                        )}
                    </For>
                </ul>
            </section>
        </div>
    );
};
