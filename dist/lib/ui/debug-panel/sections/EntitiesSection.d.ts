import { Component } from 'solid-js';
import './EntitiesSection.css';
import { BaseEntityInterface } from '~/lib/types';
interface EntityRowProps {
    entity: Partial<BaseEntityInterface>;
    index: number;
}
export declare const EntityRow: Component<EntityRowProps>;
export declare const EntitiesSection: Component;
export {};
