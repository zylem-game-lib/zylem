import { Accordion } from '@kobalte/core';
import { For, type Component } from 'solid-js';
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

  return (
    <Accordion.Root
      multiple
      class="zylem-accordion"
      value={debugStore.openSections}
      onChange={setOpenSections}
    >
      <For each={getDockedPanels()}>
        {(panel) => (
          <DraggableAccordionItem value={panel.id} title={panel.title}>
            {renderPanelContent(panel.id)}
          </DraggableAccordionItem>
        )}
      </For>
    </Accordion.Root>
  );
};
