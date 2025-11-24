import { Accordion } from '@kobalte/core';
import type { Component } from 'solid-js';
import { GameSection, StagesSection, EntitiesSection } from './sections/all';
import './AccordionMenu.css';

/**
 * Accordion menu for debug UI with multiple panels.
 */
export const AccordionMenu: Component = () => (
  <Accordion.Root multiple class="zylem-debug-accordion">
    <Accordion.Item value="game-config" class="accordion-item">
      <Accordion.Header class="accordion-header">
        <Accordion.Trigger class="accordion-trigger zylem-exo-2">
          Game
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content scrollable-y scroll-thin">
        <GameSection />
      </Accordion.Content>
    </Accordion.Item>

    <Accordion.Item value="stage-config" class="accordion-item">
      <Accordion.Header class="accordion-header">
        <Accordion.Trigger class="accordion-trigger zylem-exo-2">
          Stages
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content scrollable-y scroll-thin">
        <StagesSection />
      </Accordion.Content>
    </Accordion.Item>

    <Accordion.Item value="entities" class="accordion-item">
      <Accordion.Header class="accordion-header">
        <Accordion.Trigger class="accordion-trigger zylem-exo-2">
          Entities
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content scrollable-y scroll-thin">
        <EntitiesSection />
      </Accordion.Content>
    </Accordion.Item>
  </Accordion.Root>
);
