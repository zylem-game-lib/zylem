/**
 * `SimulationBody` — game-lib's Rapier-`RigidBody`-shaped facade over a
 * `@zylem/behaviors` {@link Simulation} entity.
 *
 * Every physics entity spawned into {@link ZylemWorld} gets one of these as
 * `entity.body`. It routes reads/writes through the Simulation's handle-based
 * API and implements `PhysicsRenderPoseProvider` so `syncRenderPoses` can
 * interpolate between the previous and current fixed-step poses.
 */
import { Quaternion } from 'three';

import type {
	EntityHandle,
	Simulation,
	StageBodyInfo,
	StagePose,
	StageRenderSlot,
} from '@zylem/behaviors/core';
import {
	clampInterpolationAlpha,
	clonePhysicsPose,
	interpolatePhysicsPose,
	type PhysicsPose,
	type PhysicsPoseHistory,
	type PhysicsQuaternion,
	type PhysicsRenderPoseProvider,
	type PhysicsVector3,
} from '../physics/physics-pose';

/** Shared step counter owned by the world; lets bodies know a step has run. */
export interface SimulationStepClock {
	steps: number;
}

const ZERO_VEC: PhysicsVector3 = { x: 0, y: 0, z: 0 };

const _slerpPrevious = new Quaternion();
const _slerpCurrent = new Quaternion();

export class SimulationBody implements PhysicsRenderPoseProvider {
	private readonly poseScratch: StagePose = {
		position: [0, 0, 0],
		rotation: [0, 0, 0, 1],
	};
	private readonly renderScratch: StageRenderSlot = {
		position: [0, 0, 0],
		rotation: [0, 0, 0, 1],
		scale: 1,
		custom: [0, 0, 0, 0],
		isSleeping: false,
	};
	private readonly previousScratch: StageRenderSlot = {
		position: [0, 0, 0],
		rotation: [0, 0, 0, 1],
		scale: 1,
		custom: [0, 0, 0, 0],
		isSleeping: false,
	};

	/**
	 * First step at which the shared render buffers are coherent for this
	 * body. After a spawn or an explicit pose write (teleport), the current
	 * slot isn't written until the next fixed step and the previous-step
	 * copy lags one more; interpolating across that gap would sweep the
	 * mesh from a stale pose (often the origin). Until this step is
	 * reached, render reads collapse to the live body pose.
	 */
	private interpolationValidAfterStep: number;

	constructor(
		private readonly simulation: Simulation,
		public readonly handle: EntityHandle,
		private readonly clock: SimulationStepClock,
	) {
		this.interpolationValidAfterStep = clock.steps + 2;
	}

	/** Suppress interpolation until the render buffers catch up. */
	private markPoseDiscontinuity(): void {
		this.interpolationValidAfterStep = this.clock.steps + 2;
	}

	private isInterpolationStale(): boolean {
		return this.clock.steps < this.interpolationValidAfterStep;
	}

	// ─── Reads ───────────────────────────────────────────────────────────

	translation(): PhysicsVector3 {
		const pose = this.simulation.getPose(this.handle, this.poseScratch);
		if (!pose) return { ...ZERO_VEC };
		return { x: pose.position[0], y: pose.position[1], z: pose.position[2] };
	}

	rotation(): PhysicsQuaternion {
		const pose = this.simulation.getPose(this.handle, this.poseScratch);
		if (!pose) return { x: 0, y: 0, z: 0, w: 1 };
		return {
			x: pose.rotation[0],
			y: pose.rotation[1],
			z: pose.rotation[2],
			w: pose.rotation[3],
		};
	}

	linvel(): PhysicsVector3 {
		const vel = this.simulation.getLinearVelocity(this.handle);
		if (!vel) return { ...ZERO_VEC };
		return { x: vel[0], y: vel[1], z: vel[2] };
	}

	angvel(): PhysicsVector3 {
		const vel = this.simulation.adapter.getAngularVelocity(this.handle.slot);
		if (!vel) return { ...ZERO_VEC };
		return { x: vel[0], y: vel[1], z: vel[2] };
	}

