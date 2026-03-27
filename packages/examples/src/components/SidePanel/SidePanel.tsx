import { Component } from 'solid-js';
import HeaderSearch from '../HeaderSearch/HeaderSearch';
import DemosList from '../DemosList/DemosList';
import { appStore, toggleSidePanel } from '../../store/appStore';
import styles from './SidePanel.module.css';

const SidePanel: Component = () => {
    return (
        <aside
            class={`${styles.sidePanel} ${!appStore.sidePanelOpen ? styles.sidePanelClosed : ''} sidebar`}
            data-side-panel
        >
            <HeaderSearch />
            <div
                id="examples-list-panel"
                class={`${styles.panelContent} ${!appStore.sidePanelOpen ? styles.panelContentClosed : ''}`}
            >
                <DemosList />
            </div>
            <button
                type="button"
                class={styles.toggleButton}
                onClick={() => toggleSidePanel()}
                aria-label={appStore.sidePanelOpen ? 'Close sidebar' : 'Open sidebar'}
                aria-controls="examples-list-panel"
                aria-expanded={appStore.sidePanelOpen}
            >
                <svg
                    class={`${styles.toggleIcon} ${!appStore.sidePanelOpen ? styles.toggleIconClosed : ''}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M8 2L4 6L8 10"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </button>
        </aside>
    );
};

export default SidePanel;
