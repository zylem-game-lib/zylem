import {
    Component,
    createSignal,
    createEffect,
    onCleanup,
    Show,
} from 'solid-js';
import { ZylemGameElement } from '@zylem/game-lib';
import { editorEvents } from '@zylem/editor';
import { appStore } from '../../store/appStore';
import styles from './DemoViewer.module.css';

// TypeScript declarations for custom elements
declare module 'solid-js' {
    namespace JSX {
        interface IntrinsicElements {
            'zylem-game': any;
        }
    }
}

const DemoViewer: Component = () => {
    return (
        <main class={styles.viewer}>
            <Show
                when={appStore.activeExample}
                fallback={
                    <div class={styles.placeholder}>
                        <div class={styles.placeholderContent}>
                            <p class={styles.placeholderTitle}>Select an example</p>
                            <p class={styles.placeholderSubtitle}>
                                Use the sidebar to select an example
                            </p>
                        </div>
                    </div>
                }
            >
                <ExampleRunner />
            </Show>
        </main>
    );
};

const ExampleRunner: Component = () => {
    let gameRef: ZylemGameElement | undefined;
    const [example, setExample] = createSignal<any>(null);
    const [loading, setLoading] = createSignal(false);
    const [progress, setProgress] = createSignal(0);
    const [message, setMessage] = createSignal('');

    createEffect(() => {
        const activeExample = appStore.activeExample;
        if (!activeExample) return;

        setLoading(true);
        setExample(null);
        activeExample.load().then((gameModule) => {
            setExample(gameModule.default);
            setLoading(false);

            // Enable debug mode for the editor when game loads
            editorEvents.emit({ type: 'debug', payload: { enabled: true } });
        });
    });

    // Cleanup when unmounting
    onCleanup(() => {
        editorEvents.emit({ type: 'debug', payload: { enabled: false } });
    });

    return (
        <div class={styles.container}>
            <div class={styles.gameContainer}>
                <Show when={example()}>
                    <zylem-game
                        ref={gameRef}
                        class="block h-full w-full"
                        game={example()}
                    />
                </Show>
                <Show when={loading()}>
                    <div class={styles.loadingOverlay}>
                        <div class={styles.loadingContent}>
                            <div class={styles.loadingTitle}>Loading...</div>
                            <div class={styles.progressBar}>
                                <div
                                    class={styles.progressFill}
                                    style={{ width: `${progress() * 100}%` }}
                                />
                            </div>
                            <div class={styles.loadingMessage}>{message()}</div>
                        </div>
                    </div>
                </Show>
            </div>
        </div>
    );
};

export default DemoViewer;
