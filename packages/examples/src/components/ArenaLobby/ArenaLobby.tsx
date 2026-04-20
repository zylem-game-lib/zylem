import {
  type Component,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { subscribe } from 'valtio/vanilla';
import {
  arenaLobbyStore,
  ensureArenaDeviceId,
} from '../../demos/arena/networking/arena-lobby-store';
import {
  CHARACTER_CLASSES,
  type CharacterClass,
} from '../../demos/arena/characters';
import characterSelectImage from '../../demos/arena/assets/character-select.png';
import styles from './ArenaLobby.module.css';

const CHARACTER_LABELS: Record<CharacterClass, string> = {
  tank: 'Tank',
  healer: 'Healer',
  assassin: 'Assassin',
};

/**
 * Order of the buttons must match the left-to-right character order in
 * `character-select.png` (Tank, Healer, Assassin).
 */
const CHARACTER_BUTTON_ORDER: CharacterClass[] = ['tank', 'healer', 'assassin'];

/**
 * Pre-game form for the arena demo: pick a character via the
 * character-select.png backdrop with transparent outlined hit areas, enter a
 * name, then Enter to join.
 */
const ArenaLobby: Component = () => {
  let inputRef: HTMLInputElement | undefined;
  const [tick, setTick] = createSignal(0);

  const selectedClass = createMemo<CharacterClass>(() => {
    tick();
    return arenaLobbyStore.characterClass;
  });

  onMount(() => {
    ensureArenaDeviceId();
    inputRef?.focus();
    const unsub = subscribe(arenaLobbyStore, () => setTick((n) => n + 1), true);
    onCleanup(unsub);
  });

  const commitJoin = () => {
    const name = arenaLobbyStore.displayName.trim();
    if (!name) {
      inputRef?.focus();
      return;
    }
    arenaLobbyStore.lobbyDismissed = true;
    arenaLobbyStore.joinRequested = true;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitJoin();
    }
  };

  return (
    <div class={styles.overlay} data-arena-lobby data-tick={tick()}>
      <div
        class={styles.backdrop}
        style={{ 'background-image': `url(${characterSelectImage})` }}
      >
        <div class={styles.buttonRow}>
          {CHARACTER_BUTTON_ORDER.map((klass) => (
            <button
              type="button"
              class={`${styles.charButton} ${
                selectedClass() === klass ? styles.charButtonActive : ''
              }`}
              aria-pressed={selectedClass() === klass}
              aria-label={CHARACTER_LABELS[klass]}
              onClick={() => {
                arenaLobbyStore.characterClass = klass;
                setTick((n) => n + 1);
              }}
            >
              <span class={styles.charLabel}>{CHARACTER_LABELS[klass]}</span>
            </button>
          ))}
        </div>

        <div class={styles.controls}>
          <input
            ref={inputRef}
            class={styles.input}
            type="text"
            maxlength={32}
            placeholder="Display name"
            value={arenaLobbyStore.displayName}
            onInput={(e) => {
              arenaLobbyStore.displayName = e.currentTarget.value;
              setTick((n) => n + 1);
            }}
            onKeyDown={onKeyDown}
          />
          <button type="button" class={styles.enter} onClick={commitJoin}>
            Enter arena
          </button>
        </div>
      </div>
    </div>
  );
};

void CHARACTER_CLASSES;

export default ArenaLobby;
