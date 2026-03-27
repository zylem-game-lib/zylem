import { Component, Show, createEffect, on, onCleanup, onMount } from 'solid-js';
import { useLocation } from '@solidjs/router';
import styles from './App.module.css';
import SidePanel from './components/SidePanel/SidePanel';
import DemoViewer from './components/DemoViewer/DemoViewer';
import MobileWorkspace from './components/MobileWorkspace/MobileWorkspace';
import { getExampleByRoutePath } from './examples-config';
import { isScreenshotModeSearch } from './screenshot-mode';
import {
    appStore,
    setActiveExample,
    setMobileDemoDrawerOpen,
} from './store/appStore';
import {
    demoViewportStore,
    isMobileShellViewportMode,
    startDemoViewportTracking,
} from './store/demoViewportStore';
import { resetEditorState } from './store/editorStateStore';

const ExampleWorkspace: Component = () => {
    const location = useLocation();
    const screenshotMode = () => isScreenshotModeSearch(location.search);
    const useMobileShell = () =>
        !screenshotMode()
        && isMobileShellViewportMode(demoViewportStore.viewportControlsMode);

    onMount(() => {
        const stopViewportTracking = startDemoViewportTracking();
        onCleanup(stopViewportTracking);
    });

    createEffect(
        on(
            () => location.pathname,
            (pathname) => {
                const nextExample = getExampleByRoutePath(pathname);
                const activeExampleId = appStore.activeExample?.id ?? null;
                const nextExampleId = nextExample?.id ?? null;

                if (activeExampleId === nextExampleId) {
                    return;
                }

                resetEditorState();
                setActiveExample(null);
                setMobileDemoDrawerOpen(false);

                if (nextExample) {
                    setActiveExample(nextExample);
                }
            }
        )
    );

    return (
        <div
            class={`bg-zylem-background text-zylem-text font-zylem ${styles.appShell} ${useMobileShell() ? styles.appShellMobile : ''}`}
        >
            <Show
                when={useMobileShell()}
                fallback={
                    <>
                        <Show when={!screenshotMode()}>
                            <SidePanel />
                        </Show>
                        <DemoViewer layout="desktop" />
                    </>
                }
            >
                <MobileWorkspace />
            </Show>
        </div>
    );
};

export default ExampleWorkspace;
