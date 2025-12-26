import { createSignal, type Component } from 'solid-js';
import { getGlobalState, state } from './game-state';
import { printToConsole } from '..';
import { dispatchEditorUpdate } from '../editor-events';

export const GameSection: Component = () => {
    const [debugFlag, setDebugFlag] = createSignal(false);

    const handleDebugToggle = (checked: boolean) => {
        setDebugFlag(checked);
        dispatchEditorUpdate({ gameState: { debugFlag: checked } });
    };

    return (
        <div class="panel-content">
            <section class="zylem-toolbar">
                <label class="zylem-checkbox-label">
                    <input
                        type="checkbox"
                        class="zylem-checkbox"
                        checked={debugFlag()}
                        onChange={(e) => handleDebugToggle(e.currentTarget.checked)}
                    />
                    Debug Mode
                </label>
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
