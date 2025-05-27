import { Button, Tooltip } from '@kobalte/core';
import { X, MousePointer, Plus, Trash2 } from 'lucide-solid';
import type { Component } from 'solid-js';
import { DEBUG_COLORS, DEBUG_SIZES } from './constants';
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
            <X color={DEBUG_COLORS.primary} size={DEBUG_SIZES.icon} />
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-debug-tooltip">Close</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Select"
            onClick={() => {}}
            class="zylem-debug-toolbar-btn"
          >
            <MousePointer
              color={DEBUG_COLORS.primary}
              size={DEBUG_SIZES.icon}
            />
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-debug-tooltip">Select</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Add"
            onClick={() => {}}
            class="zylem-debug-toolbar-btn"
          >
            <Plus color={DEBUG_COLORS.primary} size={DEBUG_SIZES.icon} />
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-debug-tooltip">Add</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Delete"
            onClick={() => {}}
            class="zylem-debug-toolbar-btn"
          >
            <Trash2 color={DEBUG_COLORS.primary} size={DEBUG_SIZES.icon} />
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-debug-tooltip">Delete</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  );
};
