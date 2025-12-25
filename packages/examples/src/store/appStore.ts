/**
 * SolidJS store for app state.
 * Uses SolidJS createStore with exported actions following the editor-store pattern.
 */

import { createStore } from 'solid-js/store';
import { ExampleConfig, examples } from '../examples-config';

export const [appStore, setAppStore] = createStore({
    activeExample: null as ExampleConfig | null,
    searchTerm: '',
    sidePanelOpen: true,
});

// Actions
export const setActiveExample = (example: ExampleConfig | null) => {
    setAppStore('activeExample', example);
};

export const setSearchTerm = (term: string) => {
    setAppStore('searchTerm', term);
};

export const toggleSidePanel = () => {
    setAppStore('sidePanelOpen', !appStore.sidePanelOpen);
};

export const setSidePanelOpen = (open: boolean) => {
    setAppStore('sidePanelOpen', open);
};

// Derived state helper
export const getFilteredExamples = () => {
    return examples.filter((e) =>
        e.name.toLowerCase().includes(appStore.searchTerm.toLowerCase())
    );
};
