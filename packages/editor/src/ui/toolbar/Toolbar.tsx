import { Button, Tooltip } from '@kobalte/core';
import X from 'lucide-solid/icons/x';
import MousePointer from 'lucide-solid/icons/mouse-pointer';
import Plus from 'lucide-solid/icons/plus';
import Trash2 from 'lucide-solid/icons/trash-2';
import Pause from 'lucide-solid/icons/pause';
import Play from 'lucide-solid/icons/play';
import type { Component } from 'solid-js';
import { setDebugTool, setPaused, debugState, debugStore } from '../../store';

const togglePause = () => {
  setPaused(!debugState.paused);
};

export const Toolbar: Component<{ onClose?: (() => void) | undefined }> = (props) => {
  return (
    <div class="zylem-toolbar">
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Close"
            onClick={() => {
              setDebugTool('none');
              props.onClose?.();
            }}
            class="zylem-toolbar-btn zylem-button"
          >
            <X class="zylem-icon" />
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-tooltip zylem-exo-2">
            Close
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Delete"
            onClick={() =>
              setDebugTool(debugStore.tool === 'delete' ? 'none' : 'delete')
            }
            class={`zylem-toolbar-btn zylem-button ${
              debugStore.tool === 'delete' ? 'selected' : ''
            }`}
          >
            <Trash2 class="zylem-icon" />
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-tooltip zylem-exo-2">
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
                debugStore.tool === 'translate' ? 'none' : 'translate',
              )
            }
            class={`zylem-toolbar-btn zylem-button ${
              debugStore.tool === 'translate' ? 'selected' : ''
            }`}
          >
            <Plus class="zylem-icon" />
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-tooltip zylem-exo-2">
            Add
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Select"
            onClick={() =>
              setDebugTool(debugStore.tool === 'select' ? 'none' : 'select')
            }
            class={`zylem-toolbar-btn zylem-button ${
              debugStore.tool === 'select' ? 'selected' : ''
            }`}
          >
            <MousePointer class="zylem-icon" />
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-tooltip zylem-exo-2">
            Select
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label={debugStore.paused ? 'Play' : 'Pause'}
            onClick={() => togglePause()}
            class={`zylem-toolbar-btn zylem-button ${
              debugStore.paused ? 'selected' : ''
            }`}
          >
            {debugStore.paused ? (
              <Play class="zylem-icon" />
            ) : (
              <Pause class="zylem-icon" />
            )}
          </Button.Root>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content class="zylem-tooltip zylem-exo-2">
            {debugStore.paused ? 'Play' : 'Pause'}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </div>
  );
};
