/**
 * MovementSequence2DBehavior
 *
 * Sequences 2D movements over time. Each step defines velocity and duration.
 * The behavior computes movement; the consumer applies it.
 */

import type { IWorld } from 'bitecs';
import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorSystem } from '../behavior-system';
import {
	MovementSequence2DFSM,
	type MovementSequence2DStep,
	type MovementSequence2DMovement,
	type MovementSequence2DCurrentStep,
	type MovementSequence2DProgress,
} from './movement-sequence-2d-fsm';

// ─────────────────────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────────────────────

export interface MovementSequence2DOptions {
	/**
	 * The sequence of movement steps.
	 * Each step has name, moveX, moveY, and timeInSeconds.
	 */
	sequence: MovementSequence2DStep[];

	/**
	 * Whether to loop when the sequence ends.
	 * Default: true
	 */
	loop: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle methods provided by MovementSequence2DBehavior
 */
export interface MovementSequence2DHandle {
	/**
	 * Get the current movement velocity.
	 * Returns { moveX: 0, moveY: 0 } if sequence is empty or completed.
	 */
	getMovement(): MovementSequence2DMovement;

	/**
	 * Get the current step info.
	 * Returns null if sequence is empty.
	 */
	getCurrentStep(): MovementSequence2DCurrentStep | null;

	/**
	 * Get sequence progress.
	 */
	getProgress(): MovementSequence2DProgress;

	/**
	 * Pause the sequence. Movement values remain but time doesn't advance.
	 */
	pause(): void;

	/**
	 * Resume a paused sequence.
	 */
	resume(): void;

	/**
	 * Reset the sequence to the beginning.
	 */
	reset(): void;
}

const defaultOptions: MovementSequence2DOptions = {
	sequence: [],
	loop: true,
};

/**
 * Creates behavior-specific handle methods for MovementSequence2DBehavior.
 */
function createMovementSequence2DHandle(
	ref: BehaviorRef<MovementSequence2DOptions>
): MovementSequence2DHandle {
	return {
		getMovement: () => {
			const fsm = ref.fsm as MovementSequence2DFSM | undefined;
			return fsm?.getMovement() ?? { moveX: 0, moveY: 0 };
		},
		getCurrentStep: () => {
			const fsm = ref.fsm as MovementSequence2DFSM | undefined;
			return fsm?.getCurrentStep() ?? null;
		},
		getProgress: () => {
			const fsm = ref.fsm as MovementSequence2DFSM | undefined;
			return fsm?.getProgress() ?? { stepIndex: 0, totalSteps: 0, stepTimeRemaining: 0, done: true };
		},
		pause: () => {
			const fsm = ref.fsm as MovementSequence2DFSM | undefined;
			fsm?.pause();
		},
		resume: () => {
			const fsm = ref.fsm as MovementSequence2DFSM | undefined;
			fsm?.resume();
		},
		reset: () => {
			const fsm = ref.fsm as MovementSequence2DFSM | undefined;
			fsm?.reset();
		},
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// System
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MovementSequence2DSystem
 *
 * Stage-level system that:
 * - Finds entities with this behavior attached
 * - Updates FSM with delta time each frame
 * - Consumers read getMovement() to get current velocity
 */
class MovementSequence2DSystem implements BehaviorSystem {
	constructor(private world: any) {}

	update(_ecs: IWorld, delta: number): void {
		if (!this.world?.collisionMap) return;

		for (const [, entity] of this.world.collisionMap) {
			const gameEntity = entity as any;

			if (typeof gameEntity.getBehaviorRefs !== 'function') continue;

			const refs = gameEntity.getBehaviorRefs();
			const sequenceRef = refs.find(
				(r: any) => r.descriptor.key === Symbol.for('zylem:behavior:movement-sequence-2d')
			);

			if (!sequenceRef) continue;

			const options = sequenceRef.options as MovementSequence2DOptions;

			// Create and init FSM lazily on first update
			if (!sequenceRef.fsm) {
				sequenceRef.fsm = new MovementSequence2DFSM();
				sequenceRef.fsm.init(options.sequence, options.loop);
			}

			// Update FSM - advances time and handles step transitions
			sequenceRef.fsm.update(delta);
		}
	}

	destroy(_ecs: IWorld): void {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Behavior Definition
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MovementSequence2DBehavior
 *
 * @example
 * ```ts
 * import { MovementSequence2DBehavior } from "@zylem/game-lib";
 *
 * const enemy = makeMoveable(createSprite({ ... }));
 * const sequence = enemy.use(MovementSequence2DBehavior, {
 *   sequence: [
 *     { name: 'right', moveX: 3, moveY: 0, timeInSeconds: 2 },
 *     { name: 'left', moveX: -3, moveY: 0, timeInSeconds: 2 },
 *   ],
 *   loop: true,
 * });
 *
 * enemy.onUpdate(({ me }) => {
 *   const { moveX, moveY } = sequence.getMovement();
 *   me.moveXY(moveX, moveY);
 * });
 * ```
 */
export const MovementSequence2DBehavior = defineBehavior({
	name: 'movement-sequence-2d',
	defaultOptions,
	systemFactory: (ctx) => new MovementSequence2DSystem(ctx.world),
	createHandle: createMovementSequence2DHandle,
});
