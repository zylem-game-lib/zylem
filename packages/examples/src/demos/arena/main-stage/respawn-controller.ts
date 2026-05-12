import { Vector2, Vector3 } from 'three';
import type { CameraBehavior, CameraContext, CameraPose } from '@zylem/game-lib/core';
import { createText } from '@zylem/game-lib/entity';
import type { Platformer3DRuntimeAdapter } from '../../../runtime/platformer-3d-runtime';
import type { ArenaMainStageHandle, FallRespawnPayload } from './main-stage';

/**
 * Total seconds spent in the death sequence before the local player is
 * teleported back to spawn and the respawn reducer is fired. Kept as a
 * module-level constant so the HUD countdown, the camera pull-back lerp,
 * and the timer-expiry trigger can't drift apart.
 */
export const RESPAWN_DURATION_SECONDS = 10;

/**
 * Maximum extra **radial** distance (world units) the death camera adds on
 * top of the third-person base pose's offset from `lookAt`. Reads as a
 * cinematic dolly-out around the corpse.
 */
const PULLBACK_EXTRA_RADIAL = 12;

/**
 * Maximum extra **height** (world units) added to the camera Y while dying.
 * Pairs with {@link PULLBACK_EXTRA_RADIAL} so the framing tilts down toward
 * the corpse instead of just sliding straight back along the same line.
 */
const PULLBACK_EXTRA_HEIGHT = 8;

const PULLBACK_BEHAVIOR_KEY = 'arena-respawn-pullback';

/**
 * What the controller needs from the rest of the arena to drive the
 * sequence. Passed once at construction so the controller stays
 * framework-agnostic — it never reaches into `main-stage.ts` directly.
 */
export interface RespawnControllerDeps {
	/** Stage handle: used to register the HUD entity and read `wrappedStage` for cleanup. */
	stage: ArenaMainStageHandle['stage'];
	/** Follow camera that frames the local player; we splice in / out a `respawn-pullback` behavior. */
	camera: ArenaMainStageHandle['mainCamera'];
	/**
	 * Wasm KCC adapter for the local capsule. We call `teleport` at timer
	 * expiry so the corpse doesn't stay in place after the respawn reducer
	 * fires (the network update would arrive a tick later, leaving a brief
	 * "dead body in middle of arena" frame).
	 */
	platformerAdapter: Platformer3DRuntimeAdapter;
	/**
	 * Bridge to the network layer's `setFallRespawnHandler` sink — both fall
	 * and death respawns ultimately fire the same `respawn_player` reducer.
	 * Returns `null` in offline mode (no STDB connection); the controller
	 * simply skips the network call in that case.
	 */
	getFallRespawnHandler(): ((info: FallRespawnPayload) => void) | null;
	/**
	 * Optional hook fired at timer-expiry, *after* the local KCC has been
	 * teleported back to spawn but *before* the controller unlocks input.
	 * Lets the consumer clear any presentation state (e.g. the lying-down
	 * model offset) without waiting for the server's HP refill to land —
	 * otherwise the standing-pose model would render half-buried for a
	 * round-trip's worth of frames.
	 */
	onLocalRespawn?(): void;
}

/**
 * One-shot context required to start a death sequence: who died and where
 * they should respawn. The controller doesn't read STDB or globals on its
 * own, so the caller (the local-player HP transition handler) owns the
 * snapshot.
 */
export interface RespawnStartOptions {
	entityId: bigint;
	deviceId: string;
	spawn: { x: number; y: number; z: number };
}

type RespawnState = 'idle' | 'counting';

/**
 * Local-player death / respawn lifecycle owner.
 *
 * Drives three coordinated effects while the local player is dead:
 *  - a sticky HUD countdown ("RESPAWNING IN Ns")
 *  - a third-person camera pull-back (cinematic dolly-out around the corpse)
 *  - input lock (callers gate `installLocalMovement` on {@link isActive})
 *
 * At timer expiry we fire the `respawn_player` reducer (via the network
 * sink), locally teleport the wasm capsule, and clear all UI / camera
 * state immediately so the player resumes control without waiting for the
 * round-trip server HP confirmation. The controller is idempotent: a
 * subsequent `applyPlayerHp(maxHp)` from STDB just lands as a no-op
 * thanks to the `prevHp > 0 && hp === 0` guard upstream.
 */
export interface RespawnController {
	/** Begin the death sequence (call when local HP first hits 0). */
	start(opts: RespawnStartOptions): void;
	/**
	 * Cancel an in-progress sequence (e.g. an ally healed the local
	 * player back above 0 before the timer expired). Tears down the
	 * camera behavior + HUD without firing the reducer.
	 */
	cancel(): void;
	/** Per-frame tick. Drives the timer + HUD text. */
	tick(delta: number): void;
	/** True while the local player is dead and input should be ignored. */
	isActive(): boolean;
	/** Tear down completely (call from stage `reset`). */
	reset(): void;
}

/**
 * Smoothstep ease used by the camera pull-back. Polynomial ease keeps the
 * dolly feeling cinematic — fast in the first half, slow into the held
 * end pose — without needing a full easing library.
 */
function smoothstep(t: number): number {
	const c = Math.max(0, Math.min(1, t));
	return c * c * (3 - 2 * c);
}

/**
 * Build a {@link CameraBehavior} that pushes the camera radially outward
 * from `pose.lookAt` and lifts it slightly, ramping the offset over the
 * configured death duration via `getElapsed()`.
 *
 * The behavior runs *after* the third-person perspective so it gets the
 * follow-cam's resolved pose and only applies an additive offset; this
 * way the camera still frames the corpse (the wasm KCC's last position)
 * even though the controller moved the capsule at timer expiry.
 */
