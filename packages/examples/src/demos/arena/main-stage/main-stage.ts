import { Color, Vector3 } from 'three';
import { CooldownBehavior, type CooldownHandle } from '@zylem/game-lib/behavior';
import { type UpdateContext, createCamera, createStage, setCameraFeed, type StageEntity } from '@zylem/game-lib/core';
import { createBox, createFog, createPlane, createText } from '@zylem/game-lib/entity';
import { useArrowsForAxes } from '@zylem/game-lib/input';
import { ZylemRuntimePlatformer3DFsmState } from '@zylem/game-lib/runtime';
import {
	Platformer3DRuntimeAdapter,
	buildPlatformerGroundHeightfield,
	staticBoxFromEntity,
} from '../../../runtime/platformer-3d-runtime';
import { TransformableEntity } from '~/lib/actions/capabilities/apply-transform';
import { GameEntity } from '~/lib/entities';
import {
	type CharacterClass,
	createCharacterActor,
	getCharacterLoadout,
} from '../characters';
import type { CharacterMoveset } from '../characters/movesets';
import {
	buildActionCooldownOptions,
	buildActionIcons,
} from '../characters/hud-icons';
import { arenaTSL } from './stage-background.tsl';
import { createDoodads } from './doodads';
import {
	createCombatController,
	type ReportAttackHit,
	type ReportHealEffect,
} from './combat-controller';
import {
	createRespawnController,
	type RespawnController,
} from './respawn-controller';
import { demoAsset } from '../../../assets/manifest';

const groundTextureUrl = demoAsset('arena/images/ground.png');

export type PlayerEntity = TransformableEntity & GameEntity<any> & StageEntity;

/**
 * Per-avatar bookkeeping kept on the main stage: the 3D actor, its floating
 * nameplate, the source device id (for remote/local disambiguation), and a
 * flag marking the locally-controlled avatar.
 */
