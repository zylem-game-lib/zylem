/**
 * SolidJS store for app state.
 * Uses SolidJS createStore with exported actions following the editor-store pattern.
 */

import { createStore } from 'solid-js/store';
import {
    ExampleConfig,
    ExampleSection,
    exampleSections,
    examples,
} from '../examples-config';

export const [appStore, setAppStore] = createStore({
    activeExample: null as ExampleConfig | null,
    searchTerm: '',
    sidePanelOpen: true,
    mobileDemoDrawerOpen: false,
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

export const toggleMobileDemoDrawer = () => {
    setAppStore('mobileDemoDrawerOpen', !appStore.mobileDemoDrawerOpen);
};

export const setMobileDemoDrawerOpen = (open: boolean) => {
    setAppStore('mobileDemoDrawerOpen', open);
};

// Derived state helper
export const getFilteredExamples = () => {
    const searchTerm = appStore.searchTerm.trim().toLowerCase();

    if (!searchTerm) {
        return examples;
    }

    return examples.filter((example) =>
        example.name.toLowerCase().includes(searchTerm)
    );
};

export const getFilteredExampleSections = (): ExampleSection[] => {
    const searchTerm = appStore.searchTerm.trim().toLowerCase();

    if (!searchTerm) {
        return exampleSections;
    }

    return exampleSections
        .map((section) => ({
            ...section,
            examples: section.examples.filter((example) =>
                example.name.toLowerCase().includes(searchTerm)
            ),
        }))
        .filter((section) => section.examples.length > 0);
};
