import { Component } from 'solid-js';
import { ExampleConfig } from '../../examples-config';
import styles from './DemoListItem.module.css';

interface DemoListItemProps {
    example: ExampleConfig;
    isActive: boolean;
    onClick: () => void;
}

const DemoListItem: Component<DemoListItemProps> = (props) => {
    return (
        <button
            class={`${styles.listItem} sidebar-item`}
            classList={{ 'is-active': props.isActive }}
            onClick={props.onClick}
        >
            {props.example.name}
        </button>
    );
};

export default DemoListItem;