	// ─── Writes ──────────────────────────────────────────────────────────

	setTranslation(translation: PhysicsVector3, _wakeUp: boolean = true): void {
		this.simulation.setPosition(this.handle, translation.x, translation.y, translation.z);
		this.markPoseDiscontinuity();
	}

	setRotation(rotation: PhysicsQuaternion, _wakeUp: boolean = true): void {
		this.simulation.setRotation(this.handle, rotation.x, rotation.y, rotation.z, rotation.w);
		this.markPoseDiscontinuity();
	}

	setLinvel(velocity: PhysicsVector3, _wakeUp: boolean = true): void {
		this.simulation.setLinearVelocity(this.handle, velocity.x, velocity.y, velocity.z);
	}

	setAngvel(velocity: PhysicsVector3, _wakeUp: boolean = true): void {
		this.simulation.setAngularVelocity(this.handle, velocity.x, velocity.y, velocity.z);
	}

	applyImpulse(impulse: PhysicsVector3, _wakeUp: boolean = true): void {
		this.simulation.applyImpulse(this.handle, impulse.x, impulse.y, impulse.z);
	}

	/**
	 * Rotation locks are fixed at body-creation time in the wasm runtime
	 * (`SimulationBodyDefinition.lockRotation`); there is no live setter FFI
	 * yet. Accepted for Rapier compat — when locking, the angular velocity is
	 * zeroed to approximate the intent. Prefer lock flags on the body
	 * definition at spawn time.
	 */
	lockRotations(locked: boolean, _wakeUp: boolean = true): void {
		if (locked) {
			this.setAngvel({ x: 0, y: 0, z: 0 });
		}
	}

	/**
	 * Translation locks are fixed at body-creation time in the wasm runtime
	 * (`SimulationBodyDefinition.lockTranslation`); there is no live setter
	 * FFI yet. Accepted for Rapier compat — when locking, the linear velocity
	 * is zeroed to approximate the intent. Prefer lock flags on the body
	 * definition at spawn time.
	 */
	lockTranslations(locked: boolean, _wakeUp: boolean = true): void {
		if (locked) {
			this.setLinvel({ x: 0, y: 0, z: 0 });
		}
	}

	/**
	 * Damping is fixed at body-creation time in the wasm runtime; there is no
	 * live setter FFI yet, so this is accepted (for `MoveableBodyLike`
	 * compatibility) but has no effect.
	 */
	setLinearDamping(_damping: number): void { }

	/**
	 * Gravity scale is fixed at body-creation time in the wasm runtime; there is
	 * no live setter FFI yet, so this is accepted for Rapier compat but has no
	 * effect. Prefer `gravityScale` on the body definition at spawn time when
	 * possible.
	 */
	setGravityScale(_scale: number, _wakeUp: boolean = true): void { }

	// ─── Introspection (debug overlays) ──────────────────────────────────

	private bodyInfo(): StageBodyInfo | null {
		return this.simulation.getBodyInfo(this.handle);
	}

	bodyType(): number {
		return this.bodyInfo()?.bodyType ?? 0;
	}

	mass(): number {
		return this.bodyInfo()?.mass ?? 0;
	}

	isSleeping(): boolean {
		return this.bodyInfo()?.isSleeping ?? false;
	}

	isEnabled(): boolean {
		return this.bodyInfo()?.isEnabled ?? true;
	}

	// ─── Render interpolation ─────────────────────────────────────────────

	private livePose(): PhysicsPose {
		const pose = this.simulation.getPose(this.handle, this.poseScratch);
		if (!pose) {
			return {
				position: { ...ZERO_VEC },
				rotation: { x: 0, y: 0, z: 0, w: 1 },
			};
		}
		return {
			position: { x: pose.position[0], y: pose.position[1], z: pose.position[2] },
			rotation: {
				x: pose.rotation[0],
				y: pose.rotation[1],
				z: pose.rotation[2],
				w: pose.rotation[3],
			},
		};
	}

