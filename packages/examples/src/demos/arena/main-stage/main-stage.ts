/// <reference types="@zylem/assets" />

import { Color, Vector3 } from 'three';
import {
	CooldownBehavior,
	type CooldownHandle,
	type CooldownOptions,
	type UpdateContext,
	createBox,
	createCamera,
	createCooldownIcon,
	createPlane,
	createStage,
	createText,
	setCameraFeed,
	useArrowsForAxes,
	type StageEntity,
} from '@zylem/game-lib';
import { ZylemRuntimePlatformer3DFsmState } from '@zylem/game-lib/runtime';
import {
	Platformer3DRuntimeAdapter,
	buildPlatformerGroundHeightfield,
	staticBoxesFromEntities,
	staticBoxFromEntity,
} from '../../../runtime/platformer-3d-runtime';
import { TransformableEntity } from '~/lib/actions/capabilities/apply-transform';
import { GameEntity } from '~/lib/entities';
import {
	type CharacterClass,
	createCharacterActor,
	getCharacterLoadout,
} from '../characters';
import type {
	CharacterLoadout,
	CharacterMoveset,
	SpecialSlotId,
} from '../characters/movesets';
import { arenaShader } from './stage-background-shader.shader';
import { createBoulders } from './boulders';
import {
	createCombatController,
	cooldownNameForSlot,
	type ReportAttackHit,
} from './combat-controller';
import groundTextureUrl from '../assets/ground.png';

export type PlayerEntity = TransformableEntity & GameEntity<any> & StageEntity;

/**
 * Per-avatar bookkeeping kept on the main stage: the 3D actor, its floating
 * nameplate, the source device id (for remote/local disambiguation), and a
 * flag marking the locally-controlled avatar.
 */
export interface AvatarRecord {
	actor: PlayerEntity;
	nameplate: ReturnType<typeof createText>;
	/** Display name shown on the nameplate (pre-HP suffix). */
	displayName: string;
	deviceId: string;
	isLocal: boolean;
	/**
	 * Original spawn position captured on avatar creation. Used by the
	 * fall-respawn check to teleport a player back when they fall off
	 * the map.
	 */
	spawn: { x: number; y: number; z: number };
	/** Per-player HP state mirrored from the `player` STDB row. */
	hp: number;
	maxHp: number;
}

/**
 * Shape emitted every frame by the local player's movement update. Network
 * layers turn this into a STDB reducer call; offline mode simply ignores it.
 */
export interface LocalTransformPayload {
	position: { x: number; y: number; z: number };
	rotation: { x: number; y: number; z: number; w: number };
	scale: { x: number; y: number; z: number };
	animation: NetworkAnimationState;
}

export interface NetworkAnimationState {
	key: string;
	pauseAtEnd?: boolean;
}

type StageHandle = ReturnType<typeof createStage>;

/**
 * Parameters for `spawnAvatar`. When `isLocal` is true the main stage also
 * installs input-driven platformer movement, rotates the character toward
 * the last movement direction, and points the follow camera at the actor;
 * network code can observe per-frame transforms via `onLocalTransform`.
 */
export interface SpawnAvatarOptions {
	entityId: bigint;
	isLocal: boolean;
	displayName: string;
	characterClass: CharacterClass;
	color: Color;
	position?: { x: number; y: number; z: number };
	deviceId: string;
	/** Called every frame with the local actor's current physics pose. */
	onLocalTransform?: (payload: LocalTransformPayload) => void;
}

/**
 * Public surface area exposed by `createArenaMainStage`. Network code and
 * the top-level demo wire against this handle; the main stage owns the
 * stage + camera + local-player state entirely.
 */
/**
 * Info emitted by the main stage when the local player crosses below
 * `FALL_Y_THRESHOLD`. Network code turns this into a `respawn_player`
 * reducer call. The local teleport (zero velocity + snap back to spawn)
 * has already been applied by the time this callback fires.
 */