function createPullbackBehavior(getElapsed: () => number): CameraBehavior {
	const tmpDir = new Vector3();
	return {
		// Run after the perspective + any follow behaviors so we modify the
		// resolved follow-cam pose instead of fighting it.
		priority: 100,
		update(_ctx: CameraContext, pose: CameraPose): CameraPose {
			const t = smoothstep(getElapsed() / RESPAWN_DURATION_SECONDS);
			if (t <= 0) return pose;

			const lookAt = pose.lookAt ?? new Vector3();
			tmpDir.copy(pose.position).sub(lookAt);
			const len = tmpDir.length();
			// `len === 0` would happen only if the camera and target were
			// coincident (shouldn't, but be defensive — multiplying a zero
			// vector skips the radial push and we still apply the height).
			if (len > 1e-4) {
				tmpDir.multiplyScalar(PULLBACK_EXTRA_RADIAL * t / len);
			} else {
				tmpDir.set(0, 0, 0);
			}
			const newPos = pose.position.clone().add(tmpDir);
			newPos.y += PULLBACK_EXTRA_HEIGHT * t;
			return { ...pose, position: newPos };
		},
	};
}

/**
 * Construct a {@link RespawnController}. The controller takes ownership of
 * its HUD entity, camera behavior key, and timer state — call `reset()` on
 * stage teardown so reloads don't leak the sticky HUD into the next run.
 */
export function createRespawnController(deps: RespawnControllerDeps): RespawnController {
	const { stage, camera, platformerAdapter, getFallRespawnHandler, onLocalRespawn } = deps;

	let state: RespawnState = 'idle';
	let elapsed = 0;
	let active: RespawnStartOptions | null = null;
	/** Sticky-to-viewport HUD entity (created on `start`, removed on `cancel`/expiry). */
	let hud: ReturnType<typeof createText> | null = null;
	/** Last integer-second value pushed into the HUD; avoids per-frame canvas redraws. */
	let lastShownSecond = -1;

	function buildHud(): ReturnType<typeof createText> {
		// `screenPosition` in the 0..1 range is treated as a viewport
		// fraction by `ZylemText`, so this anchors the HUD to the upper
		// third of the screen regardless of resolution.
		return createText({
			text: formatHudText(RESPAWN_DURATION_SECONDS),
			stickToViewport: true,
			screenPosition: new Vector2(0.5, 0.28),
			fontSize: 42,
			fontColor: '#ff6b6b',
			padding: 12,
		});
	}

	function formatHudText(secondsRemaining: number): string {
		const clamped = Math.max(0, Math.ceil(secondsRemaining));
		return `RESPAWNING IN ${clamped}`;
	}

	function teardownVisuals(): void {
		camera.removeBehavior(PULLBACK_BEHAVIOR_KEY);
		if (hud) {
			// `removeEntityByUuid` only calls `scene.remove(group)`, but
			// sticky text entities parent their `group` to
			// `cameraRef.camera` (see `ZylemText.textSetup`), so the
			// scene-level remove is a no-op and the sprite would keep
			// rendering on the camera after respawn. Detach explicitly
			// first; the lifecycle removal then just unhooks the stage
			// bookkeeping.
			hud.group?.removeFromParent();
			if (stage.wrappedStage) {
				stage.wrappedStage.removeEntityByUuid(hud.uuid);
			}
		}
		hud = null;
		lastShownSecond = -1;
	}

	function start(opts: RespawnStartOptions): void {
		// Idempotent: re-starting while already counting just refreshes
		// the spawn pose (in case the player respawned at a new location
		// between deaths). Avoids double-installing the camera behavior.
		if (state === 'counting') {
			active = opts;
			return;
		}
		state = 'counting';
		elapsed = 0;
		active = opts;
		hud = buildHud();
		stage.add(hud);
		camera.addBehavior(PULLBACK_BEHAVIOR_KEY, createPullbackBehavior(() => elapsed));
	}

	function cancel(): void {
		if (state === 'idle') return;
		state = 'idle';
		elapsed = 0;
		active = null;
		teardownVisuals();
	}

	function fireRespawnAndUnlock(): void {
		const snap = active;
		state = 'idle';
		elapsed = 0;
		active = null;
		teardownVisuals();
		if (!snap) return;

		// Local teleport first so the corpse doesn't visibly linger at
		// the death location before the network round-trip. The wasm
		// KCC owns the local capsule's pose, so this is the only way to
		// move it without going through STDB.
		platformerAdapter.teleport(snap.spawn.x, snap.spawn.y, snap.spawn.z);

		// Clear any presentation overrides (lying-down model offset,
		// etc.) before the next frame's `installLocalMovement` flips
		// the animation back to `idle`; otherwise the standing pose
		// would briefly render at the dropped offset until the server
		// echo lands.
		onLocalRespawn?.();

		const handler = getFallRespawnHandler();
		handler?.({
			entityId: snap.entityId,
			deviceId: snap.deviceId,
			spawn: snap.spawn,
		});
	}

	function tick(delta: number): void {
		if (state !== 'counting') return;
		elapsed += delta;
		const remaining = RESPAWN_DURATION_SECONDS - elapsed;

		if (remaining <= 0) {
			fireRespawnAndUnlock();
			return;
		}

		// Only repaint the HUD canvas when the displayed integer second
		// actually changes. `createText` redraws to a CanvasTexture, so
		// gating this saves a texture upload every frame.
		const secondNow = Math.ceil(remaining);
		if (secondNow !== lastShownSecond) {
			lastShownSecond = secondNow;
			hud?.updateText(formatHudText(remaining));
		}
	}

	function isActive(): boolean {
		return state !== 'idle';
	}

	function reset(): void {
		state = 'idle';
		elapsed = 0;
		active = null;
		teardownVisuals();
	}

	return { start, cancel, tick, isActive, reset };
}
