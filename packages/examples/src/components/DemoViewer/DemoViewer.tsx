import {
  Component,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { useLocation } from '@solidjs/router';
import {
  ZylemGameElement,
  zylemEventBus,
  type GameLoadingPayload,
} from '@zylem/game-lib';
import { editorEvents } from '@zylem/editor';
import { appStore } from '../../store/appStore';
import '../../store/editorStateStore';
import ViewportControls from '../ViewportControls/ViewportControls';
import {
  demoViewportStore,
  setMeasuredViewportSize,
} from '../../store/demoViewportStore';
import { isScreenshotModeSearch } from '../../screenshot-mode';
import styles from './DemoViewer.module.css';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'zylem-game': any;
    }
  }
}

export interface DemoViewerProps {
  layout?: 'desktop' | 'mobile';
  interceptStageInteractions?: boolean;
  onStageInteract?: () => void;
}

const DemoViewer: Component<DemoViewerProps> = (props) => {
  const layout = () => props.layout ?? 'desktop';

  return (
    <main class={styles.viewer} data-demo-viewer>
      <Show
        when={appStore.activeExample}
        fallback={
          <div class={styles.placeholder}>
            <div class={styles.placeholderContent}>
              <p class={styles.placeholderTitle}>Select an example</p>
              <p class={styles.placeholderSubtitle}>
                {layout() === 'mobile'
                  ? 'Select an example from the bottom bar'
                  : 'Use the sidebar to select an example'}
              </p>
            </div>
          </div>
        }
      >
        <ExampleRunner
          layout={layout()}
          interceptStageInteractions={props.interceptStageInteractions}
          onStageInteract={props.onStageInteract}
        />
      </Show>
    </main>
  );
};

const ExampleRunner: Component<DemoViewerProps> = (props) => {
  const location = useLocation();
  let gameRef: ZylemGameElement | undefined;
  let viewportFrameRef: HTMLDivElement | undefined;

  const [example, setExample] = createSignal<any>(null);
  const [loading, setLoading] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  const [message, setMessage] = createSignal('');

  const isMobileLayout = () => props.layout === 'mobile';
  const screenshotMode = createMemo(() =>
    isScreenshotModeSearch(location.search),
  );
  const activeViewportProfile = () =>
    isMobileLayout() ? 'mobile' : demoViewportStore.viewportProfile;
  const screenshotGameStyle = () => ({
    width: `${demoViewportStore.viewportSize.width}px`,
    height: `${demoViewportStore.viewportSize.height}px`,
  });
  const viewportFrameStyle = () => ({
    width: `${demoViewportStore.viewportSize.width}px`,
    height: `${demoViewportStore.viewportSize.height}px`,
  });

  const handleLoadingEvent = (event: GameLoadingPayload) => {
    setProgress(event.progress ?? 0);
    setMessage(event.message ?? '');
    if (event.type === 'start') {
      setLoading(true);
    } else if (event.type === 'complete') {
      setLoading(false);
      gameRef?.focus();
    }
  };

  onMount(() => {
    zylemEventBus.on('loading:start', handleLoadingEvent);
    zylemEventBus.on('loading:progress', handleLoadingEvent);
    zylemEventBus.on('loading:complete', handleLoadingEvent);

    let frameObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && viewportFrameRef) {
      setMeasuredViewportSize({
        width: Math.round(viewportFrameRef.clientWidth),
        height: Math.round(viewportFrameRef.clientHeight),
      });
      frameObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        setMeasuredViewportSize({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      });
      frameObserver.observe(viewportFrameRef);
    }

    onCleanup(() => {
      frameObserver?.disconnect();
    });
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
      setExample(gameModule.default());
      editorEvents.emit({ type: 'debug', payload: { enabled: true } });
    });
  });

  return (
    <div
      class={`${styles.container} ${screenshotMode() ? styles.containerScreenshot : ''} ${isMobileLayout() ? styles.containerMobile : ''}`}
    >
      <Show when={!isMobileLayout() && !screenshotMode()}>
        <ViewportControls />
      </Show>
      <Show
        when={!screenshotMode()}
        fallback={
          <div class={styles.screenshotStage}>
            <div class={styles.screenshotGameFrame}>
              <Show when={example()}>
                <zylem-game
                  ref={gameRef}
                  class={styles.screenshotGame}
                  data-demo-screenshot-target
                  data-demo-id={appStore.activeExample?.id ?? ''}
                  style={screenshotGameStyle()}
                  game={example()}
                  viewport-profile={demoViewportStore.viewportProfile}
                />
              </Show>
              <Show when={loading()}>
                <div class={styles.loadingOverlay} data-demo-loading-overlay>
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
        }
      >
        <Show
          when={isMobileLayout()}
          fallback={
            <div class={styles.stageArea}>
              <div class={styles.viewportShell}>
                <div
                  ref={viewportFrameRef}
                  class={styles.viewportFrame}
                  style={viewportFrameStyle()}
                >
                  <div class={styles.gameContainer}>
                    <Show when={example()}>
                      <zylem-game
                        ref={gameRef}
                        class="block h-full w-full"
                        data-demo-id={appStore.activeExample?.id ?? ''}
                        game={example()}
                        viewport-profile={activeViewportProfile()}
                      />
                    </Show>
                    <Show when={loading()}>
                      <div class={styles.loadingOverlay} data-demo-loading-overlay>
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
              </div>
            </div>
          }
        >
          <div class={styles.mobileStageArea}>
            <div ref={viewportFrameRef} class={styles.mobileViewportFrame}>
              <div class={`${styles.gameContainer} ${styles.gameContainerMobile}`}>
                <Show when={example()}>
                  <zylem-game
                    ref={gameRef}
                    class="block h-full w-full"
                    data-demo-id={appStore.activeExample?.id ?? ''}
                    game={example()}
                    viewport-profile={activeViewportProfile()}
                  />
                </Show>
                <Show when={loading()}>
                  <div class={styles.loadingOverlay} data-demo-loading-overlay>
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
                <Show when={props.interceptStageInteractions}>
                  <button
                    type="button"
                    class={styles.mobileInteractionShield}
                    aria-label="Close demo drawer"
                    onClick={() => props.onStageInteract?.()}
                  />
                </Show>
              </div>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
};

export default DemoViewer;
