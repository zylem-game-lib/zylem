import { nanoid } from 'nanoid';
import { proxy } from 'valtio/vanilla';

const DEVICE_KEY = 'zylem-multiplayer-lobby-device-id';

/**
 * Shared lobby state for the multiplayer-lobby demo (Solid overlay + Zylem stages).
 */
export const multiplayerLobbyStore = proxy({
  deviceId: '',
  displayName: '',
  /** Packed 0xAARRGGBB for `register_player.color_u32`. */
  colorU32: 0xff4a90e2,
  joinRequested: false,
  /** True after the user dismisses the lobby (Enter). */
  lobbyDismissed: false,
});

export function getOrCreateMultiplayerLobbyDeviceId(): string {
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

export function ensureMultiplayerLobbyDeviceId(): string {
  const id = getOrCreateMultiplayerLobbyDeviceId();
  multiplayerLobbyStore.deviceId = id;
  return id;
}

export function resetMultiplayerLobbyForExampleSwitch(): void {
  multiplayerLobbyStore.joinRequested = false;
  multiplayerLobbyStore.lobbyDismissed = false;
  multiplayerLobbyStore.displayName = '';
  multiplayerLobbyStore.deviceId = '';
}
