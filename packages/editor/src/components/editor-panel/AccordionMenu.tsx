import { Accordion } from '@kobalte/core';
import { Index, Show, type Component } from 'solid-js';
import { debugStore, setOpenSections } from '../editor-store';
import { PANEL_CONFIGS, renderPanelContent } from './panel-config';
import { DraggableAccordionItem } from './DraggableAccordionItem';

/**
 * Accordion menu for debug UI with multiple panels.
 * Panels can be dragged out to become independent floating windows.
 * Console is open by default, and open sections expand to fill available space.
 */
export const AccordionMenu: Component = () => {
  // Get panels that are not currently detached, in order
  const getDockedPanels = () => {
    const detachedIds = Object.keys(debugStore.detachedPanels);
    return debugStore.panelOrder
      .filter((id) => !detachedIds.includes(id))
      .map((id) => PANEL_CONFIGS.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);
  };

  // Check if we're in a drag-to-reattach operation
  const isDraggingToReattach = () => debugStore.draggingPanelId !== null;
  const dropTargetIndex = () => debugStore.dropTargetIndex;

  return (
    <Accordion.Root
      multiple
      class="zylem-accordion"
      value={debugStore.openSections}
      onChange={setOpenSections}
    >
      {/* Drop indicator at the top */}
      <Show when={isDraggingToReattach() && dropTargetIndex() === 0}>
        <div class="accordion-drop-indicator" />
      </Show>

      <Index each={getDockedPanels()}>
        {(panel, index) => (
          <>
            <DraggableAccordionItem value={panel().id} title={panel().title}>
              {renderPanelContent(panel().id)}
            </DraggableAccordionItem>
            {/* Drop indicator after each item */}
            <Show when={isDraggingToReattach() && dropTargetIndex() === index + 1}>
              <div class="accordion-drop-indicator" />
            </Show>
          </>
        )}
      </Index>
    </Accordion.Root>
  );
};
