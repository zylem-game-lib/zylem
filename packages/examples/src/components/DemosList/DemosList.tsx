import { Component, For, createMemo } from 'solid-js';
import { appStore, setActiveExample, getFilteredExamples } from '../../store/appStore';
import DemoListItem from '../DemoListItem/DemoListItem';
import styles from './DemosList.module.css';
import { ExampleConfig } from '../../examples-config';

const DemosList: Component = () => {
    const filteredExamples = createMemo(() => getFilteredExamples());

    const isExampleActive = (exampleId: string) => {
        return appStore.activeExample?.id === exampleId;
    };

    const handleExampleClick = (example: ExampleConfig) => {
        setActiveExample(null);
        setActiveExample(example);
    };

    return (
        <div class={styles.listContainer}>
            <For each={filteredExamples()}>
                {(example) => (
                    <DemoListItem
                        example={example}
                        isActive={isExampleActive(example.id)}
                        onClick={() => handleExampleClick(example)}
                    />
                )}
            </For>
        </div>
    );
};

export default DemosList;

