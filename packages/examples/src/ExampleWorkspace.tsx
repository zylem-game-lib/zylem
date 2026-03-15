import { Component, Show, createEffect, on } from 'solid-js';
import { useLocation } from '@solidjs/router';
import styles from './App.module.css';
import SidePanel from './components/SidePanel/SidePanel';
import DemoViewer from './components/DemoViewer/DemoViewer';
import { getExampleByRoutePath } from './examples-config';
import { isScreenshotModeSearch } from './screenshot-mode';
import { appStore, setActiveExample } from './store/appStore';
import { resetEditorState } from './store/editorStateStore';

const ExampleWorkspace: Component = () => {
    const location = useLocation();
    const screenshotMode = () => isScreenshotModeSearch(location.search);

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

                if (nextExample) {
                    setActiveExample(nextExample);
                }
            }
        )
    );

    return (
        <div
            class={`bg-zylem-background text-zylem-text font-zylem ${styles.appShell}`}
        >
            <Show when={!screenshotMode()}>
                <SidePanel />
            </Show>
            <DemoViewer />
        </div>
    );
};

export default ExampleWorkspace;
