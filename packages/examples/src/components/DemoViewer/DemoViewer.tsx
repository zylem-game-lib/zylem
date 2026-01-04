import {
    Component,
    createSignal,
    createEffect,
    onMount,
    onCleanup,
    Show,
} from 'solid-js';
import { ZylemGameElement, zylemEventBus, type GameLoadingPayload } from '@zylem/game-lib';
import { editorEvents } from '@zylem/editor';
import { appStore } from '../../store/appStore';
// editorStateStore is imported for side effects (sets up event listener)
import '../../store/editorStateStore';
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

    // Listen for game loading events via zylemEventBus
    const handleLoadingEvent = (event: GameLoadingPayload) => {
        setProgress(event.progress ?? 0);
        setMessage(event.message ?? '');
        if (event.type === 'start') {
            setLoading(true);
        } else if (event.type === 'complete') {
            setLoading(false);
        }
    };

    onMount(() => {
        // Subscribe to all loading event types
        zylemEventBus.on('loading:start', handleLoadingEvent);
        zylemEventBus.on('loading:progress', handleLoadingEvent);
        zylemEventBus.on('loading:complete', handleLoadingEvent);
    });

    onCleanup(() => {
        zylemEventBus.off('loading:start', handleLoadingEvent);
        zylemEventBus.off('loading:progress', handleLoadingEvent);
        zylemEventBus.off('loading:complete', handleLoadingEvent);
        editorEvents.emit({ type: 'debug', payload: { enabled: false } });
    });

    createEffect(() => {
        const activeExample = appStore.activeExample;
        if (!activeExample) return;

        setLoading(true);
        setProgress(0);
        setMessage('Loading...');
        setExample(null);
        
        activeExample.load().then((gameModule) => {
            const game = gameModule.default;
            setExample(game);

            // Enable debug mode for the editor when game loads
            editorEvents.emit({ type: 'debug', payload: { enabled: true } });
        });
    });

    // Note: debug state sync happens directly in editorStateStore via valtio mutation
    // This avoids any re-renders of the game component

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
