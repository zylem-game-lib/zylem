import { Component } from 'solid-js';
import { ExampleConfig } from '../../examples-config';
import DemoPreviewImage from '../DemoPreviewImage/DemoPreviewImage';
import styles from './DemoListItem.module.css';

interface DemoListItemProps {
    example: ExampleConfig;
    isActive: boolean;
    onClick: () => void;
}

const DemoListItem: Component<DemoListItemProps> = (props) => {
    return (
        <button
            type="button"
            class={`${styles.listItem} sidebar-item ${props.isActive ? styles.isActive : ''}`}
            onClick={props.onClick}
            aria-label={props.example.name}
        >
            <DemoPreviewImage
                exampleId={props.example.id}
                name={props.example.name}
                isActive={props.isActive}
            />
        </button>
    );
};

export default DemoListItem;