export interface AvatarRecord {
	actor: PlayerEntity;
	/**
	 * Sibling loading-indicator entity spawned alongside the actor. The
	 * indicator self-fades once the actor is presentable, but it stays
	 * registered with the stage until {@link removeAvatar} cleans it up.
	 */
	loadingIndicator: GameEntity<any>;
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

/**
 * Payload emitted when a local heal effect resolves: the precomputed
 * list of `device_id`s the network layer should call `heal_player` on,
 * and the per-recipient HP amount. The recipient list is computed in
 * the main stage (which already owns the `avatars` map for radius
 * checks) so the network layer can stay a thin reducer adapter.
 */
export interface HealRequestPayload {
	recipients: string[];
	amount: number;
}

export interface ArenaMainStageHandle {
	/** Fluent stage wrapper returned by `createStage`. */
	stage: StageHandle;
	/** Follow camera attached to the main stage. */
	mainCamera: ReturnType<typeof createCamera>;
	/** Live lookup of rendered avatars, keyed by STDB entity id. */
	avatars: Map<bigint, AvatarRecord>;
	/**
	 * Sample the bowl heightfield at world `(x, z)` and return the world-Y
	 * of the visible ground at that point. Used by the enemies subsystem so
	 * iguanos sit / walk on the actual terrain instead of a fixed altitude.
	 */
	sampleGroundHeight(x: number, z: number): number;
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
	 * Register (or clear) a sink for local-player heal-effect events.
	 * The network layer fans these out to `heal_player` reducer calls
	 * — one per recipient — so the server applies the HP increment
	 * with proper `max_hp` clamping.
	 */
	setHealRequestHandler(handler: ((info: HealRequestPayload) => void) | null): void;
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
 * Inputs for {@link createGroundHeightSampler}: the same height grid +
 * tile + plane-position trio that builds the visible ground plane.
 * Keeping them as a struct (instead of three positional args) makes
 * the call site at the top of `createArenaMainStage` self-documenting.
 */
interface GroundHeightSamplerOptions {
	heightMap2D: number[][];
	tile: { x: number; y: number };
	position: { x: number; y: number; z: number };
}

/**
 * Build a sampler that returns the world-space ground height at any
 * `(x, z)` over the bowl. The heightfield is laid out in
 * `heightMap2D[zIdx][xIdx]` order with vertex spacing
 * `tile.{x,y} / subdivisions`; the sampler clamps out-of-bounds
 * queries to the nearest grid cell so doodads slightly outside the
 * authored layout still get a sensible spawn pose. Bilinear smoothing
 * is intentionally skipped — the doodads only need to know roughly
 * where to drop from, not the exact subpixel height of the visible
 * heightfield.
 */
function createGroundHeightSampler(
	options: GroundHeightSamplerOptions,
): (x: number, z: number) => number {
	const { heightMap2D, tile, position } = options;
	const rowsZ = heightMap2D.length;
	const colsX = rowsZ > 0 ? (heightMap2D[0]?.length ?? 0) : 0;

	if (rowsZ === 0 || colsX === 0) {
		// Degenerate heightmap → fall back to a flat plane so doodad
		// placement doesn't blow up on a malformed config. Returning
		// just the plane's Y matches a heightmap of all zeros.
		return () => position.y;
	}

	const subdivisionsX = colsX - 1;
	const subdivisionsZ = rowsZ - 1;
	const halfTileX = tile.x / 2;
	const halfTileZ = tile.y / 2;

	return (x, z) => {
		const u = (x - position.x + halfTileX) / tile.x;
		const v = (z - position.z + halfTileZ) / tile.y;
		const xIdx = Math.max(0, Math.min(subdivisionsX, Math.round(u * subdivisionsX)));
		const zIdx = Math.max(0, Math.min(subdivisionsZ, Math.round(v * subdivisionsZ)));
		return position.y + (heightMap2D[zIdx]?.[xIdx] ?? 0);
	};
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
	// know about the heightfield + jumbotron walls so it stops the
	// local player at the same surfaces the renderer shows.
	const GROUND_PLANE_TILE = { x: 100, y: 100 } as const;
	const GROUND_PLANE_SUBDIVISIONS = 40;
	const GROUND_PLANE_POSITION = { x: 0, y: -4, z: 0 } as const;
	const groundHeightMap = createArenaBowlHeightMap({
		subdivisions: GROUND_PLANE_SUBDIVISIONS,
		innerRadius: 0.35,
		bumpAmplitude: 0.35,
		edgeAmplitude: 4.5,
	});

	const groundPlane = createPlane({
		tile: GROUND_PLANE_TILE,
		position: GROUND_PLANE_POSITION,
		collision: { static: true },
		// 2D absolute-height grid: flat-ish play area in the middle, hills
		// pushing up toward the edges to form an arena "bowl".
		heightMap2D: groundHeightMap,
		material: {
			path: groundTextureUrl,
			repeat: { x: 10, y: 10 },
		},
	});

	const sampleGroundHeight = createGroundHeightSampler({
		heightMap2D: groundHeightMap,
		tile: GROUND_PLANE_TILE,
		position: GROUND_PLANE_POSITION,
	});

	// Static scenery doodad layout (replaces the legacy static-sphere
	// boulders). Every doodad is anchored to the ground heightfield at
	// its authored `(x, z)`, slightly embedded so the visible mesh
	// reads as half-buried, and exposes a pre-built static AABB that
	// we seed into the wasm KCC below so the local player is blocked
	// from walking through them from frame 0.
	const doodads = createDoodads({ sampleGroundHeight });

	// ─── Jumbotron: back-wall mega-screen with a broadcast feed ─────────────
	//
	// Positioned on the -Z edge of the arena so it's always visible in the
	// default camera framing. The screen mesh becomes a camera feed target
	// via `setCameraFeed`, and we rotate the jumbotron camera slowly around
	// the origin so remote players see an orbit-shot of the action.
	const JUMBO_POS_Z = -50;
	const JUMBO_WIDTH = 56;
	const JUMBO_HEIGHT = JUMBO_WIDTH * (9 / 16);
	const JUMBO_SCREEN_Y = 16;

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
	const PLAYER_CAPSULE = { halfHeight: 0.5, radius: 0.5 } as const;
	//const PLAYER_FEET_OFFSET = 5;//PLAYER_CAPSULE.halfHeight;

	const groundHeightfield = buildPlatformerGroundHeightfield(groundPlane);
	const staticColliders = [
		// Doodads are static from the start — their AABBs are ready at
		// `createDoodads(...)` time and seeded into the KCC here so the
		// local player is blocked at every doodad's footprint from
		// frame 0 (no drop-and-settle dance).
		...doodads.staticColliders,
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
			backgroundShader: arenaTSL,
			runtimeAdapter: platformerAdapter,
		},
		mainCamera,
		jumbotronCamera,
	).setInputConfiguration(useArrowsForAxes('p1'));

