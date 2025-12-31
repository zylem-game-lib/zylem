/**
 * Panel configuration for the accordion menu.
 * Defines all available panels and their components.
 */

import type { Component, JSX } from 'solid-js';
import { GameSection } from '../game/GameSection';
import { StageSection } from '../stages/StageSection';
import { EntitiesSection } from '../entities/EntitiesSection';
import { Console } from '../console/Console';

export interface PanelConfig {
    id: string;
    title: string;
    component: Component;
}

/**
 * All available panels in the editor.
 * Order here is the default order.
 */
export const PANEL_CONFIGS: PanelConfig[] = [
    { id: 'game-config', title: 'Game', component: GameSection },
    { id: 'stage-config', title: 'Stage', component: StageSection },
    { id: 'entities', title: 'Entities', component: EntitiesSection },
    { id: 'console', title: 'Console', component: Console },
];

/**
 * Get panel config by ID.
 */
export const getPanelConfig = (id: string): PanelConfig | undefined => {
    return PANEL_CONFIGS.find((p) => p.id === id);
};

/**
 * Get panel title by ID.
 */
export const getPanelTitle = (id: string): string => {
    return getPanelConfig(id)?.title ?? id;
};

/**
 * Render a panel's content by ID.
 */
export const renderPanelContent = (id: string): JSX.Element | null => {
    const config = getPanelConfig(id);
    if (!config) return null;
    const PanelComponent = config.component;
    return <PanelComponent />;
};
