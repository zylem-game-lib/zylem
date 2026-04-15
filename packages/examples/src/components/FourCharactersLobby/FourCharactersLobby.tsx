import {
  type Component,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { subscribe } from 'valtio/vanilla';
import {
  ensureFourCharDeviceId,
  fourCharLobbyStore,
} from '../../demos/four-characters-lobby-store';
import styles from './FourCharactersLobby.module.css';

const SWATCHES: { label: string; u32: number }[] = [
  { label: 'Blue', u32: 0xff4a90e2 },
  { label: 'Red', u32: 0xffe02020 },
  { label: 'Orange', u32: 0xffff8800 },
  { label: 'Green', u32: 0xff30c080 },
  { label: 'Purple', u32: 0xff8844cc },
];

/**
 * Pre-game form for the four-characters-plane example: name, color, Enter.
 */
const FourCharactersLobby: Component = () => {
  let inputRef: HTMLInputElement | undefined;
  const [tick, setTick] = createSignal(0);

  /** Mirrors lobby color + `tick` so Solid tracks selection (valtio alone is not reactive here). */
  const selectedColorU32 = createMemo(() => {
    tick();
    return fourCharLobbyStore.colorU32;
  });

  onMount(() => {
    ensureFourCharDeviceId();
    inputRef?.focus();
    // `true`: synchronous notifications so Solid re-renders stay aligned with valtio
    // (default async batching can leave swatch selection / classes stale with `<For>`).
    const unsub = subscribe(
      fourCharLobbyStore,
      () => setTick((n) => n + 1),
      true,
    );
    onCleanup(unsub);
  });

  const commitJoin = () => {
    const name = fourCharLobbyStore.displayName.trim();
    if (!name) {
      inputRef?.focus();
      return;
    }
    fourCharLobbyStore.lobbyDismissed = true;
    fourCharLobbyStore.joinRequested = true;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitJoin();
    }
  };

  return (
    <div class={styles.overlay} data-four-char-lobby data-tick={tick()}>
      <div class={styles.panel}>
        <h2 class={styles.title}>Join session</h2>
        <p class={styles.hint}>
          Enter a name and pick a colour to join. Multiplayer sync is enabled
          when a SpacetimeDB server is available (see{' '}
          <code class={styles.code}>packages/server/README.md</code>
          ); otherwise the game runs in single-player mode.
        </p>
        <label class={styles.field}>
          <span class={styles.label}>Display name</span>
          <input
            ref={inputRef}
            class={styles.input}
            type="text"
            maxlength={32}
            placeholder="Player"
            value={fourCharLobbyStore.displayName}
            onInput={(e) => {
              fourCharLobbyStore.displayName = e.currentTarget.value;
              setTick((n) => n + 1);
            }}
            onKeyDown={onKeyDown}
          />
        </label>
        <div class={styles.field}>
          <span class={styles.label}>Color</span>
          <div class={styles.swatches}>
            {SWATCHES.map((s) => (
              <button
                type="button"
                class={`${styles.swatch} ${
                  selectedColorU32() === s.u32 ? styles.swatchActive : ''
                }`}
                style={{ 'background-color': u32ToCss(s.u32) }}
                title={s.label}
                aria-label={s.label}
                aria-pressed={selectedColorU32() === s.u32}
                onClick={() => {
                  fourCharLobbyStore.colorU32 = s.u32;
                  setTick((n) => n + 1);
                }}
              />
            ))}
          </div>
        </div>
        <button type="button" class={styles.enter} onClick={commitJoin}>
          Enter world
        </button>
      </div>
    </div>
  );
};

function u32ToCss(u: number): string {
  const r = (u >>> 16) & 255;
  const g = (u >>> 8) & 255;
  const b = u & 255;
  return `rgb(${r},${g},${b})`;
}

export default FourCharactersLobby;
