import { Button, Tooltip } from '@kobalte/core';
import X from 'lucide-solid/icons/x';
import MousePointer from 'lucide-solid/icons/mouse-pointer';
import Plus from 'lucide-solid/icons/plus';
import Trash2 from 'lucide-solid/icons/trash-2';
import type { Component } from 'solid-js';
import './Toolbar.css';

/**
 * Toolbar for debug menu with interactive Lucide icon buttons.
 */
export const Toolbar: Component<{ onClose?: () => void }> = (props) => {
  return (
    <div class="zylem-debug-toolbar">
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Close"
            onClick={props.onClose}
            class="zylem-debug-toolbar-btn"
          >
            <X class="zylem-debug-icon" />
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-debug-tooltip zylem-exo-2">
            Close
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Select"
            onClick={() => {}}
            class="zylem-debug-toolbar-btn"
          >
            <MousePointer class="zylem-debug-icon" />
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-debug-tooltip zylem-exo-2">
            Select
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Add"
            onClick={() => {}}
            class="zylem-debug-toolbar-btn"
          >
            <Plus class="zylem-debug-icon" />
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-debug-tooltip zylem-exo-2">
            Add
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Delete"
            onClick={() => {}}
            class="zylem-debug-toolbar-btn"
          >
            <Trash2 class="zylem-debug-icon" />
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-debug-tooltip zylem-exo-2">
            Delete
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  );
};
