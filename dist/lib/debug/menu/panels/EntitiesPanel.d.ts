import { Component } from 'solid-js';
import './EntitiesPanel.css';
import { BaseEntityInterface } from '~/lib/types';
interface EntityRowProps {
    entity: Partial<BaseEntityInterface>;
    index: number;
}
export declare const EntityRow: Component<EntityRowProps>;
export declare const EntitiesPanel: Component;
export {};