export interface FallRespawnPayload {
	entityId: bigint;
	deviceId: string;
	spawn: { x: number; y: number; z: number };
}

export interface ArenaMainStageHandle {
	/** Fluent stage wrapper returned by `createStage`. */
	stage: StageHandle;
	/** Follow camera attached to the main stage. */
	mainCamera: ReturnType<typeof createCamera>;
	/** Live lookup of rendered avatars, keyed by STDB entity id. */
	avatars: Map<bigint, AvatarRecord>;
	/** STDB entity id of the locally-controlled avatar (null before spawn). */
	getLocalEntityId(): bigint | null;
	/** Reference to the local avatar actor (null before spawn). */
	getLocalActor(): PlayerEntity | null;
	/**
	 * Spawn a new avatar on the stage. For local avatars, also installs the
	 * input-driven movement update and sets the follow camera target.
	 */
	spawnAvatar(opts: SpawnAvatarOptions): AvatarRecord;
	/** Remove an avatar + its nameplate from the stage. */
	removeAvatar(entityId: bigint): void;
	/**
	 * Register (or clear) a sink for local-player attack hits. The enemies
	 * module binds this so each attack emission can resolve overlaps
	 * against enemy positions and call `damageEnemy`.
	 */
	setAttackHitHandler(handler: ReportAttackHit | null): void;
	/**
	 * Register (or clear) a sink for local-player fall respawn events.
	 * The network layer uses this to broadcast the authoritative respawn
	 * via STDB.
	 */
	setFallRespawnHandler(handler: ((info: FallRespawnPayload) => void) | null): void;
	/**
	 * Refresh the HP displayed on an avatar's nameplate, and play the
	 * `fallen` animation when HP first hits 0.
	 */
	applyPlayerHp(entityId: bigint, hp: number, maxHp: number): void;
	/**
	 * Reset all local-player state. Call on stage teardown so reloads /
	 * stage transitions don't leak references into subsequent runs.
	 */
	reset(): void;
}

/**
 * Maps the wasm runtime's Platformer3D FSM state to an animation key +
 * pauseAtEnd flag. Falling and jumping hold the last frame of
 * `jumping-up` so the apex of the jump reads as a still pose; landing
 * plays a full descent frame.
 *
 * The arena intentionally doesn't expose a run ability, so the
 * `Running` FSM state is unreachable in practice. Collapsing both
 * Walking + Running onto 'walking' also matches the fact that the
 * character rigs share one locomotion clip for both keys.
 */
export function animationForPlatformerState(
	state: ZylemRuntimePlatformer3DFsmState,
): NetworkAnimationState {
	switch (state) {
		case ZylemRuntimePlatformer3DFsmState.Running:
		case ZylemRuntimePlatformer3DFsmState.Walking:
			return { key: 'walking' };
		case ZylemRuntimePlatformer3DFsmState.Jumping:
			return { key: 'jumping-up', pauseAtEnd: true };
		case ZylemRuntimePlatformer3DFsmState.Falling:
			return { key: 'jumping-up', pauseAtEnd: true };
		case ZylemRuntimePlatformer3DFsmState.Landing:
			return { key: 'jumping-down', pauseAtEnd: true };
		case ZylemRuntimePlatformer3DFsmState.Idle:
		default:
			return { key: 'idle' };
	}
}


/**
 * Options for {@link createArenaBowlHeightMap}.
 */
interface ArenaBowlOptions {
	/** Grid resolution: produces a `(subdivisions + 1)` square vertex grid. */
	subdivisions: number;
	/**
	 * Radius (normalized 0..1) of the near-flat central play area. Inside
	 * this radius the ground only gets tiny sinusoidal bumps so traversal
	 * and combat stay predictable.
	 */
	innerRadius: number;
	/** Peak amplitude of the inner-area cosmetic bumps, in world units. */
	bumpAmplitude: number;
	/** Peak height of the outer-ring hills at the plane's corners. */
	edgeAmplitude: number;
}