	stage.add(groundPlane, ...doodads.entities);
	// stage.add(jumbotronScreen, jumbotronFrame);

	// Light purple-red atmosphere fog. Linear distance falloff keeps the
	// center of the arena clear while the far rim of the bowl fades into
	// mist; a gentle height mask anchors the densest fog to the ground so
	// the sky still reads as the background shader, and a slow noise term
	// gives the haze some drift instead of looking like a static gradient.
	stage.add(createFog({
		type: 'exp2',
		color: '#c79ab0',
		density: 0.03,
		start: 0,
		end: 110,
		height: { enabled: true, level: 10, falloff: 0.12 },
		noise: { scale: 0.04, strength: 0.18, speed: 0.08 },
	}));

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
	let healRequestHandler: ((info: HealRequestPayload) => void) | null = null;
	const lastMovement = new Vector3();

	/**
	 * Squared XZ radius used to pick eligible heal recipients around
	 * the caster (heals are AoE around self). 6 m feels generous
	 * without letting healers run off and top up teammates from across
	 * the bowl — see the {@link AskQuestion} balance question that
	 * authored this value.
	 */
	const HEAL_AOE_RADIUS = 6;
	const HEAL_AOE_RADIUS_SQ = HEAL_AOE_RADIUS * HEAL_AOE_RADIUS;

	/**
	 * Resolve the avatars within the heal AoE of `caster` and emit a
	 * single `HealRequestPayload` to the network layer with their
	 * device ids. Dead players (hp === 0) are filtered out — they
	 * require a respawn flow, not a top-up. Done in the main stage so
	 * the network layer stays a one-line reducer adapter.
	 */
	function resolveHealHit(caster: AvatarRecord, info: { position: { x: number; y: number; z: number }; amount: number }): void {
		if (!healRequestHandler) return;
		const recipients: string[] = [];
		for (const peer of avatars.values()) {
			if (peer.hp <= 0) continue;
			const g = peer.actor.group;
			if (!g) continue;
			const dx = g.position.x - info.position.x;
			const dz = g.position.z - info.position.z;
			if (dx * dx + dz * dz > HEAL_AOE_RADIUS_SQ) continue;
			recipients.push(peer.deviceId);
		}
		if (recipients.length === 0) return;
		healRequestHandler({ recipients, amount: info.amount });
		// Mark `caster` so the unused-parameter lint doesn't pick a fight.
		// The reference is here intentionally so future per-class scaling
		// (e.g. caster class multiplier) has a hook to read from.
		void caster;
	}

	/**
	 * Lying-down model drop (world units). The character FBX rigs author
	 * the hips bone Y as a *calibration* — its bind-pose value places the
	 * hip at standing-hip-height-in-world so the body geometry hangs down
	 * to put visible feet at the group origin (see
	 * `stripClipRootMotion`'s doc). When the `fallen` clip rotates the
	 * skeleton horizontal, the bones still emanate from the hip pivot,
	 * which is now suspended ~half-a-character-height above the ground —
	 * so the lying body reads as floating in mid-air. Translating the
	 * loaded FBX child down by this offset (scaled out of the actor's
	 * 0.02× scale by dividing by `group.scale.y`) snaps the corpse onto
	 * the ground without touching the wasm-KCC-owned group transform.
	 */
	const FALLEN_BODY_DROP_WORLD = 0.5;

