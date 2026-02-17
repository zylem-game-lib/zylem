/**
 * First Person Controller Behavior System
 *
 * Handles first-person camera control and movement:
 * - Reads input component for WASD movement and mouse look deltas
 * - Drives a FirstPersonPerspective (yaw/pitch accumulation)
 * - Computes position movement relative to current yaw
 * - Positions an optional viewmodel entity relative to the camera
 */

import { Vector3, Quaternion, Euler } from 'three';
import type { FirstPersonPerspective } from '../../camera/perspectives/first-person-perspective';
import type {
	FirstPersonMovementComponent,
	FirstPersonInputComponent,
	FirstPersonStateComponent,
} from './components';

/**
 * Viewmodel configuration for an entity that follows the camera.
 */
export interface ViewmodelConfig {
	/** The entity whose visual group should be positioned relative to the camera. */
	entity: any;
	/** Offset from the eye position in camera-local space (right, down, forward). */
	offset: Vector3;
	/** Additional rotation applied to the viewmodel in local space (Euler angles in radians). */
	rotation?: Euler;
}

/**
 * Entity interface for first-person controller.
 * Entities with this behavior have these components attached.
 */
export interface FirstPersonEntity {
	uuid: string;
	firstPerson: FirstPersonMovementComponent;
	$fps: FirstPersonInputComponent;
	firstPersonState: FirstPersonStateComponent;
}

// Reusable temporaries (avoid per-frame allocations)
const _forward = new Vector3();
const _right = new Vector3();
const _up = new Vector3(0, 1, 0);
const _viewmodelQuat = new Quaternion();
const _viewmodelLocalQuat = new Quaternion();
const _viewmodelEuler = new Euler();
const _offset = new Vector3();

/**
 * First Person Controller Behavior
 *
 * Core movement + look system for first-person cameras.
 * Reads from entity.$fps input component and drives a FirstPersonPerspective.
 */
export class FirstPersonControllerBehavior {
	private world: any;
	private perspectives = new Map<string, FirstPersonPerspective>();
	private viewmodels = new Map<string, ViewmodelConfig>();

	constructor(world: any) {
		this.world = world;
	}

	/**
	 * Associate a FirstPersonPerspective with an entity (by uuid).
	 * Called once by the descriptor system when the behavior is initialized.
	 */
	setPerspective(entityUuid: string, perspective: FirstPersonPerspective): void {
		this.perspectives.set(entityUuid, perspective);
	}

	/**
	 * Attach a viewmodel (weapon/item) to an entity.
	 * The viewmodel entity's group will be positioned relative to the camera each frame.
	 */
	setViewmodel(entityUuid: string, config: ViewmodelConfig): void {
		this.viewmodels.set(entityUuid, config);
	}

	/**
	 * Update all first-person entities.
	 */
	update(delta: number): void {
		if (!this.world?.collisionMap) return;

		for (const [, entity] of this.world.collisionMap) {
			const fpEntity = entity as any;

			if (!fpEntity.firstPerson || !fpEntity.$fps || !fpEntity.firstPersonState) {
				continue;
			}

			const input: FirstPersonInputComponent = fpEntity.$fps;
			const movement: FirstPersonMovementComponent = fpEntity.firstPerson;
			const state: FirstPersonStateComponent = fpEntity.firstPersonState;
			const perspective = this.perspectives.get(fpEntity.uuid);

			// 1. Apply look
			if (perspective) {
				perspective.look(
					-input.lookX * movement.lookSensitivity,
					-input.lookY * movement.lookSensitivity,
				);

				// Sync state with perspective
				state.yaw = perspective.yaw;
				state.pitch = perspective.pitch;
			}

			// 2. Compute movement
			const speed = input.sprint ? movement.runSpeed : movement.walkSpeed;
			state.currentSpeed = speed;

			const hasMovement = Math.abs(input.moveX) > 0.1 || Math.abs(input.moveZ) > 0.1;

			if (hasMovement && perspective?.initialPosition) {
				_forward.set(0, 0, -1).applyAxisAngle(_up, state.yaw);
				_right.set(1, 0, 0).applyAxisAngle(_up, state.yaw);

				perspective.initialPosition.addScaledVector(_forward, -input.moveZ * speed * delta);
				perspective.initialPosition.addScaledVector(_right, input.moveX * speed * delta);
			}

			// 3. Position viewmodel
			const vm = this.viewmodels.get(fpEntity.uuid);
			if (vm && perspective?.initialPosition) {
				this.positionViewmodel(vm, perspective, state);
			}
		}
	}

	/**
	 * Position a viewmodel entity relative to the camera's eye position and rotation.
	 *
	 * The physics transform system overwrites group.position from the rigid body
	 * each frame, so we must also move the body to keep them in sync.
	 */
	private positionViewmodel(
		vm: ViewmodelConfig,
		perspective: FirstPersonPerspective,
		state: FirstPersonStateComponent,
	): void {
		const eyePos = perspective.initialPosition;
		if (!eyePos) return;

		// Build camera rotation quaternion
		_viewmodelQuat.setFromEuler(
			_viewmodelEuler.set(state.pitch, state.yaw, 0, 'YXZ'),
		);

		// Compose with the viewmodel's local rotation (model orientation fix)
		if (vm.rotation) {
			_viewmodelLocalQuat.setFromEuler(vm.rotation);
			_viewmodelQuat.multiply(_viewmodelLocalQuat);
		}

		// Transform the local offset into world space (use camera rotation, not the composed one)
		_offset.copy(vm.offset).applyQuaternion(_viewmodelQuat);

		const wx = eyePos.x + _offset.x;
		const wy = eyePos.y + _offset.y;
		const wz = eyePos.z + _offset.z;

		const entity = vm.entity;

		// Move the physics body so the transform system stays in sync
		if (entity?.body) {
			entity.body.setTranslation({ x: wx, y: wy, z: wz }, true);
			entity.body.setRotation(
				{ x: _viewmodelQuat.x, y: _viewmodelQuat.y, z: _viewmodelQuat.z, w: _viewmodelQuat.w },
				true,
			);
		}

		// Also set the group directly for immediate visual update
		if (entity?.group) {
			entity.group.position.set(wx, wy, wz);
			entity.group.quaternion.copy(_viewmodelQuat);
		}
	}

	/** Cleanup */
	destroy(): void {
		this.perspectives.clear();
		this.viewmodels.clear();
	}
}