/**
 * Procedurally build a 2D absolute-height grid for the arena floor.
 *
 * The shape is a shallow "bowl": near the center, heights stay close to
 * zero with sub-meter cosmetic bumps (three stacked sine terms offset so
 * the bumps don't align on axes). Toward the edges, a smoothstepped
 * radial ramp lifts the floor into low hills that taller, irregular
 * ridge noise breaks up so the horizon doesn't look like a uniform wall.
 */
function createArenaBowlHeightMap(options: ArenaBowlOptions): number[][] {
	const { subdivisions, innerRadius, bumpAmplitude, edgeAmplitude } = options;
	const vertsPerSide = subdivisions + 1;
	const grid: number[][] = [];
	for (let z = 0; z < vertsPerSide; z++) {
		const row: number[] = [];
		const v = z / subdivisions;
		for (let x = 0; x < vertsPerSide; x++) {
			const u = x / subdivisions;
			const nx = u * 2 - 1;
			const nz = v * 2 - 1;
			const r = Math.min(1, Math.hypot(nx, nz));

			const bump =
				Math.sin(u * Math.PI * 6) * 0.35 +
				Math.cos(v * Math.PI * 4.2 + 1.3) * 0.45 +
				Math.sin((u + v) * Math.PI * 7.1 + 2.1) * 0.2;
			const innerHeight = bump * bumpAmplitude;

			const t = Math.max(0, (r - innerRadius) / (1 - innerRadius));
			const rampEase = t * t * (3 - 2 * t);
			const ridgeNoise =
				Math.sin(Math.atan2(nz, nx) * 5 + r * 8) * 0.35 +
				Math.cos(u * Math.PI * 3.3 + v * Math.PI * 2.1) * 0.25;
			const outerHeight = rampEase * edgeAmplitude * (1 + ridgeNoise * 0.4);

			row.push(innerHeight + outerHeight);
		}
		grid.push(row);
	}
	return grid;
}

/**
 * Build the arena's main stage: stage + follow camera + ground plane +
 * static boulders + local-player + nameplate positioning. Returns a
 * handle for the top-level demo and network code to spawn/remove
 * avatars and drive local input.
 */
