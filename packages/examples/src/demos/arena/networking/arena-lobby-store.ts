import { nanoid } from 'nanoid';
import { proxy } from 'valtio';
import type { CharacterClass } from '../characters';

const DEVICE_KEY = 'zylem-arena-device-id';

/**
 * Shared lobby state for the arena demo (Solid overlay + Zylem stages).
 */
export const arenaLobbyStore = proxy({
	deviceId: '',
	displayName: '',
	/** Packed 0xAARRGGBB for `register_player.color_u32`. */
	colorU32: 0xffffff,
	characterClass: 'tank' as CharacterClass,
	joinRequested: false,
	/** True after the user dismisses the lobby (Enter). */
	lobbyDismissed: false,
});

export function getOrCreateArenaDeviceId(): string {
	if (typeof localStorage === 'undefined') {
		return `dev-${nanoid()}`;
	}
	let id = localStorage.getItem(DEVICE_KEY);
	if (!id) {
		id = nanoid();
		localStorage.setItem(DEVICE_KEY, id);
	}
	return id;
}

export function ensureArenaDeviceId(): string {
	const id = getOrCreateArenaDeviceId();
	arenaLobbyStore.deviceId = id;
	return id;
}

export function resetArenaLobbyForExampleSwitch(): void {
	arenaLobbyStore.joinRequested = false;
	arenaLobbyStore.lobbyDismissed = false;
	arenaLobbyStore.displayName = '';
	arenaLobbyStore.deviceId = '';
}
