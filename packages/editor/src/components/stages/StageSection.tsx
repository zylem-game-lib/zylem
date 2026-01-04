import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { useEditor } from '../EditorContext';
import { stageStateToString, stageState } from './stage-state';
import { printToConsole } from '..';
import { PropertyRow } from '../common/PropertyRow';

export const StageSection: Component = () => {
    const { stage } = useEditor();

    return (
        <div class="panel-content">
            <Show when={stage.config}>
                <section class="zylem-property-list">
                    <PropertyRow label="ID" value={stage.config?.id} />
                    <PropertyRow label="Background" value={stage.config?.backgroundColor} />
                    <Show when={stage.config?.backgroundImage}>
                        <PropertyRow 
                            label="Image" 
                            value={stage.config?.backgroundImage ?? ''} 
                            isPath={true}
                        />
                    </Show>
                    <PropertyRow label="Gravity">
                        X:{stage.config?.gravity.x.toFixed(2)} Y:{stage.config?.gravity.y.toFixed(2)} Z:{stage.config?.gravity.z.toFixed(2)}
                    </PropertyRow>
                    <Show when={Object.keys(stage.config?.variables ?? {}).length > 0}>
                        <PropertyRow 
                            label="Variables" 
                            value={`${Object.keys(stage.config?.variables ?? {}).length} defined`} 
                        />
                    </Show>
                </section>
            </Show>
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
        </div>
    );
};
