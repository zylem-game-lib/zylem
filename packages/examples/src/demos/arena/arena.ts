/// <reference types="@zylem/assets" />

import { type UpdateContext, createGame } from '@zylem/game-lib/core';
import { getGlobal, setGlobal } from '@zylem/game-lib/globals';
import {
	arenaLobbyStore,
	getOrCreateArenaDeviceId,
} from './networking/arena-lobby-store';
import { createArenaLobbyStage } from './lobby';
import { createArenaMainStage } from './main-stage/main-stage';
import {
	bootstrapArenaNetwork,
	type ArenaNetworkHandle,
	type BootstrapArenaNetworkConfig,
} from './main-stage/arena-network';
import { isCharacterClass } from './characters';

export default function createDemo() {
	// ─── Lobby ──────────────────────────────────────────────────────────────
	const lobby = createArenaLobbyStage();

	// ─── Main stage ─────────────────────────────────────────────────────────
	const main = createArenaMainStage();

	// One-shot network bootstrap fired from the main stage's first tick.
	// Doing it here (rather than from `createArenaMainStage`) keeps the
	// stage module free of SpacetimeDB knowledge and lets the top-level
	// demo decide when / how to wire networking.
	let networkHandle: ArenaNetworkHandle | null = null;
	let networkBootstrapped = false;
	/** Snapshot taken when the player commits in the lobby; avoids relying on game globals for STDB registration. */
	let pendingArenaNetworkConfig: BootstrapArenaNetworkConfig | null = null;

	main.stage.onUpdate(() => {
		if (networkBootstrapped) return;
		networkBootstrapped = true;

		const snapshot = pendingArenaNetworkConfig;
		pendingArenaNetworkConfig = null;

		const deviceId =
			snapshot?.deviceId.trim() ||
			getGlobal<string>('arenaDeviceId')?.trim() ||
			getOrCreateArenaDeviceId();
		const displayName =
			snapshot?.displayName ??
			getGlobal<string>('arenaDisplayName') ??
			'Player';
		const colorU32 =
			snapshot?.colorU32 ??
			getGlobal<number>('arenaColorU32') ??
			0xffffffff;
		const rawClass =
			snapshot?.characterClass ?? getGlobal<string>('arenaCharacterClass');
		const characterClass = isCharacterClass(rawClass) ? rawClass : 'tank';

		networkHandle = bootstrapArenaNetwork(main, {
			deviceId,
			displayName,
			colorU32,
			characterClass,
		});
	});

	main.stage.onDestroy(() => {
		networkHandle?.reset();
		networkHandle = null;
		networkBootstrapped = false;
		pendingArenaNetworkConfig = null;
		main.reset();
		lobby.dispose();
	});

	// ─── Game ───────────────────────────────────────────────────────────────
	const game = createGame(
		{
			id: 'arena',
			debug: true,
			resolution: {
				width: 800,
				height: 600,
			},
			mobile: {
				resolution: {
					width: 800,
					height: 600,
				},
				controls: {
					buttons: ['A', 'B', 'X', 'Y'],
				},
			},
			globals: {
				arenaDeviceId: '',
				arenaDisplayName: '',
				arenaColorU32: 0xfff,
				arenaCharacterClass: 'tank',
			},
		},
		lobby.stage,
		main.stage,
	);

	// Advance from lobby → main stage once the user commits in the
	// character-select overlay. Guarded so we don't re-advance after
	// `nextStage()` has already run.
	let lobbyAdvanced = false;
	game.onUpdate((ctx: UpdateContext<any>) => {
		if (lobbyAdvanced) return;
		if (!arenaLobbyStore.joinRequested) return;
		const name = arenaLobbyStore.displayName.trim();
		if (!name) return;
		const dev = arenaLobbyStore.deviceId || getOrCreateArenaDeviceId();
		const characterClass = isCharacterClass(arenaLobbyStore.characterClass)
			? arenaLobbyStore.characterClass
			: 'tank';
		pendingArenaNetworkConfig = {
			deviceId: dev,
			displayName: name,
			colorU32: arenaLobbyStore.colorU32,
			characterClass,
		};
		setGlobal('arenaDeviceId', dev);
		setGlobal('arenaDisplayName', name);
		setGlobal('arenaColorU32', arenaLobbyStore.colorU32);
		setGlobal('arenaCharacterClass', characterClass);
		lobbyAdvanced = true;
		arenaLobbyStore.joinRequested = false;
		ctx.game?.nextStage();
	});

	return game;
}
