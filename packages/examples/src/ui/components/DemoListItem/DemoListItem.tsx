import { Component, createEffect } from 'solid-js';
import { ExampleConfig } from '../../../examples-config';
import DemoPreviewImage from '../DemoPreviewImage/DemoPreviewImage';
import styles from './DemoListItem.module.css';

interface DemoListItemProps {
  example: ExampleConfig;
  isActive: boolean;
  onClick: () => void;
}

const DemoListItem: Component<DemoListItemProps> = (props) => {
  let buttonEl: HTMLButtonElement | undefined;

  createEffect(() => {
    if (props.isActive && buttonEl) {
      buttonEl.scrollIntoView({ block: 'start' });
    }
  });

  return (
    <button
      ref={(el) => (buttonEl = el)}
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
