import { Button, Tooltip } from '@kobalte/core';
import Bug from 'lucide-solid/icons/bug';
import MousePointer from 'lucide-solid/icons/mouse-pointer';
import Pause from 'lucide-solid/icons/pause';
import Play from 'lucide-solid/icons/play';
import Plus from 'lucide-solid/icons/plus';
import Trash2 from 'lucide-solid/icons/trash-2';
import { createSignal, type JSX } from 'solid-js';

interface ToolbarButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  children: JSX.Element;
}

/** Mirror of the editor's ToolbarButton (Kobalte Tooltip + Button.Root). */
function ToolbarButton(props: ToolbarButtonProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger>
        <Button.Root
          aria-label={props.label}
          onClick={props.onClick}
          class={`zylem-toolbar-btn zylem-button ${props.isSelected ? 'selected' : ''}`}
        >
          {props.children}
        </Button.Root>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content class="zylem-tooltip zylem-exo-2">{props.label}</Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

/** Interactive replica of the editor's toolbar: Debug, Delete, Add, Select, Play/Pause. */
export function ToolbarDemo() {
  const [debug, setDebug] = createSignal(false);
  const [mode, setMode] = createSignal<'add' | 'select' | null>('select');
  const [paused, setPaused] = createSignal(false);

  return (
    <div class="zylem-toolbar">
      <ToolbarButton label="Debug" isSelected={debug()} onClick={() => setDebug(!debug())}>
        <Bug class="zylem-icon" />
      </ToolbarButton>
      <ToolbarButton label="Delete" isSelected={false} onClick={() => {}}>
        <Trash2 class="zylem-icon" />
      </ToolbarButton>
      <ToolbarButton
        label="Add"
        isSelected={mode() === 'add'}
        onClick={() => setMode(mode() === 'add' ? null : 'add')}
      >
        <Plus class="zylem-icon" />
      </ToolbarButton>
      <ToolbarButton
        label="Select"
        isSelected={mode() === 'select'}
        onClick={() => setMode(mode() === 'select' ? null : 'select')}
      >
        <MousePointer class="zylem-icon" />
      </ToolbarButton>
      <ToolbarButton
        label={paused() ? 'Play' : 'Pause'}
        isSelected={paused()}
        onClick={() => setPaused(!paused())}
      >
        {paused() ? <Play class="zylem-icon" /> : <Pause class="zylem-icon" />}
      </ToolbarButton>
    </div>
  );
}
