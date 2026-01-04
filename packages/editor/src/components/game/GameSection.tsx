import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { useEditor } from '../EditorContext';
import { printToConsole } from '..';

export const GameSection: Component = () => {
    const { game } = useEditor();

    return (
        <div class="panel-content">
            <Show when={game.config}>
                <section class="zylem-property-list">
                    <div class="zylem-property-row">
                        <span class="zylem-property-label">ID</span>
                        <span class="zylem-property-value">{game.config?.id}</span>
                    </div>
                    <div class="zylem-property-row">
                        <span class="zylem-property-label">Aspect Ratio</span>
                        <span class="zylem-property-value">{game.config?.aspectRatio.toFixed(3)}</span>
                    </div>
                    <div class="zylem-property-row">
                        <span class="zylem-property-label">Fullscreen</span>
                        <span class="zylem-property-value">{game.config?.fullscreen ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="zylem-property-row">
                        <span class="zylem-property-label">Debug</span>
                        <span class="zylem-property-value">{game.config?.debug ? 'Yes' : 'No'}</span>
                    </div>
                    <Show when={game.config?.internalResolution}>
                        <div class="zylem-property-row">
                            <span class="zylem-property-label">Resolution</span>
                            <span class="zylem-property-value">
                                {game.config?.internalResolution?.width}x{game.config?.internalResolution?.height}
                            </span>
                        </div>
                    </Show>
                    <Show when={game.config?.bodyBackground}>
                        <div class="zylem-property-row">
                            <span class="zylem-property-label">Background</span>
                            <span class="zylem-property-value">{game.config?.bodyBackground}</span>
                        </div>
                    </Show>
                </section>
            </Show>
            <section class="zylem-toolbar">
                <button
                    class="zylem-toolbar-btn zylem-button"
                    onClick={() => {
                        printToConsole(
                            `Global State: ${JSON.stringify(game.globals, null, 2)}`,
                        );
                    }}
                >
                    Print Global State
                </button>
                <button
                    class="zylem-toolbar-btn zylem-button"
                    onClick={() => {
                        printToConsole(`All State: ${JSON.stringify(game, null, 2)}`);
                    }}
                >
                    Print All
                </button>
            </section>
        </div>
    );
};
