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
  PHONE_VIEWPORT_PRESET,
  demoViewportStore,
  setBrowserViewportSize,
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

const DemoViewer: Component = () => {
  return (
    <main class={styles.viewer} data-demo-viewer>
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
  const location = useLocation();
  let gameRef: ZylemGameElement | undefined;
  let viewportFrameRef: HTMLDivElement | undefined;
  let stageAreaRef: HTMLDivElement | undefined;

  const [example, setExample] = createSignal<any>(null);
  const [loading, setLoading] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  const [message, setMessage] = createSignal('');
  const [stageAreaSize, setStageAreaSize] = createSignal({
    width: PHONE_VIEWPORT_PRESET.width,
    height: PHONE_VIEWPORT_PRESET.height,
  });

  const controlsHidden = () =>
    demoViewportStore.viewportControlsMode === 'hidden';
  const screenshotMode = createMemo(() =>
    isScreenshotModeSearch(location.search)
  );
  const activeViewportProfile = () =>
    controlsHidden() ? 'mobile' : demoViewportStore.viewportProfile;
  const screenshotGameStyle = () => ({
    width: `${demoViewportStore.viewportSize.width}px`,
    height: `${demoViewportStore.viewportSize.height}px`,
  });
  const viewportFrameStyle = () => {
    if (!controlsHidden()) {
      return {
        width: `${demoViewportStore.viewportSize.width}px`,
        height: `${demoViewportStore.viewportSize.height}px`,
      };
    }

    const availableWidth = stageAreaSize().width;
    const availableHeight = stageAreaSize().height;
    const widthScale = availableWidth / PHONE_VIEWPORT_PRESET.width;
    const heightScale = availableHeight / PHONE_VIEWPORT_PRESET.height;
    const scale = Math.min(widthScale, heightScale, 1);
    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;

    return {
      width: `${Math.round(PHONE_VIEWPORT_PRESET.width * safeScale)}px`,
      height: `${Math.round(PHONE_VIEWPORT_PRESET.height * safeScale)}px`,
    };
  };

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

    const syncBrowserViewport = () => {
      setBrowserViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    syncBrowserViewport();
    window.addEventListener('resize', syncBrowserViewport);

    let frameObserver: ResizeObserver | null = null;
    let stageObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && viewportFrameRef) {
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

    if (typeof ResizeObserver !== 'undefined' && stageAreaRef) {
      stageObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        setStageAreaSize({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      });
      stageObserver.observe(stageAreaRef);
    }

    onCleanup(() => {
      frameObserver?.disconnect();
      stageObserver?.disconnect();
      window.removeEventListener('resize', syncBrowserViewport);
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
      class={`${styles.container} ${screenshotMode() ? styles.containerScreenshot : ''}`}
    >
      <Show when={!controlsHidden() && !screenshotMode()}>
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
        <div ref={stageAreaRef} class={styles.stageArea}>
          <div class={styles.viewportShell}>
            <div
              ref={viewportFrameRef}
              class={`${styles.viewportFrame} ${controlsHidden() ? styles.viewportFrameFixed : ''}`}
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
      </Show>
    </div>
  );
};

export default DemoViewer;
