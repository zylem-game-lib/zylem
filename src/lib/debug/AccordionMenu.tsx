import { Accordion } from '@kobalte/core';
import type { Component } from 'solid-js';
import {
  DebugOptionsPanel,
  GameConfigPanel,
  StageConfigPanel,
  EntitiesPanel,
  GlobalStatePanel,
} from './panels';
import './Menu.css';

/**
 * Accordion menu for debug UI with multiple panels.
 */
export const AccordionMenu: Component = () => (
  <Accordion.Root multiple class="zylem-debug-accordion">
    <Accordion.Item value="debug-options" class="accordion-item">
      <Accordion.Header>
        <Accordion.Trigger class="accordion-trigger">
          Debug options
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content">
        <DebugOptionsPanel />
      </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="game-config" class="accordion-item">
      <Accordion.Header>
        <Accordion.Trigger class="accordion-trigger">
          Game Configuration
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content">
        <GameConfigPanel />
      </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="stage-config" class="accordion-item">
      <Accordion.Header>
        <Accordion.Trigger class="accordion-trigger">
          Stage Configuration
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content">
        <StageConfigPanel />
      </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="entities" class="accordion-item">
      <Accordion.Header>
        <Accordion.Trigger class="accordion-trigger">
          Entities
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content">
        <EntitiesPanel />
      </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="global-state" class="accordion-item">
      <Accordion.Header>
        <Accordion.Trigger class="accordion-trigger">
          Global State
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content class="accordion-content">
        <GlobalStatePanel />
      </Accordion.Content>
    </Accordion.Item>
  </Accordion.Root>
);
