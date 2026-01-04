import { S as StageStateInterface } from './stage-types-1A6X01lU.js';
export { a as StageOptions, c as createStage } from './stage-types-1A6X01lU.js';
export { S as StageBlueprint, e as entitySpawner } from './blueprints-ClvejPPc.js';
import './entity-BtSVUHY-.js';
import 'three';
import '@dimforge/rapier3d-compat';
import 'bitecs';
import 'mitt';
import './entities-BR2vDiRh.js';
import './entity-Bq_eNEDI.js';
import './camera-CpbDr4-V.js';
import 'three/examples/jsm/postprocessing/EffectComposer.js';
import '@sinclair/typebox';

/**
 * Event name for stage state changes.
 * Dispatched when the stage state proxy is updated.
 */
declare const STAGE_STATE_CHANGE = "STAGE_STATE_CHANGE";
/**
 * Event detail payload for STAGE_STATE_CHANGE events.
 */
interface StageStateChangeEvent {
    entities: StageStateInterface['entities'];
    variables: StageStateInterface['variables'];
}
/**
 * Initialize the stage state dispatcher.
 * Subscribes to stageState changes and dispatches STAGE_STATE_CHANGE events to the window.
 *
 * @returns Unsubscribe function to stop dispatching events.
 *
 * @example
 * // Start dispatching stage state changes
 * const unsubscribe = initStageStateDispatcher();
 *
 * // Later, stop dispatching
 * unsubscribe();
 */
declare function initStageStateDispatcher(): () => void;
/**
 * Manually dispatch the current stage state.
 * Useful for initial sync when a listener is added.
 */
declare function dispatchStageState(): void;

export { STAGE_STATE_CHANGE, type StageStateChangeEvent, dispatchStageState, initStageStateDispatcher };