	private static slotToPose(slot: StageRenderSlot): PhysicsPose {
		return {
			position: { x: slot.position[0], y: slot.position[1], z: slot.position[2] },
			rotation: {
				x: slot.rotation[0],
				y: slot.rotation[1],
				z: slot.rotation[2],
				w: slot.rotation[3],
			},
		};
	}

	getPoseHistory(): PhysicsPoseHistory {
		// After a spawn or teleport the render buffers are stale (zeros or a
		// despawned entity's pose) until two fixed steps have run; collapse
		// to the live body pose so nothing interpolates from the stale slot.
		if (this.isInterpolationStale()) {
			const pose = this.livePose();
			return { previous: clonePhysicsPose(pose), current: pose };
		}
		const current = this.simulation.readRenderSlot(this.handle, this.renderScratch);
		const previous = this.simulation.readPreviousRenderSlot(this.handle, this.previousScratch);
		const currentPose = current ? SimulationBody.slotToPose(current) : this.livePose();
		const previousPose = previous
			? SimulationBody.slotToPose(previous)
			: clonePhysicsPose(currentPose);
		return { previous: previousPose, current: currentPose };
	}

	getRenderPose(alpha: number): PhysicsPose {
		const history = this.getPoseHistory();
		return interpolatePhysicsPose(history.previous, history.current, alpha);
	}

	/**
	 * True when the latest render buffer marks this body as sleeping.
	 * Used by instancing to skip matrix writes for settled piles.
	 */
	isRenderSleeping(): boolean {
		const current = this.simulation.readRenderSlot(this.handle, this.renderScratch);
		return current?.isSleeping === true;
	}

	/**
	 * Zero-allocation render-pose read for hot paths (instanced rendering of
	 * thousands of bodies). Interpolates the previous → current fixed-step
	 * poses straight from the shared render buffer into the provided
	 * out-parameters — no intermediate pose objects.
	 */
	writeRenderPose(
		alpha: number,
		outPosition: { x: number; y: number; z: number },
		outRotation: { x: number; y: number; z: number; w: number },
	): void {
		// Render buffers are stale until two fixed steps after spawn/teleport;
		// use the live body pose with no interpolation.
		if (this.isInterpolationStale()) {
			this.writeLivePose(outPosition, outRotation);
			return;
		}

		const current = this.simulation.readRenderSlot(this.handle, this.renderScratch);
		if (!current) {
			this.writeLivePose(outPosition, outRotation);
			return;
		}
		const previous =
			this.simulation.readPreviousRenderSlot(this.handle, this.previousScratch) ?? current;

		const t = clampInterpolationAlpha(alpha);
		outPosition.x = previous.position[0] + (current.position[0] - previous.position[0]) * t;
		outPosition.y = previous.position[1] + (current.position[1] - previous.position[1]) * t;
		outPosition.z = previous.position[2] + (current.position[2] - previous.position[2]) * t;

		_slerpPrevious.set(
			previous.rotation[0],
			previous.rotation[1],
			previous.rotation[2],
			previous.rotation[3],
		);
		_slerpCurrent.set(
			current.rotation[0],
			current.rotation[1],
			current.rotation[2],
			current.rotation[3],
		);
		_slerpPrevious.slerp(_slerpCurrent, t);
		outRotation.x = _slerpPrevious.x;
		outRotation.y = _slerpPrevious.y;
		outRotation.z = _slerpPrevious.z;
		outRotation.w = _slerpPrevious.w;
	}

	private writeLivePose(
		outPosition: { x: number; y: number; z: number },
		outRotation: { x: number; y: number; z: number; w: number },
	): void {
		const pose = this.simulation.getPose(this.handle, this.poseScratch);
		if (pose) {
			outPosition.x = pose.position[0];
			outPosition.y = pose.position[1];
			outPosition.z = pose.position[2];
			outRotation.x = pose.rotation[0];
			outRotation.y = pose.rotation[1];
			outRotation.z = pose.rotation[2];
			outRotation.w = pose.rotation[3];
		} else {
			outPosition.x = 0;
			outPosition.y = 0;
			outPosition.z = 0;
			outRotation.x = 0;
			outRotation.y = 0;
			outRotation.z = 0;
			outRotation.w = 1;
		}
	}
}
