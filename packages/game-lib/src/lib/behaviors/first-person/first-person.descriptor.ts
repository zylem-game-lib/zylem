/**
 * First Person Controller Behavior Descriptor
 *
 * Type-safe descriptor for the first-person controller behavior system.
 * Provides entity.use() API for FPS movement and camera control.
 */

import { Vector3, Euler } from 'three';
import type { IWorld } from 'bitecs';
import { defineBehavior } from '../behavior-descriptor';
import type { BehaviorSystem } from '../behavior-system';
import type { FirstPersonPerspective } from '../../camera/perspectives/first-person-perspective';
import {
	FirstPersonControllerBehavior,
	type FirstPersonEntity,
	type ViewmodelConfig,
} from './first-person.behavior';
import { FirstPersonFSM, FirstPersonState } from './first-person-fsm';
import {
	createFirstPersonMovementComponent,
	createFirstPersonInputComponent,
	createFirstPersonStateComponent,
} from './components';

/**
 * First-person controller behavior options (typed for entity.use() autocomplete).
 */
export interface FirstPersonControllerOptions {
	/** Base walking speed (default: 8) */
	walkSpeed?: number;
	/** Sprint/run speed (default: 16) */
	runSpeed?: number;
	/** Look sensitivity multiplier (default: 2) */
	lookSensitivity?: number;
	/** Eye height offset above entity position (default: 1.7) */
	eyeHeight?: number;
	/** The FirstPersonPerspective to drive (from camera.getPerspective()) */
	perspective?: FirstPersonPerspective;
	/** Optional viewmodel (weapon/item) to position relative to the camera */
	viewmodel?: { entity: any; offset: Vector3; rotation?: Euler };
}

const defaultOptions: FirstPersonControllerOptions = {
	walkSpeed: 8,
	runSpeed: 16,
	lookSensitivity: 2,
	eyeHeight: 1.7,
};

/**
 * Adapter that wraps FirstPersonControllerBehavior as a BehaviorSystem.
 */
class FirstPersonControllerSystem implements BehaviorSystem {
	private behavior: FirstPersonControllerBehavior;

	constructor(private world: any) {
		this.behavior = new FirstPersonControllerBehavior(world);
	}

	update(ecs: IWorld, delta: number): void {
		if (!this.world?.collisionMap) return;

		for (const [, entity] of this.world.collisionMap) {
			const gameEntity = entity as any;

			if (typeof gameEntity.getBehaviorRefs !== 'function') continue;

			const refs = gameEntity.getBehaviorRefs();
			const fpsRef = refs.find((r: any) =>
				r.descriptor.key === Symbol.for('zylem:behavior:first-person-controller'),
			);

			if (!fpsRef) continue;

			const options = fpsRef.options as FirstPersonControllerOptions;

			// Initialize components (once)
			if (!gameEntity.firstPerson) {
				gameEntity.firstPerson = createFirstPersonMovementComponent(options);
			}

			if (!gameEntity.$fps) {
				gameEntity.$fps = createFirstPersonInputComponent();
			}

			if (!gameEntity.firstPersonState) {
				gameEntity.firstPersonState = createFirstPersonStateComponent();
			}

			// Wire up perspective (once)
			if (options.perspective && !this.behavior['perspectives'].has(gameEntity.uuid)) {
				this.behavior.setPerspective(gameEntity.uuid, options.perspective);
			}

			// Wire up viewmodel (once)
			if (options.viewmodel && !this.behavior['viewmodels'].has(gameEntity.uuid)) {
				this.behavior.setViewmodel(gameEntity.uuid, options.viewmodel as ViewmodelConfig);
			}

			// Create FSM lazily
			if (!fpsRef.fsm && gameEntity.$fps && gameEntity.firstPersonState) {
				fpsRef.fsm = new FirstPersonFSM({
					input: gameEntity.$fps,
					state: gameEntity.firstPersonState,
				});
			}

			// Update FSM
			if (fpsRef.fsm && gameEntity.$fps && gameEntity.firstPersonState) {
				fpsRef.fsm.update(gameEntity.$fps, gameEntity.firstPersonState);
			}
		}

		// Delegate movement + look to the behavior
		this.behavior.update(delta);
	}

	destroy(_ecs: IWorld): void {
		this.behavior.destroy();
	}
}

/**
 * FirstPersonController - typed descriptor for first-person movement and camera control.
 *
 * Provides complete first-person controller including:
 * - WASD movement relative to camera yaw
 * - Mouse look driving a FirstPersonPerspective
 * - Optional viewmodel positioning (weapon/item following camera)
 * - Walk/run state tracking via FSM
 *
 * @example
 * ```typescript
 * import { FirstPersonController, FirstPersonPerspective, createActor, createCamera, Perspectives } from "@zylem/game-lib";
 *
 * const fpsCamera = createCamera({ perspective: Perspectives.FirstPerson, ... });
 * const fps = fpsCamera.getPerspective<FirstPersonPerspective>();
 *
 * const player = createActor({ name: 'player', ... });
 * const controller = player.use(FirstPersonController, {
 *   perspective: fps,
 *   walkSpeed: 8,
 *   runSpeed: 16,
 *   lookSensitivity: 2,
 * });
 *
 * // In update loop - write input, behavior handles the rest
 * player.onUpdate(({ inputs }) => {
 *   player.$fps.moveX = inputs.p1.axes.Horizontal.value;
 *   player.$fps.moveZ = inputs.p1.axes.Vertical.value;
 *   player.$fps.lookX = inputs.p1.axes.SecondaryHorizontal.value;
 *   player.$fps.lookY = inputs.p1.axes.SecondaryVertical.value;
 *   player.$fps.sprint = inputs.p1.shoulders.LTrigger.held > 0;
 * });
 * ```
 */
export const FirstPersonController = defineBehavior<
	FirstPersonControllerOptions,
	{
		getState: () => FirstPersonState;
		getYaw: () => number;
		getPitch: () => number;
		attachViewmodel: (entity: any, offset: Vector3) => void;
	},
	FirstPersonEntity
>({
	name: 'first-person-controller',
	defaultOptions,
	systemFactory: (ctx) => new FirstPersonControllerSystem(ctx.world),
	createHandle: (ref) => ({
		getState: () => ref.fsm?.getState() ?? FirstPersonState.Idle,
		getYaw: () => ref.fsm?.getYaw() ?? 0,
		getPitch: () => ref.fsm?.getPitch() ?? 0,
		attachViewmodel: (entity: any, offset: Vector3) => {
			if (ref.options) {
				ref.options.viewmodel = { entity, offset };
			}
		},
	}),
});