	/**
	 * Apply (or clear) the fallen-pose visual drop on an avatar's loaded
	 * model child. Safe to call before the FBX finishes loading — it
	 * just no-ops when `actor.object` isn't ready yet, and the next
	 * call after load (e.g. a HUD HP refresh) will catch up.
	 */
	function setFallenDeathPose(actor: PlayerEntity, dead: boolean): void {
		const a = actor as unknown as {
			object: { position: { y: number } } | null;
			group: { scale: { y: number } } | null;
		};
		const model = a.object;
		const group = a.group;
		if (!model || !group) return;
		const scaleY = group.scale.y || 1;
		model.position.y = dead ? -FALLEN_BODY_DROP_WORLD / scaleY : 0;
	}

	// Local-player death-respawn lifecycle. Wires its own per-frame tick
	// into the main stage update so the timer runs even when input is
	// locked. Re-uses `fallRespawnHandler` for the actual reducer call
	// since both fall-respawn and death-respawn end up firing
	// `respawn_player` with the same payload shape.
	const respawnController: RespawnController = createRespawnController({
		stage,
		camera: mainCamera,
		platformerAdapter,
		getFallRespawnHandler: () => fallRespawnHandler,
		onLocalRespawn: () => {
			// Lift the model out of the lying-down offset immediately so
			// the standing pose that comes back next frame doesn't render
			// half-buried while we wait for the server's HP echo.
			if (localActor) setFallenDeathPose(localActor, false);
		},
	});
	stage.onUpdate(({ delta }: UpdateContext<any>) => {
		respawnController.tick(delta);
	});

	/**
	 * Y-axis threshold below which the local actor is considered to have
	 * fallen off the arena. Teleports back to their spawn pose.
	 */
	const FALL_Y_THRESHOLD = -20;

