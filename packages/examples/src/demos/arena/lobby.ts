import { Color } from 'three';
import {
	type UpdateContext,
	createCamera,
	createPlane,
	createStage,
} from '@zylem/game-lib';
import { subscribe } from 'valtio/vanilla';

import { createCharacterActor } from './characters';
import { arenaLobbyStore } from './networking/arena-lobby-store';

type LobbyStage = ReturnType<typeof createStage>;
type PreviewActor = ReturnType<typeof createCharacterActor>;

/**
 * Position the preview character so its feet sit roughly on the lobby
 * ground (which lives at y = -4). The character art is scaled at 0.02
 * with a ~3.8 unit collision capsule, so the visible mesh sits a hair
 * above the ground at this y.
 */
const PREVIEW_POSITION = { x: 0, y: -3.4, z: 0 } as const;

/** Preview turntable speed in radians per second. */
const PREVIEW_SPIN_SPEED = 0.6;

/**
 * Lobby handle returned by {@link createArenaLobbyStage}. The demo
 * entrypoint passes `stage` into `createGame(...)` and is responsible
 * for invoking `dispose()` on teardown so the valtio subscription
 * doesn't leak across reloads / hot-module swaps.
 */
export interface ArenaLobbyHandle {
	stage: LobbyStage;
	dispose(): void;
}

/**
 * Build the arena's pre-game lobby stage: framed camera, a flat ground
 * plane, and a live 3D preview of the currently-selected character.
 *
 * The preview is rebuilt every time `arenaLobbyStore.characterClass`
 * or `arenaLobbyStore.colorU32` changes. Spawning the actor pre-warms
 * the {@link AssetManager} cache for the character's FBX animations
 * and PBR textures, so the main stage's `spawnAvatar` is a cache hit
 * once the player commits.
 */
export function createArenaLobbyStage(): ArenaLobbyHandle {
	const camera = createCamera({
		position: { x: 1, y: -3, z: 2.9 },
		target: { x: 1, y: -3.3, z: 0 },
	});

	const stage = createStage(
		{
			backgroundColor: new Color(0x111122),
		},
		camera,
	);

	const ground = createPlane({
		tile: { x: 100, y: 100 },
		position: { x: 0, y: -5, z: 0 },
		collision: { static: true },
		randomizeHeight: false,
		material: {
			color: new Color(0x666666),
		},
	});
	stage.add(ground);

	let previewActor: PreviewActor | null = null;
	let lastClass = arenaLobbyStore.characterClass;
	let lastColor = arenaLobbyStore.colorU32;

	const buildPreview = (): PreviewActor => {
		const actor = createCharacterActor(
			arenaLobbyStore.characterClass,
			new Color(arenaLobbyStore.colorU32),
			PREVIEW_POSITION,
		);
		// Skip the TS Rapier body / collider for the preview — the lobby
		// has zero gravity, so we don't need physics here, and avoiding
		// the body keeps the actor exactly at PREVIEW_POSITION.
		(actor.options as { runtime?: { simulation: string } }).runtime = {
			simulation: 'runtime',
		};
		return actor;
	};

	// Initial preview is added to blueprints (stage isn't loaded yet); the
	// engine spawns it during stage setup using the latest store snapshot.
	previewActor = buildPreview();
	stage.add(previewActor);

	let unsubscribe: (() => void) | null = null;

	stage.onSetup(() => {
		unsubscribe?.();
		unsubscribe = subscribe(arenaLobbyStore, () => {
			const klass = arenaLobbyStore.characterClass;
			const color = arenaLobbyStore.colorU32;
			if (klass === lastClass && color === lastColor) return;
			lastClass = klass;
			lastColor = color;

			if (!stage.wrappedStage) return;
			if (previewActor) {
				stage.wrappedStage.removeEntityByUuid(previewActor.uuid);
			}
			previewActor = buildPreview();
			stage.add(previewActor);
		});
	});

	stage.onDestroy(() => {
		unsubscribe?.();
		unsubscribe = null;
	});

	stage.onUpdate(({ delta }: UpdateContext<any>) => {
		const group = previewActor?.group;
		if (!group) return;
		group.rotation.y += delta * PREVIEW_SPIN_SPEED;
	});

	return {
		stage,
		dispose() {
			unsubscribe?.();
			unsubscribe = null;
			previewActor = null;
		},
	};
}
