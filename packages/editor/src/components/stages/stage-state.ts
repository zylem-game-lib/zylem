/**
 * Stage state for the stages section.
 * Manages stage configuration and entity list.
 */

import { proxy } from 'valtio';
import { editorEvents } from '../events';
import { zylemEventBus, type StateDispatchPayload, type EntityConfigPayload } from '@zylem/game-lib';
import type { BaseEntityInterface, StageStateInterface } from '../../types';

export const stageState = proxy<StageStateInterface>({
    config: null,
    backgroundColor: null,
    backgroundImage: null,
    inputs: {
        p1: ['gamepad-1', 'keyboard-1'],
        p2: ['gamepad-2', 'keyboard-2'],
    },
    variables: {},
    gravity: { x: 0, y: 0, z: 0 },
    entities: [],
});

/**
 * Convert stage state to a human-readable string for debugging.
 */
export const stageStateToString = (state: StageStateInterface): string => {
    let str = '\n';
    for (const key in state) {
        const value = state[key as keyof StageStateInterface];
        str += `${key}:\n`;
        if (key === 'entities') {
            for (const entity of state.entities) {
                str += `  ${entity.uuid}: ${entity.name}\n`;
            }
            continue;
        }
        if (typeof value === 'object' && value !== null) {
            for (const subKey in value as Record<string, any>) {
                const subValue = (value as Record<string, any>)[subKey];
                if (subValue) {
                    str += `  ${subKey}: ${subValue}\n`;
                }
            }
        } else if (typeof value === 'string') {
            str += `  ${key}: ${value}\n`;
        }
    }
    return str;
};

// Subscribe to external events (legacy local events)
editorEvents.on<Partial<StageStateInterface>>('stage', (event) => {
    const payload = event.payload;
    if (payload.config !== undefined) stageState.config = payload.config;
    if (payload.backgroundColor !== undefined) stageState.backgroundColor = payload.backgroundColor;
    if (payload.backgroundImage !== undefined) stageState.backgroundImage = payload.backgroundImage;
    if (payload.inputs !== undefined) stageState.inputs = payload.inputs;
    if (payload.variables !== undefined) stageState.variables = payload.variables;
    if (payload.gravity !== undefined) stageState.gravity = payload.gravity;
    if (payload.entities !== undefined) stageState.entities = payload.entities;
});

// Subscribe to entity-specific updates
editorEvents.on<BaseEntityInterface[]>('entities', (event) => {
    stageState.entities = event.payload;
});

// Subscribe to state dispatch events from game-lib via zylemEventBus
zylemEventBus.on('state:dispatch', (payload: StateDispatchPayload) => {
    // Update stage config if present
    if (payload.stageConfig) {
        stageState.config = {
            id: payload.stageConfig.id,
            backgroundColor: payload.stageConfig.backgroundColor,
            backgroundImage: payload.stageConfig.backgroundImage,
            gravity: payload.stageConfig.gravity,
            inputs: payload.stageConfig.inputs,
            variables: payload.stageConfig.variables,
        };
    }

    // Update entities if present
    if (payload.entities) {
        stageState.entities = payload.entities.map((e: EntityConfigPayload) => ({
            uuid: e.uuid,
            name: e.name,
            type: e.type,
            position: e.position,
            rotation: e.rotation,
            scale: e.scale,
        }));
    }
});