	function installLocalMovement(
		actor: PlayerEntity,
		moveset: CharacterMoveset,
		spawn: { x: number; y: number; z: number },
		cooldowns: CooldownHandle | null,
		deviceId: string,
		entityId: bigint,
		onLocalTransform?: (payload: LocalTransformPayload) => void,
	): void {
		const onHealEffect: ReportHealEffect = (info) => {
			// `localEntityId` is set by `spawnAvatar` for the local
			// player before this update loop ever runs, so the lookup
			// is safe; bail defensively if a stage tear-down race lost
			// the record.
			if (localEntityId === null) return;
			const caster = avatars.get(localEntityId);
			if (!caster) return;
			resolveHealHit(caster, info);
		};
		const combat = createCombatController({
			actor,
			stage,
			moveset,
			cooldowns,
			onAttackHit: (info) => {
				// Network-aware enemy damage path (when the network
				// layer has wired up `setAttackHitHandler`). Doodads
				// are static scenery now, so hits don't route to them.
				attackHitHandler?.(info);
			},
			onHealEffect,
		});

		actor.onUpdate(({ inputs, me, delta }: UpdateContext<any>) => {
			const { p1 } = inputs;
			const horizontal = p1.axes.Horizontal.value;
			const vertical = p1.axes.Vertical.value;

			// Death lock: while the local player is in the respawn
			// sequence we drop all player input, skip the combat
			// pipeline, and emit a held `fallen` animation so peers and
			// our own per-frame transform broadcast stay consistent
			// with the corpse pose. The controller drives its own
			// camera pull-back / HUD timer on the stage update.
			if (respawnController.isActive()) {
				platformerAdapter.pushInput(0, 0, false, false);
				if (onLocalTransform) {
					const group = me.group;
					if (group) {
						const tr = group.position;
						const q = group.quaternion;
						onLocalTransform({
							position: { x: tr.x, y: tr.y, z: tr.z },
							rotation: { x: q.x, y: q.y, z: q.z, w: q.w },
							scale: { x: group.scale.x, y: group.scale.y, z: group.scale.z },
							animation: { key: 'fallen', pauseAtEnd: true },
						});
					}
				}
				return;
			}

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
					spawn.y,
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
		const presenter = createCharacterActor(
			opts.characterClass,
			opts.color,
			pos,
		);
		const actor = presenter.actor as unknown as PlayerEntity;
		const loadingIndicator = presenter.indicator as unknown as GameEntity<any>;

		const loadout = getCharacterLoadout(opts.characterClass);

		const nameplate = createText({
			text: formatNameplate(opts.displayName, loadout.stats.maxHp, loadout.stats.maxHp),
			stickToViewport: false,
			fontSize: 22,
			fontColor: '#f5f5f5',
		});

		const record: AvatarRecord = {
			actor,
			loadingIndicator,
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
				record.spawn.y,
				record.spawn.z,
			);
			const cooldownOpts = buildActionCooldownOptions(loadout);
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
			const cdIcons = buildActionIcons(loadout);
			if (cdIcons.length > 0) {
				stage.add(...(cdIcons as unknown as Parameters<typeof stage.add>));
			}
		}

		stage.add(actor, loadingIndicator, nameplate);
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
		const justDied = prevHp > 0 && hp === 0;
		const justRevived = prevHp === 0 && hp > 0;
		if (justDied) {
			(rec.actor as unknown as {
				playAnimation: (anim: NetworkAnimationState) => void;
			}).playAnimation({ key: 'fallen', pauseAtEnd: true });
			// Drop the visible model onto the ground so the lying-down
			// pose doesn't render at hip-height (see
			// `FALLEN_BODY_DROP_WORLD`). Applies to every avatar so
			// peers don't see floating corpses either.
			setFallenDeathPose(rec.actor, true);
		} else if (justRevived) {
			setFallenDeathPose(rec.actor, false);
		}
		// Local-player only: drive the death-respawn lifecycle. Remote
		// avatars play `fallen` (above) and hold pose, but the camera
		// pull-back / HUD timer / input lock are strictly local effects.
		if (rec.isLocal) {
			if (justDied) {
				respawnController.start({
					entityId,
					deviceId: rec.deviceId,
					spawn: rec.spawn,
				});
			} else if (justRevived) {
				// Heal-before-timer-expiry path (ally heal, etc). The
				// reducer-driven respawn flow clears state itself, so
				// this is the only way the controller learns about an
				// early revive.
				respawnController.cancel();
			}
		}
	}

	function removeAvatar(entityId: bigint): void {
		const rec = avatars.get(entityId);
		if (!rec || !stage.wrappedStage) return;
		stage.wrappedStage.removeEntityByUuid(rec.actor.uuid);
		stage.wrappedStage.removeEntityByUuid(rec.loadingIndicator.uuid);
		stage.wrappedStage.removeEntityByUuid(rec.nameplate.uuid);
		avatars.delete(entityId);
		if (localEntityId === entityId) {
			// Local actor going away mid-death (disconnect, stage tear-
			// down): drop the HUD + camera behavior so they don't leak.
			respawnController.reset();
			localEntityId = null;
			localActor = null;
			platformerAdapter.setPlayer(null);
		}
	}

	function reset(): void {
		respawnController.reset();
		avatars.clear();
		localEntityId = null;
		localActor = null;
		platformerAdapter.setPlayer(null);
		attackHitHandler = null;
		fallRespawnHandler = null;
		healRequestHandler = null;
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
				np.position.set(g.position.x, g.position.y, g.position.z);
			}
		}
	});

	return {
		stage,
		mainCamera,
		avatars,
		sampleGroundHeight,
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
		setHealRequestHandler(handler) {
			healRequestHandler = handler;
		},
		applyPlayerHp,
		reset,
	};
}
