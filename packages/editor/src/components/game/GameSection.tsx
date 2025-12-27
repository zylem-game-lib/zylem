import type { Component } from 'solid-js';
import { Checkbox } from '@kobalte/core';
import Check from 'lucide-solid/icons/check';
import { getGlobalState, state } from './game-state';
import { printToConsole } from '..';
import { dispatchEditorUpdate } from '../editor-events';
import { debugStore, setDebugStore } from '../editor-store';

export const GameSection: Component = () => {
    const handleDebugToggle = (checked: boolean) => {
        // Update local store state
        setDebugStore('debug', checked);
        // Dispatch event for external consumers
        dispatchEditorUpdate({ gameState: { debugFlag: checked } });
    };

    return (
        <div class="panel-content">
            <section class="zylem-toolbar">
                <Checkbox.Root
                    class="zylem-checkbox-root"
                    checked={debugStore.debug}
                    onChange={handleDebugToggle}
                >
                    <Checkbox.Input class="zylem-checkbox-input" />
                    <Checkbox.Control class="zylem-checkbox-control">
                        <Checkbox.Indicator>
                            <Check class="zylem-checkbox-icon" />
                        </Checkbox.Indicator>
                    </Checkbox.Control>
                    <Checkbox.Label class="zylem-checkbox-label">Debug Mode</Checkbox.Label>
                </Checkbox.Root>
            </section>
            <section class="zylem-toolbar">
                <button
                    class="zylem-toolbar-btn zylem-button"
                    onClick={() => {
                        const globalState = getGlobalState();
                        printToConsole(
                            `Global State: ${JSON.stringify(globalState, null, 2)}`,
                        );
                    }}
                >
                    Print Global State
                </button>
                <button
                    class="zylem-toolbar-btn zylem-button"
                    onClick={() => {
                        const allState = state;
                        printToConsole(`All State: ${JSON.stringify(allState, null, 2)}`);
                    }}
                >
                    Print All
                </button>
            </section>
        </div>
    );
};
