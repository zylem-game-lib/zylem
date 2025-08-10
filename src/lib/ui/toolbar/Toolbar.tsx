import { Button, Tooltip } from '@kobalte/core';
import X from 'lucide-solid/icons/x';
import MousePointer from 'lucide-solid/icons/mouse-pointer';
import Plus from 'lucide-solid/icons/plus';
import Trash2 from 'lucide-solid/icons/trash-2';
import Pause from 'lucide-solid/icons/pause';
import Play from 'lucide-solid/icons/play';
import type { Component } from 'solid-js';
import './Toolbar.css';
import { DebugTools, setDebugTool, togglePause } from '../../debug/debug-state';
import { debugStore } from '../../debug/debug-store';

export const Toolbar: Component<{ onClose?: () => void }> = (props) => {
  return (
    <div class="zylem-debug-toolbar">
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Close"
            onClick={() => {
              setDebugTool(DebugTools.NONE);
              props.onClose?.();
            }}
            class="zylem-debug-toolbar-btn zylem-debug-button"
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
            aria-label="Delete"
            onClick={() =>
              setDebugTool(
                debugStore.tool === DebugTools.DELETE
                  ? DebugTools.NONE
                  : DebugTools.DELETE,
              )
            }
            class={`zylem-debug-toolbar-btn zylem-debug-button ${
              debugStore.tool === DebugTools.DELETE ? 'selected' : ''
            }`}
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

      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Add"
            onClick={() =>
              setDebugTool(
                debugStore.tool === DebugTools.ADD
                  ? DebugTools.NONE
                  : DebugTools.ADD,
              )
            }
            class={`zylem-debug-toolbar-btn zylem-debug-button ${
              debugStore.tool === DebugTools.ADD ? 'selected' : ''
            }`}
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
            aria-label="Select"
            onClick={() =>
              setDebugTool(
                debugStore.tool === DebugTools.SELECT
                  ? DebugTools.NONE
                  : DebugTools.SELECT,
              )
            }
            class={`zylem-debug-toolbar-btn zylem-debug-button ${
              debugStore.tool === DebugTools.SELECT ? 'selected' : ''
            }`}
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
            aria-label={debugStore.paused ? 'Play' : 'Pause'}
            onClick={() => togglePause()}
            class={`zylem-debug-toolbar-btn zylem-debug-button ${
              debugStore.paused ? 'selected' : ''
            }`}
          >
            {debugStore.paused ? (
              <Play class="zylem-debug-icon" />
            ) : (
              <Pause class="zylem-debug-icon" />
            )}
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-debug-tooltip zylem-exo-2">
            {debugStore.paused ? 'Play' : 'Pause'}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  );
};
