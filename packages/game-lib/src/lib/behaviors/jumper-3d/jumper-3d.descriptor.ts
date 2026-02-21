/**
 * Jumper 3D Behavior Descriptor
 *
 * Type-safe descriptor for the jumper-3d behavior system.
 * Provides `entity.use()` API for composable 3D jumping.
 */

import { Vector3, BufferGeometry, LineBasicMaterial, Line } from 'three';
import { Ray } from '@dimforge/rapier3d-compat';
import type { IWorld } from 'bitecs';
import { defineBehavior } from '../behavior-descriptor';
import type { BehaviorSystem } from '../behavior-system';
import { setVelocityIntent } from '../../actions/capabilities/velocity-intents';
import { Jumper3DBehavior } from './jumper-3d.behavior';
import { Jumper3DFSM, Jumper3DState } from './jumper-3d-fsm';
import {
	createJumpConfig3D,
	createJumpInput3D,
	createJumpState3D,
	type JumpConfig3D,
	type JumpInput3D,
	type JumpState3D,
	type JumpContext3D,
} from './components';

// ─────────────────────────────────────────────────────────────────────────────
// Options exposed through entity.use()
// ─────────────────────────────────────────────────────────────────────────────

export interface Jumper3DBehaviorOptions {
	/** Desired peak height in world units (default: 2.5) */
	jumpHeight?: number;
	/** Gravity magnitude applied by the behavior (default: 20) */
	gravity?: number;
	/** Terminal fall speed (optional) */
	maxFallSpeed?: number;
	/** Max concurrent jumps, 1 = single, 2 = double, etc. (default: 1) */
	maxJumps?: number;
	/** Reset jump counter on ground (default: true) */
	resetJumpsOnGround?: boolean;
	/** Reset jump counter on wall contact (default: undefined) */
	resetJumpsOnWall?: boolean;
	/** Coyote time in ms (default: 100) */
	coyoteTimeMs?: number;
	/** Jump buffer in ms (default: 80) */
	jumpBufferMs?: number;
	/** Min cooldown between jumps in ms (optional) */
	minTimeBetweenJumpsMs?: number;
	/** Variable jump height config (optional) */
	variableJump?: JumpConfig3D['variableJump'];
	/** Planar control config (optional) */
	planar?: JumpConfig3D['planar'];
	/** Fall tuning (optional) */
	fall?: JumpConfig3D['fall'];
	/** Ground-detection ray length (default: 1.0) */
	groundRayLength?: number;
}

