import { Accordion } from '@kobalte/core';
import type { Component } from 'solid-js';
import {
  DebugOptionsPanel,
  GameConfigPanel,
  StageConfigPanel,
  EntitiesPanel,
  GlobalStatePanel,
} from './panels';
import './AccordionMenu.css';

/**
 * Accordion menu for debug UI with multiple panels.
 */
export const AccordionMenu: Component = () => (
  <Accordion.Root multiple class="zylem-debug-accordion">
    <Accordion.Item value="debug-options" class="accordion-item">
      <Accordion.Header class="accordion-header">
        <Accordion.Trigger class="accordion-trigger zylem-exo-2">
          Debug options
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content scrollable-y scroll-thin">
        <DebugOptionsPanel />
      </Accordion.Content>
    </Accordion.Item>

    <Accordion.Item value="game-config" class="accordion-item">
      <Accordion.Header class="accordion-header">
        <Accordion.Trigger class="accordion-trigger zylem-exo-2">
          Game Configuration
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content scrollable-y scroll-thin">
        <GameConfigPanel />
      </Accordion.Content>
    </Accordion.Item>

    <Accordion.Item value="stage-config" class="accordion-item">
      <Accordion.Header class="accordion-header">
        <Accordion.Trigger class="accordion-trigger zylem-exo-2">
          Stage Configuration
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content scrollable-y scroll-thin">
        <StageConfigPanel />
      </Accordion.Content>
    </Accordion.Item>

    <Accordion.Item value="entities" class="accordion-item">
      <Accordion.Header class="accordion-header">
        <Accordion.Trigger class="accordion-trigger zylem-exo-2">
          Entities
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content scrollable-y scroll-thin">
        <EntitiesPanel />
      </Accordion.Content>
    </Accordion.Item>

    <Accordion.Item value="global-state" class="accordion-item">
      <Accordion.Header class="accordion-header">
        <Accordion.Trigger class="accordion-trigger zylem-exo-2">
          Global State
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content scrollable-y scroll-thin">
        <GlobalStatePanel />
      </Accordion.Content>
    </Accordion.Item>
  </Accordion.Root>
);
