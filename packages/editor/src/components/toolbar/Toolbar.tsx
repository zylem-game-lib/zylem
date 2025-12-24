import { Button, Tooltip } from '@kobalte/core';
import MousePointer from 'lucide-solid/icons/mouse-pointer';
import Plus from 'lucide-solid/icons/plus';
import Trash2 from 'lucide-solid/icons/trash-2';
import Pause from 'lucide-solid/icons/pause';
import Play from 'lucide-solid/icons/play';
import type { Component } from 'solid-js';
import { setDebugTool, setPaused, debugState, debugStore } from '..';

const togglePause = () => {
  setPaused(!debugState.paused);
};

const toolbarBtnClass = (isSelected: boolean) => {
  return `zylem-toolbar-btn zylem-button ${isSelected ? 'selected' : ''}`;
}

export const Toolbar: Component = () => {
  return (
    <div class="zylem-toolbar">

      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button.Root
            aria-label="Delete"
            onClick={() =>
              setDebugTool(debugStore.tool === 'delete' ? 'none' : 'delete')
            }
            class={toolbarBtnClass(debugStore.tool === 'delete')}
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
            class={toolbarBtnClass(debugStore.tool === 'translate')}
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
            class={toolbarBtnClass(debugStore.tool === 'select')}
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
            class={toolbarBtnClass(debugStore.paused)}
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
