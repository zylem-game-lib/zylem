import type { IWorld } from 'bitecs';
import { defineBehavior } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import { setVelocityIntent } from '../../actions/capabilities/velocity-intents';
import { GroundProbe3D } from '../shared/ground-probe-3d';
import {
	createJumpConfig2D,
	createJumpInput2D,
	createJumpState2D,
	type JumpConfig2D,
	type JumpContext2D,
	type JumpInput2D,
	type JumpState2D,
} from './components';
import {
	Jumper2DBehavior,
	Jumper2DTickEvent,
} from './jumper-2d.behavior';
import { Jumper2DFSM, Jumper2DState } from './jumper-2d-fsm';

export interface Jumper2DBehaviorOptions {
	jumpHeight?: number;
	gravity?: number;
	maxFallSpeed?: number;
	maxJumps?: number;
	resetJumpsOnGround?: boolean;
	coyoteTimeMs?: number;
	jumpBufferMs?: number;
	minTimeBetweenJumpsMs?: number;
	variableJump?: JumpConfig2D['variableJump'];
	groundRayLength?: number;
	debugGroundProbe?: boolean;
}

const defaultOptions: Jumper2DBehaviorOptions = {
	jumpHeight: 2.5,
	gravity: 20,
	maxJumps: 1,
	resetJumpsOnGround: true,
	coyoteTimeMs: 100,
	jumpBufferMs: 80,
	groundRayLength: 1,
	debugGroundProbe: false,
};

const JUMPER_2D_BEHAVIOR_KEY = Symbol.for('zylem:behavior:jumper-2d');
const JUMPER_2D_OFFSETS = [
	{ x: 0, z: 0 },
	{ x: 0.35, z: 0 },
	{ x: -0.35, z: 0 },
] as const;

export function isJumper2DGrounded(params: {
	nearGround: boolean;
	velocityY: number;
}): boolean {
	return params.nearGround && params.velocityY <= 0;
}

export interface Jumper2DEntity {
	uuid: string;
	body: any;
	transformStore: any;
	jumper2d: JumpConfig2D;
	$jumper2d: JumpInput2D;
	jumper2dState: JumpState2D;
}

class Jumper2DBehaviorSystem implements BehaviorSystem {
	private behavior = new Jumper2DBehavior();
	private groundProbe: GroundProbe3D;
	private initializedEntities = new Set<string>();
	private timeSinceGroundedMs = new Map<string, number>();
	private wasJumpHeld = new Map<string, boolean>();

	constructor(
		private world: any,
		private scene: any,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {
		this.groundProbe = new GroundProbe3D(world);
	}

	update(_ecs: IWorld, delta: number): void {
		const links = this.getBehaviorLinks?.(JUMPER_2D_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const gameEntity = link.entity as any;
			const jumperRef = link.ref as any;
			if (!gameEntity.body) continue;

			const options = jumperRef.options as Jumper2DBehaviorOptions;

			if (!gameEntity.jumper2d) {
				gameEntity.jumper2d = createJumpConfig2D(options);
			}
			if (!gameEntity.$jumper2d) {
				gameEntity.$jumper2d = createJumpInput2D();
			}
			if (!gameEntity.jumper2dState) {
				gameEntity.jumper2dState = createJumpState2D();
			}
			if (!this.initializedEntities.has(gameEntity.uuid)) {
				this.initializedEntities.add(gameEntity.uuid);
				gameEntity.body.setGravityScale(0, true);
			}
			if (!jumperRef.fsm && gameEntity.jumper2dState) {
				jumperRef.fsm = new Jumper2DFSM({
					state: gameEntity.jumper2dState,
				});
			}

			const rayLength = options.groundRayLength ?? 1;
			const bodyVelocity = gameEntity.body.linvel();
			const nearGround = this.groundProbe.detect(gameEntity, {
				rayLength,
				offsets: JUMPER_2D_OFFSETS,
				mode: 'any',
				debug: options.debugGroundProbe ?? false,
				scene: this.scene,
				originYOffset: 0.05,
			});
			const isGrounded = isJumper2DGrounded({
				nearGround,
				velocityY: bodyVelocity.y,
			});

			let timeSinceGroundedMs = this.timeSinceGroundedMs.get(gameEntity.uuid) ?? 0;
			if (isGrounded) {
				timeSinceGroundedMs = 0;
			} else {
				timeSinceGroundedMs += delta * 1000;
			}
			this.timeSinceGroundedMs.set(gameEntity.uuid, timeSinceGroundedMs);

			const config: JumpConfig2D = gameEntity.jumper2d;
			const input: JumpInput2D = gameEntity.$jumper2d;
			const state: JumpState2D = gameEntity.jumper2dState;
			const previousHeld = this.wasJumpHeld.get(gameEntity.uuid) ?? false;
			const held = input.jumpHeld === true;
			const effectiveInput: JumpInput2D = {
				...input,
				jumpPressed: input.jumpPressed || (held && !previousHeld),
				jumpReleased: input.jumpReleased || (!held && previousHeld),
			};

			const store = gameEntity.transformStore;
			const ctx: JumpContext2D = {
				dt: delta,
				velocityY: bodyVelocity.y,
				isGrounded,
				timeSinceGroundedMs,
				setVerticalVelocity: (y: number) => {
					setVelocityIntent(
						store,
						'jumper-2d',
						{ y },
						{ mode: 'replace', priority: 20 },
					);
					ctx.velocityY = y;
				},
			};

			const result = this.behavior.tick(config, effectiveInput, ctx, state);
			this.wasJumpHeld.set(gameEntity.uuid, held);

			if (jumperRef.fsm) {
				(jumperRef.fsm as Jumper2DFSM).applyTickEvent(result.event, isGrounded);
			}
		}
	}

	destroy(_ecs: IWorld): void {
		this.groundProbe.destroy();
		this.initializedEntities.clear();
		this.timeSinceGroundedMs.clear();
		this.wasJumpHeld.clear();
	}
}

export const Jumper2D = defineBehavior<
	Jumper2DBehaviorOptions,
	{
		getState: () => Jumper2DState;
		isJumping: () => boolean;
		getJumpsUsed: () => number;
		getJumpsRemaining: () => number;
	},
	Jumper2DEntity
>({
	name: 'jumper-2d',
	defaultOptions,
	systemFactory: (ctx) =>
		new Jumper2DBehaviorSystem(ctx.world, ctx.scene, ctx.getBehaviorLinks),
	createHandle: (ref) => ({
		getState: () =>
			(ref.fsm as Jumper2DFSM | undefined)?.getState() ??
			Jumper2DState.Grounded,
		isJumping: () =>
			(ref.fsm as Jumper2DFSM | undefined)?.isJumping() ?? false,
		getJumpsUsed: () =>
			(ref.fsm as Jumper2DFSM | undefined)?.getJumpsUsed() ?? 0,
		getJumpsRemaining: () => {
			const maxJumps = ref.options.maxJumps ?? 1;
			const used =
				(ref.fsm as Jumper2DFSM | undefined)?.getJumpsUsed() ?? 0;
			return maxJumps - used;
		},
	}),
});