const defaultOptions: Jumper3DBehaviorOptions = {
	jumpHeight: 2.5,
	gravity: 20,
	maxJumps: 1,
	resetJumpsOnGround: true,
	coyoteTimeMs: 100,
	jumpBufferMs: 80,
	groundRayLength: 1.0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Entity shape expected by the system
// ─────────────────────────────────────────────────────────────────────────────

export interface Jumper3DEntity {
	uuid: string;
	body: any;
	transformStore: any;
	jumper: JumpConfig3D;
	$jumper: JumpInput3D;
	jumperState: JumpState3D;
}

// ─────────────────────────────────────────────────────────────────────────────
// Ground detection helper
// ─────────────────────────────────────────────────────────────────────────────

const GROUND_RAY_OFFSETS = [
	{ x: 0, z: 0 },
	{ x: 0.4, z: 0.4 },
	{ x: -0.4, z: 0.4 },
	{ x: 0.4, z: -0.4 },
	{ x: -0.4, z: -0.4 },
];

class GroundDetector {
	private rays = new Map<string, Ray[]>();
	private debugLines = new Map<string, Line[]>();

	detectGround(
		entity: Jumper3DEntity,
		world: any,
		scene: any,
		rayLength: number,
	): boolean {
		if (!world?.world || !entity.body) return false;

		const translation = entity.body.translation();

		let entityRays = this.rays.get(entity.uuid);
		if (!entityRays) {
			entityRays = GROUND_RAY_OFFSETS.map(
				() => new Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }),
			);
			this.rays.set(entity.uuid, entityRays);
		}

		let centerHit = false;

		for (let i = 0; i < GROUND_RAY_OFFSETS.length; i++) {
			const offset = GROUND_RAY_OFFSETS[i];
			const ray = entityRays[i];
			let rayHit = false;
			ray.origin = {
				x: translation.x + offset.x,
				y: translation.y + 0.05,
				z: translation.z + offset.z,
			};
			ray.dir = { x: 0, y: -1, z: 0 };

			world.world.castRay(
				ray,
				rayLength,
				true,
				undefined,
				undefined,
				undefined,
				undefined,
				(collider: any) => {
					const ref = collider._parent?.userData?.uuid;
					if (ref === entity.uuid) return false;
					rayHit = true;
					return true;
				},
			);

			if (rayHit && i === 0) centerHit = true;
		}

		// For FPS/platform movement, use center-ray grounding only so
		// ledge fall starts as soon as the body's center leaves support.
		// Side rays are still useful for debug visualization.
		const grounded = centerHit;

		if (scene) {
			this.updateDebugLines(entity, entityRays, grounded, rayLength, scene);
		}

		return grounded;
	}

	private updateDebugLines(
		entity: Jumper3DEntity,
		rays: Ray[],
		hasGround: boolean,
		length: number,
		scene: any,
	): void {
		let lines = this.debugLines.get(entity.uuid);
		if (!lines) {
			lines = rays.map(() => {
				const geometry = new BufferGeometry().setFromPoints([
					new Vector3(),
					new Vector3(),
				]);
				const material = new LineBasicMaterial({ color: 0xff0000 });
				const line = new Line(geometry, material);
				scene.add(line);
				return line;
			});
			this.debugLines.set(entity.uuid, lines);
		}

		rays.forEach((ray, i) => {
			const line = lines![i];
			const start = new Vector3(ray.origin.x, ray.origin.y, ray.origin.z);
			const end = new Vector3(
				ray.origin.x + ray.dir.x * length,
				ray.origin.y + ray.dir.y * length,
				ray.origin.z + ray.dir.z * length,
			);
			line.geometry.setFromPoints([start, end]);
			(line.material as LineBasicMaterial).color.setHex(
				hasGround ? 0x00ff00 : 0xff0000,
			);
		});
	}

	destroy(): void {
		this.rays.clear();
		this.debugLines.clear();
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Behavior System adapter
// ─────────────────────────────────────────────────────────────────────────────

class Jumper3DBehaviorSystem implements BehaviorSystem {
	private behavior = new Jumper3DBehavior();
	private groundDetector = new GroundDetector();
	private initializedEntities = new Set<string>();
	private timeSinceGroundedMs = new Map<string, number>();
	private wasGrounded = new Map<string, boolean>();
	private wasJumpHeld = new Map<string, boolean>();

	constructor(
		private world: any,
		private scene: any,
	) {}

	update(_ecs: IWorld, delta: number): void {
		if (!this.world?.collisionMap) return;

		for (const [, entity] of this.world.collisionMap) {
			const gameEntity = entity as any;

			if (typeof gameEntity.getBehaviorRefs !== 'function') continue;

			const refs = gameEntity.getBehaviorRefs();
			const jumperRef = refs.find(
				(r: any) =>
					r.descriptor.key === Symbol.for('zylem:behavior:jumper-3d'),
			);

			if (!jumperRef || !gameEntity.body) continue;

			const options = jumperRef.options as Jumper3DBehaviorOptions;

			// ── Lazy component init ────────────────────────────────────────
			if (!gameEntity.jumper) {
				gameEntity.jumper = createJumpConfig3D(options);
			}
			if (!gameEntity.$jumper) {
				gameEntity.$jumper = createJumpInput3D();
			}
			if (!gameEntity.jumperState) {
				gameEntity.jumperState = createJumpState3D();
			}

			if (!this.initializedEntities.has(gameEntity.uuid)) {
				this.initializedEntities.add(gameEntity.uuid);
				gameEntity.body.setGravityScale(0, true);
			}

			// ── Lazy FSM init ──────────────────────────────────────────────
			if (!jumperRef.fsm && gameEntity.jumperState) {
				jumperRef.fsm = new Jumper3DFSM({
					state: gameEntity.jumperState,
				});
			}

			// ── Ground detection ───────────────────────────────────────────
			const rayLength = options.groundRayLength ?? 1.0;
			const bodyVel = gameEntity.body.linvel();
			const nearGround = this.groundDetector.detectGround(
				gameEntity,
				this.world,
				this.scene,
				rayLength,
			);

			const isGrounded = nearGround && bodyVel.y > -2.0 && bodyVel.y < 2.0;

			// Event-based transition logging
			const prevGrounded = this.wasGrounded.get(gameEntity.uuid) ?? false;
			if (isGrounded && !prevGrounded) {
				console.log('[JUMPER3D] GROUNDED');
			} else if (!isGrounded && prevGrounded) {
				console.log('[JUMPER3D] AIRBORNE, bodyVel.y:', bodyVel.y.toFixed(3));
			}
			this.wasGrounded.set(gameEntity.uuid, isGrounded);

			let tsg = this.timeSinceGroundedMs.get(gameEntity.uuid) ?? 0;
			if (isGrounded) {
				tsg = 0;
			} else {
				tsg += delta * 1000;
			}
			this.timeSinceGroundedMs.set(gameEntity.uuid, tsg);

			// ── Build context ──────────────────────────────────────────────
			// Each behavior owns its own velocity axes. The jumper only
			// reads/writes Y; horizontal axes are left to the movement
			// controller. We read the current Y from the physics body
			// (post-step) so the jumper always sees the real vertical state.
			const config: JumpConfig3D = gameEntity.jumper;
			const input: JumpInput3D = gameEntity.$jumper;
			const state: JumpState3D = gameEntity.jumperState;
			const prevHeld = this.wasJumpHeld.get(gameEntity.uuid) ?? false;
			const held = input.jumpHeld === true;

			// Input callbacks run after behavior systems in the frame loop.
			// Reconstruct button edges from held-state history so one-frame
			// `pressed`/`released` pulses are not missed by the jumper tick.
			const effectiveInput: JumpInput3D = {
				...input,
				jumpPressed: input.jumpPressed || (held && !prevHeld),
				jumpReleased: input.jumpReleased || (!held && prevHeld),
			};

			const store = gameEntity.transformStore;

			const ctx: JumpContext3D = {
				dt: delta,
				up: { x: 0, y: 1, z: 0 },
				velocityY: bodyVel.y,
				horizontalVelocity: { x: bodyVel.x, z: bodyVel.z },
				isGrounded,
				timeSinceGroundedMs: tsg,
				setVerticalVelocity: (y: number) => {
					setVelocityIntent(
						store,
						'jumper-3d',
						{ y },
						{ mode: 'replace', priority: 20 },
					);
					ctx.velocityY = y;
				},
				setHorizontalVelocity: (x: number, z: number) => {
					setVelocityIntent(
						store,
						'jumper-3d',
						{ x, z },
						{ mode: 'replace', priority: 20 },
					);
					ctx.horizontalVelocity.x = x;
					ctx.horizontalVelocity.z = z;
				},
			};

			// ── Tick ───────────────────────────────────────────────────────
			const result = this.behavior.tick(config, effectiveInput, ctx, state);
			this.wasJumpHeld.set(gameEntity.uuid, held);

			// ── FSM sync ───────────────────────────────────────────────────
			if (jumperRef.fsm) {
				(jumperRef.fsm as Jumper3DFSM).applyTickEvent(
					result.event,
					isGrounded,
				);
			}
		}
	}

	destroy(_ecs: IWorld): void {
		this.groundDetector.destroy();
		this.initializedEntities.clear();
		this.timeSinceGroundedMs.clear();
		this.wasGrounded.clear();
		this.wasJumpHeld.clear();
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Public descriptor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Jumper3D — composable 3D jump behavior.
 *
 * Provides height-based jumping, multi-jump, coyote time, jump buffering,
 * variable jump height, configurable fall gravity, and optional air control.
 *
 * Designed to compose with any movement controller (e.g. FirstPersonController)
 * — the controller writes X/Z velocity and Jumper3D writes Y velocity.
 *
 * @example
 * ```typescript
 * import { Jumper3D } from "@zylem/game-lib";
 *
 * const jumper = player.use(Jumper3D, {
 *   jumpHeight: 2.5,
 *   gravity: 20,
 *   maxJumps: 2,
 *   coyoteTimeMs: 100,
 *   jumpBufferMs: 80,
 *   variableJump: { enabled: true, cutGravityMultiplier: 3 },
 *   fall: { fallGravityMultiplier: 1.5 },
 * });
 *
 * player.onUpdate(({ inputs }) => {
 *   player.$jumper.jumpPressed = inputs.p1.buttons.A.pressed;
 *   player.$jumper.jumpHeld = inputs.p1.buttons.A.held > 0;
 *   player.$jumper.jumpReleased = inputs.p1.buttons.A.released;
 *
 *   const state = jumper.getState();  // Grounded | Jumping | Falling
 * });
 * ```
 */
export const Jumper3D = defineBehavior<
	Jumper3DBehaviorOptions,
	{
		getState: () => Jumper3DState;
		isJumping: () => boolean;
		getJumpsUsed: () => number;
		getJumpsRemaining: () => number;
	},
	Jumper3DEntity
>({
	name: 'jumper-3d',
	defaultOptions,
	systemFactory: (ctx) => new Jumper3DBehaviorSystem(ctx.world, ctx.scene),
	createHandle: (ref) => ({
		getState: () =>
			(ref.fsm as Jumper3DFSM | undefined)?.getState() ??
			Jumper3DState.Grounded,
		isJumping: () =>
			(ref.fsm as Jumper3DFSM | undefined)?.isJumping() ?? false,
		getJumpsUsed: () =>
			(ref.fsm as Jumper3DFSM | undefined)?.getJumpsUsed() ?? 0,
		getJumpsRemaining: () => {
			const maxJumps = ref.options.maxJumps ?? 1;
			const used =
				(ref.fsm as Jumper3DFSM | undefined)?.getJumpsUsed() ?? 0;
			return maxJumps - used;
		},
	}),
});
