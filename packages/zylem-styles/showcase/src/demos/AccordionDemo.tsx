import { Accordion } from '@kobalte/core';
import { For } from 'solid-js';
import type { JSX } from 'solid-js';
import { ConsoleDemo } from './ConsoleDemo';
import { EntitiesPanelContent, GamePanelContent, StagePanelContent } from './panels';

const PANELS: Array<{ id: string; title: string; content: () => JSX.Element }> = [
  { id: 'game-config', title: 'Game', content: () => <GamePanelContent /> },
  { id: 'stage-config', title: 'Stage', content: () => <StagePanelContent /> },
  { id: 'entities', title: 'Entities', content: () => <EntitiesPanelContent /> },
  { id: 'console', title: 'Console', content: () => <ConsoleDemo /> },
];

/**
 * Mirror of the editor's AccordionMenu: Kobalte multiple-accordion with the
 * same panel set (Game, Stage, Entities, Console) and class structure.
 */
export function AccordionDemo(props: { defaultExpanded?: string[] }) {
  return (
    <Accordion.Root multiple class="zylem-accordion" defaultValue={props.defaultExpanded ?? ['console']}>
      <For each={PANELS}>
        {(panel) => (
          <Accordion.Item value={panel.id} class="accordion-item">
            <Accordion.Header class="accordion-header">
              <Accordion.Trigger class="accordion-trigger zylem-exo-2">{panel.title}</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content class="accordion-content scrollable-y scroll-thin">
              {panel.content()}
            </Accordion.Content>
          </Accordion.Item>
        )}
      </For>
    </Accordion.Root>
  );
}
