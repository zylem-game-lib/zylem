import { nanoid } from 'nanoid';
import { proxy } from 'valtio';

const DEVICE_KEY = 'zylem-four-characters-device-id';

/**
 * Shared lobby state for the four-characters-plane demo (Solid overlay + Zylem stages).
 */
export const fourCharLobbyStore = proxy({
  deviceId: '',
  displayName: '',
  /** Packed 0xAARRGGBB for `register_player.color_u32`. */
  colorU32: 0xff4a90e2,
  joinRequested: false,
  /** True after the user dismisses the lobby (Enter). */
  lobbyDismissed: false,
});

export function getOrCreateFourCharDeviceId(): string {
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

export function ensureFourCharDeviceId(): string {
  const id = getOrCreateFourCharDeviceId();
  fourCharLobbyStore.deviceId = id;
  return id;
}

export function resetFourCharLobbyForExampleSwitch(): void {
  fourCharLobbyStore.joinRequested = false;
  fourCharLobbyStore.lobbyDismissed = false;
  fourCharLobbyStore.displayName = '';
  fourCharLobbyStore.deviceId = '';
}