export function createArenaMainStage(): ArenaMainStageHandle {
	const mainCamera = createCamera({
		position: { x: 0, y: 8, z: 6 },
		perspective: 'third-person',
		name: 'arena-main-cam',
	});

	// Broadcast-style second camera that slowly orbits the arena and
	// feeds a texture into the back-wall jumbotron. Works on every client
	// even if they're not the AI host — the feed is purely a local render.
	// Start on the -Z side so the very first frame can't see the jumbotron
	// screen at (0, 12, -28) and trigger a framebuffer feedback loop.
	const jumbotronCamera = createCamera({
		position: { x: 0, y: 12, z: -16 },
		target: { x: 0, y: 2, z: 0 },
		perspective: 'third-person',
		name: 'arena-jumbotron-cam',
		renderToTexture: { width: 1024, height: 576 },
	});

	// Build the static scenery up-front so we can mirror it into the wasm
	// runtime *before* the stage is constructed. The wasm KCC needs to
	// know about the heightfield + boulders + jumbotron walls so it
	// stops the local player at the same surfaces the renderer shows.
	const groundPlane = createPlane({
		tile: { x: 100, y: 100 },
		position: { x: 0, y: -4, z: 0 },
		collision: { static: true },
		// 2D absolute-height grid: flat-ish play area in the middle, hills
		// pushing up toward the edges to form an arena "bowl".
		heightMap2D: createArenaBowlHeightMap({
			subdivisions: 40,
			innerRadius: 0.35,
			bumpAmplitude: 0.35,
			edgeAmplitude: 4.5,
		}),
		material: {
			path: groundTextureUrl,
			repeat: { x: 10, y: 10 },
		},
	});

	const boulders = createBoulders();

	// ─── Jumbotron: back-wall mega-screen with a broadcast feed ─────────────
	//
	// Positioned on the -Z edge of the arena so it's always visible in the
	// default camera framing. The screen mesh becomes a camera feed target
	// via `setCameraFeed`, and we rotate the jumbotron camera slowly around
	// the origin so remote players see an orbit-shot of the action.
	const JUMBO_POS_Z = -28;
	const JUMBO_WIDTH = 26;
	const JUMBO_HEIGHT = JUMBO_WIDTH * (9 / 16);
	const JUMBO_SCREEN_Y = 12;

	const jumbotronScreen = createBox({
		name: 'arena-jumbotron-screen',
		position: { x: 0, y: JUMBO_SCREEN_Y, z: JUMBO_POS_Z },
		size: { x: JUMBO_WIDTH, y: JUMBO_HEIGHT, z: 0.3 },
		collision: { static: true },
		material: { color: new Color(0x111111) },
	});

	const jumbotronFrame = createBox({
		name: 'arena-jumbotron-frame',
		position: { x: 0, y: JUMBO_SCREEN_Y, z: JUMBO_POS_Z - 0.2 },
		size: { x: JUMBO_WIDTH + 0.8, y: JUMBO_HEIGHT + 0.8, z: 0.2 },
		collision: { static: true },
		material: { color: new Color(0x333333) },
	});

	jumbotronScreen.onSetup(({ me }: any) => {
		setCameraFeed(me, jumbotronCamera);
	});

	// All character classes share the same capsule dimensions; see the
	// `*_COLLISION` constants in arena/characters/*.ts.
	const PLAYER_CAPSULE = { halfHeight: 1.4, radius: 0.5 } as const;
	const PLAYER_FEET_OFFSET = PLAYER_CAPSULE.halfHeight + PLAYER_CAPSULE.radius;

	const groundHeightfield = buildPlatformerGroundHeightfield(groundPlane);
	const staticColliders = [
		...staticBoxesFromEntities(boulders),
		// Jumbotron parts are far back / high, but mirroring them keeps
		// the local player from clipping through if they jump that way.
		...[jumbotronScreen, jumbotronFrame].flatMap((e) => {
			const c = staticBoxFromEntity(e);
			return c ? [c] : [];
		}),
	];

	// Adapter is constructed up-front (so the stage knows about it from
	// the start) but the *player* is wired in lazily in `spawnAvatar`
	// once the lobby has resolved a character class. The platformer opts
	// are baked from the third-person test defaults; per-class opts are
	// applied via `setPlayer` indirectly through animation/input only,
	// which is intentional for now \u2014 arena class differences in jump
	// height / walk speed will return as a follow-up if needed.
	const platformerAdapter = new Platformer3DRuntimeAdapter({
		player: null,
		capsule: {
			position: [0, 5, 0],
			halfHeight: PLAYER_CAPSULE.halfHeight,
			radius: PLAYER_CAPSULE.radius,
		},
		platformer: {
			walkSpeed: 10,
			runSpeed: 20,
			jumpForce: 16,
			maxJumps: 1,
			gravity: 9.82,
		},
		staticColliders,
		heightfield: groundHeightfield,
	});

	const stage = createStage(
		{
			gravity: new Vector3(0, -9.82, 0),
			backgroundShader: arenaShader,
			runtimeAdapter: platformerAdapter,
		},
		mainCamera,
		jumbotronCamera,
	).setInputConfiguration(useArrowsForAxes('p1'));

	stage.add(groundPlane, ...boulders);
	stage.add(jumbotronScreen, jumbotronFrame);

	// Sweep the broadcast camera across a bounded 120-degree arc centered
	// on -Z (i.e. between the jumbotron screen and the origin). Keeping the
	// camera strictly on the -Z side means the screen at z=-28 is always
	// *behind* the camera and therefore never renders into its own feed —
	// this is what avoids `GL_INVALID_OPERATION: Feedback loop formed
	// between Framebuffer and active Texture`.
	const JUMBO_ORBIT_RADIUS = 22;
	const JUMBO_ARC_CENTER = -Math.PI / 2;
	const JUMBO_ARC_HALFWIDTH = Math.PI / 3;
	const JUMBO_ORBIT_SPEED = 0.25;
	let jumboOrbitTime = 0;
	stage.onUpdate(({ delta }: UpdateContext<any>) => {
		jumboOrbitTime += delta;
		const sweep = Math.sin(jumboOrbitTime * JUMBO_ORBIT_SPEED);
		const a = JUMBO_ARC_CENTER + sweep * JUMBO_ARC_HALFWIDTH;
		const cam = jumbotronCamera.cameraRef?.camera;
		if (!cam) return;
		cam.position.set(
			Math.cos(a) * JUMBO_ORBIT_RADIUS,
			8 + Math.sin(jumboOrbitTime * 0.8) * 1.5,
			Math.sin(a) * JUMBO_ORBIT_RADIUS,
		);
		cam.lookAt(0, 2, 0);
	});

	const avatars = new Map<bigint, AvatarRecord>();
	let localEntityId: bigint | null = null;
	let localActor: PlayerEntity | null = null;
	let attackHitHandler: ReportAttackHit | null = null;
	let fallRespawnHandler: ((info: FallRespawnPayload) => void) | null = null;
	const lastMovement = new Vector3();

	/**
	 * Y-axis threshold below which the local actor is considered to have
	 * fallen off the arena. Teleports back to their spawn pose.
	 */
	const FALL_Y_THRESHOLD = -20;

	/**
	 * Build the `cooldowns` config for `CooldownBehavior` from a loadout
	 * by translating each `special` slot's `cooldown` into a registered
	 * cooldown keyed by {@link cooldownNameForSlot}.
	 */
	function buildCooldownOptions(
		loadout: CharacterLoadout,
	): CooldownOptions | null {
		const cooldowns: CooldownOptions['cooldowns'] = {};
		let count = 0;
		for (const slot of ['X', 'Y', 'L', 'R'] as const) {
			const entry = loadout.moveset.specials[slot];
			if (entry?.cooldown === undefined) continue;
			cooldowns[cooldownNameForSlot(slot)] = { duration: entry.cooldown };
			count += 1;
		}
		return count === 0 ? null : { cooldowns };
	}

	/**
	 * Create the top-right stack of cooldown HUD icons for each bound
	 * special slot with a cooldown. Icons read straight off the global
	 * CooldownStore so they stay in sync with the handle we pass into
	 * the combat controller.
	 */
	function buildCooldownIcons(
		loadout: CharacterLoadout,
	): Array<ReturnType<typeof createCooldownIcon>> {
		const icons: Array<ReturnType<typeof createCooldownIcon>> = [];
		const slotColor: Record<SpecialSlotId, string> = {
			X: '#cc3333',
			Y: '#ccaa33',
			L: '#3366cc',
			R: '#aa33cc',
		};
		let stackIndex = 0;
		for (const slot of ['X', 'Y', 'L', 'R'] as const) {
			const entry = loadout.moveset.specials[slot];
			if (entry?.cooldown === undefined) continue;
			icons.push(
				createCooldownIcon({
					cooldown: cooldownNameForSlot(slot),
					fillColor: slotColor[slot],
					screenAnchor: 'top-right',
					screenPosition: { x: -10 - stackIndex * 60, y: 10 },
					iconSize: 'sm',
					showTimer: true,
				}),
			);
			stackIndex += 1;
		}
		return icons;
	}

	function installLocalMovement(
		actor: PlayerEntity,
		moveset: CharacterMoveset,
		spawn: { x: number; y: number; z: number },
		cooldowns: CooldownHandle | null,
		deviceId: string,
		entityId: bigint,
		onLocalTransform?: (payload: LocalTransformPayload) => void,
	): void {
		const combat = createCombatController({
			actor,
			stage,
			moveset,
			cooldowns,
			onAttackHit: (info) => attackHitHandler?.(info),
		});

		actor.onUpdate(({ inputs, me, delta }: UpdateContext<any>) => {
			const { p1 } = inputs;
			const horizontal = p1.axes.Horizontal.value;
			const vertical = p1.axes.Vertical.value;

			// Fall-respawn: teleport the wasm capsule back to spawn before
			// any further input processing so the next adapter step
			// integrates from the spawn position. `spawn` was captured
			// from the actor's spawn pose, which is in *feet* coordinates
			// (matches what we sync over the network), so add the feet
			// offset to get the capsule centre that the wasm runtime
			// expects.
			const groupPos = me.group?.position;
			if (groupPos && groupPos.y < FALL_Y_THRESHOLD) {
				platformerAdapter.teleport(
					spawn.x,
					spawn.y + PLAYER_FEET_OFFSET,
					spawn.z,
				);
				fallRespawnHandler?.({ entityId, deviceId, spawn });
			}

			// Combat controller resolves desired horizontal input + jump,
			// zeroing them while an attack/special is locked in. We then
			// forward the resolved values into the wasm adapter \u2014 the
			// arena exposes no run modifier so the run flag stays false.
			const move = combat.tick({ delta, inputs });
			platformerAdapter.pushInput(move.moveX, move.moveZ, move.jump, false);

			// Continue tracking the last non-zero *raw* axis input for
			// facing, even while locked in an action, so the character
			// faces the way they were travelling when the attack began.
			if (Math.abs(horizontal) > 0.2 || Math.abs(vertical) > 0.2) {
				lastMovement.set(horizontal, 0, vertical);
			}
			if (lastMovement.lengthSq() > 0) {
				const yaw = Math.atan2(-lastMovement.x, lastMovement.z);
				platformerAdapter.setFacing(yaw);
			}

			// Action animation (attack/special) wins over the platformer
			// FSM while an action is in-progress; otherwise fall back to
			// the locomotion state mapping.
			const animation =
				combat.currentAnimation() ??
				animationForPlatformerState(platformerAdapter.currentState());
			me.playAnimation(animation);

			if (!onLocalTransform) return;
			// With the wasm adapter the entity has no Rapier body, so read
			// the resolved pose from the player's group (which the adapter
			// wrote during the previous tick's `step`).
			const group = me.group;
			if (!group) return;
			const tr = group.position;
			const q = group.quaternion;
			onLocalTransform({
				position: { x: tr.x, y: tr.y, z: tr.z },
				rotation: { x: q.x, y: q.y, z: q.z, w: q.w },
				scale: {
					x: group.scale.x,
					y: group.scale.y,
					z: group.scale.z,
				},
				animation,
			});
		});
	}

	function spawnAvatar(opts: SpawnAvatarOptions): AvatarRecord {
		const existing = avatars.get(opts.entityId);
		if (existing) return existing;

		const pos = opts.position ?? { x: 0, y: 0, z: 0 };
		const actor = createCharacterActor(
			opts.characterClass,
			opts.color,
			pos,
		) as unknown as PlayerEntity;

		const loadout = getCharacterLoadout(opts.characterClass);

		const nameplate = createText({
			text: formatNameplate(opts.displayName, loadout.stats.maxHp, loadout.stats.maxHp),
			stickToViewport: false,
			fontSize: 22,
			fontColor: '#f5f5f5',
		});

		const record: AvatarRecord = {
			actor,
			nameplate,
			displayName: opts.displayName,
			deviceId: opts.deviceId,
			isLocal: opts.isLocal,
			spawn: { x: pos.x, y: pos.y, z: pos.z },
			hp: loadout.stats.maxHp,
			maxHp: loadout.stats.maxHp,
		};
		avatars.set(opts.entityId, record);

		if (opts.isLocal) {
			localEntityId = opts.entityId;
			localActor = actor;
			// Mark the local actor as runtime-owned so the stage entity
			// delegate skips creating a TS Rapier body for it. The wasm
			// adapter drives its pose from the KCC.
			(actor.options as any).runtime = { simulation: 'runtime' };
			platformerAdapter.setPlayer(actor);
			// Teleport the capsule to the network-authoritative spawn pose
			// (record.spawn is in *feet* coordinates; convert to capsule
			// centre by adding the feet offset).
			platformerAdapter.teleport(
				record.spawn.x,
				record.spawn.y + PLAYER_FEET_OFFSET,
				record.spawn.z,
			);
			const cooldownOpts = buildCooldownOptions(loadout);
			const cd: CooldownHandle | null = cooldownOpts
				? actor.use(CooldownBehavior, cooldownOpts)
				: null;
			mainCamera.cameraRef.target = actor;
			installLocalMovement(
				actor,
				loadout.moveset,
				record.spawn,
				cd,
				opts.deviceId,
				opts.entityId,
				opts.onLocalTransform,
			);
			const cdIcons = buildCooldownIcons(loadout);
			if (cdIcons.length > 0) {
				stage.add(...(cdIcons as unknown as Parameters<typeof stage.add>));
			}
		}

		stage.add(actor, nameplate);
		return record;
	}

	/**
	 * Format a nameplate label combining the display name and HP bar.
	 * Consolidated here so `applyPlayerHp` and `spawnAvatar` can't drift.
	 */
	function formatNameplate(name: string, hp: number, maxHp: number): string {
		return `${name}  ${hp}/${maxHp}`;
	}

	function applyPlayerHp(entityId: bigint, hp: number, maxHp: number): void {
		const rec = avatars.get(entityId);
		if (!rec) return;
		const prevHp = rec.hp;
		rec.hp = hp;
		rec.maxHp = maxHp;
		rec.nameplate.updateText(formatNameplate(rec.displayName, hp, maxHp));
		if (prevHp > 0 && hp === 0) {
			(rec.actor as unknown as {
				playAnimation: (anim: NetworkAnimationState) => void;
			}).playAnimation({ key: 'fallen', pauseAtEnd: true });
		}
	}

	function removeAvatar(entityId: bigint): void {
		const rec = avatars.get(entityId);
		if (!rec || !stage.wrappedStage) return;
		stage.wrappedStage.removeEntityByUuid(rec.actor.uuid);
		stage.wrappedStage.removeEntityByUuid(rec.nameplate.uuid);
		avatars.delete(entityId);
		if (localEntityId === entityId) {
			localEntityId = null;
			localActor = null;
			platformerAdapter.setPlayer(null);
		}
	}

	function reset(): void {
		avatars.clear();
		localEntityId = null;
		localActor = null;
		platformerAdapter.setPlayer(null);
		attackHitHandler = null;
		fallRespawnHandler = null;
		lastMovement.set(0, 0, 0);
	}

	// Position every nameplate just above its actor every frame. Runs on
	// the main stage's update callback, not per-entity, so we only pay a
	// single iteration over the avatars map per tick.
	stage.onUpdate(() => {
		for (const rec of avatars.values()) {
			const g = rec.actor.group;
			const np = rec.nameplate.group;
			if (g && np) {
				np.position.set(g.position.x, g.position.y + 2.6, g.position.z);
			}
		}
	});

	return {
		stage,
		mainCamera,
		avatars,
		getLocalEntityId: () => localEntityId,
		getLocalActor: () => localActor,
		spawnAvatar,
		removeAvatar,
		setAttackHitHandler(handler) {
			attackHitHandler = handler;
		},
		setFallRespawnHandler(handler) {
			fallRespawnHandler = handler;
		},
		applyPlayerHp,
		reset,
	};
}
