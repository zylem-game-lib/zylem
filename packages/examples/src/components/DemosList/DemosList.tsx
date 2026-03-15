import { Component, For, Show, createEffect, createMemo } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { createStore } from 'solid-js/store';
import {
    appStore,
    getFilteredExampleSections,
} from '../../store/appStore';
import DemoListItem from '../DemoListItem/DemoListItem';
import styles from './DemosList.module.css';
import {
    EXAMPLE_SECTION_ORDER,
    ExampleConfig,
    ExampleSectionName,
} from '../../examples-config';

const createInitialExpandedSections = (): Record<ExampleSectionName, boolean> =>
    Object.fromEntries(
        EXAMPLE_SECTION_ORDER.map((sectionName) => [sectionName, true])
    ) as Record<ExampleSectionName, boolean>;

const DemosList: Component = () => {
    const navigate = useNavigate();
    const filteredSections = createMemo(() => getFilteredExampleSections());
    const [expandedSections, setExpandedSections] = createStore(
        createInitialExpandedSections()
    );

    const isExampleActive = (exampleId: string) => {
        return appStore.activeExample?.id === exampleId;
    };

    const isSearchActive = () => appStore.searchTerm.trim().length > 0;

    const isSectionExpanded = (sectionName: ExampleSectionName) => {
        return isSearchActive() || expandedSections[sectionName];
    };

    const toggleSection = (sectionName: ExampleSectionName) => {
        if (isSearchActive()) return;
        setExpandedSections(sectionName, (isExpanded) => !isExpanded);
    };

    const handleExampleClick = (example: ExampleConfig) => {
        if (appStore.activeExample?.id === example.id) {
            return;
        }

        navigate(example.routePath);
    };

    createEffect(() => {
        const activeSection = appStore.activeExample?.section;
        if (activeSection) {
            setExpandedSections(activeSection, true);
        }
    });

    return (
        <div class={styles.listContainer}>
            <Show
                when={filteredSections().length > 0}
                fallback={
                    <div class={styles.emptyState}>
                        No demos match "{appStore.searchTerm.trim()}".
                    </div>
                }
            >
                <For each={filteredSections()}>
                    {(section) => {
                        const sectionId = `examples-section-${section.name
                            .toLowerCase()
                            .replace(/\s+/g, '-')}`;

                        return (
                            <section class={styles.section}>
                                <button
                                    type="button"
                                    class={styles.sectionHeader}
                                    onClick={() => toggleSection(section.name)}
                                    aria-controls={sectionId}
                                    aria-expanded={isSectionExpanded(section.name)}
                                >
                                    <span class={styles.sectionHeaderText}>
                                        <span class={styles.sectionTitle}>
                                            {section.name}
                                        </span>
                                        <span class={styles.sectionCount}>
                                            {section.examples.length}
                                        </span>
                                    </span>
                                    <svg
                                        class={`${styles.sectionIcon} ${isSectionExpanded(section.name) ? styles.sectionIconExpanded : ''}`}
                                        width="14"
                                        height="14"
                                        viewBox="0 0 14 14"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M4 5.5L7 8.5L10 5.5"
                                            stroke="currentColor"
                                            stroke-width="1.75"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        />
                                    </svg>
                                </button>
                                <Show when={isSectionExpanded(section.name)}>
                                    <div id={sectionId} class={styles.sectionItems}>
                                        <For each={section.examples}>
                                            {(example) => (
                                                <DemoListItem
                                                    example={example}
                                                    isActive={isExampleActive(example.id)}
                                                    onClick={() =>
                                                        handleExampleClick(example)
                                                    }
                                                />
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </section>
                        );
                    }}
                </For>
            </Show>
        </div>
    );
};

export default DemosList;
