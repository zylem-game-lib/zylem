import {
  type Component,
  For,
  Show,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { subscribe } from 'valtio/vanilla';
import {
  arenaLobbyStore,
  ensureArenaDeviceId,
} from '../networking/arena-lobby-store';
import {
  CHARACTER_CLASSES,
  type CharacterClass,
  getCharacterLoadout,
} from '../characters';
import type {
  CharacterActionEntry,
  SpecialSlotId,
} from '../characters/movesets';
import {
  LOBBY_COLOR_SWATCHES,
  swatchCss,
} from '../lobby-palette';
import { demoAsset } from '../../../assets/manifest';
import * as styles from './ArenaLobby.css';

const CHARACTER_LABELS: Record<CharacterClass, string> = {
  tank: 'Tank',
  healer: 'Healer',
  assassin: 'Assassin',
};

const CHARACTER_TAGLINES: Record<CharacterClass, string> = {
  tank: 'Heavy bruiser. Soaks damage and locks down the front line.',
  healer: 'Support caster. Heals allies and links them with arcane bolts.',
  assassin: 'Burst striker. Slips in, executes, and disappears.',
};

const CHARACTER_ART: Record<CharacterClass, string> = {
  tank: demoAsset('arena/images/tank-art.png'),
  healer: demoAsset('arena/images/healer-art.png'),
  assassin: demoAsset('arena/images/assassin-art.png'),
};

/**
 * Carousel order. Same set as `CHARACTER_CLASSES`, but pinned in the
 * order players see them when arrowing through the lobby.
 */
const CHARACTER_ORDER: readonly CharacterClass[] = ['tank', 'healer', 'assassin'];

/**
 * Display order of special-move slots in the right-side panel. Mirrors
 * the on-controller layout so a player who knows their bindings can
 * scan the column top-to-bottom without translating.
 */
const SPECIAL_SLOT_ORDER: readonly SpecialSlotId[] = ['X', 'Y', 'L', 'R'];

/**
 * Wrap-around index step: returns `current ± 1 (mod len)`. Pulled out
 * so the left/right arrow handlers are one-liners.
 */
function step(current: CharacterClass, dir: 1 | -1): CharacterClass {
  const idx = CHARACTER_ORDER.indexOf(current);
  const next = (idx + dir + CHARACTER_ORDER.length) % CHARACTER_ORDER.length;
  return CHARACTER_ORDER[next] ?? CHARACTER_ORDER[0]!;
}

/**
 * Inline chevron icon used by the carousel's left/right arrow buttons.
 * Stroke is `currentColor` so the SVG picks up the button's `color`,
 * meaning hover / active styling stays in CSS without extra props.
 */
const ChevronIcon: Component<{ direction: 'left' | 'right' }> = (props) => (
  <svg
    class={styles.arrowIcon}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d={
        props.direction === 'left'
          ? 'M15 6l-6 6 6 6'
          : 'M9 6l6 6-6 6'
      }
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

/**
 * Fall back to a Title-Cased version of an animation key (e.g.
 * `'special-ground-slam'` → `'Special Ground Slam'`) when an entry
 * doesn't author a `name`. Used so the right-side panel always has a
 * label even before per-slot names are added.
 */
function prettyActionName(entry: CharacterActionEntry): string {
  if (entry.name) return entry.name;
  return entry.key
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Pre-game form for the arena demo. The lobby stage renders a 3D
 * preview of the currently-selected character behind this overlay;
 * left/right arrows cycle the class, the swatch row re-tints the
 * preview, then Enter commits.
 */
const ArenaLobby: Component = () => {
  let inputRef: HTMLInputElement | undefined;
  const [tick, setTick] = createSignal(0);

  const selectedClass = createMemo<CharacterClass>(() => {
    tick();
    return arenaLobbyStore.characterClass;
  });

  const selectedColor = createMemo<number>(() => {
    tick();
    return arenaLobbyStore.colorU32;
  });

  const loadout = createMemo(() => getCharacterLoadout(selectedClass()));

  const specials = createMemo(() => {
    const all = loadout().moveset.specials;
    return SPECIAL_SLOT_ORDER.flatMap((slot) => {
      const entry = all[slot];
      return entry ? [{ slot, entry }] : [];
    });
  });

  const cycleClass = (dir: 1 | -1): void => {
    arenaLobbyStore.characterClass = step(arenaLobbyStore.characterClass, dir);
  };

  const pickSwatchByIndex = (index: number): void => {
    const swatch = LOBBY_COLOR_SWATCHES[index];
    if (!swatch) return;
    arenaLobbyStore.colorU32 = swatch.value;
  };

  /**
   * Window-level keyboard shortcuts. Suppressed while the name input
   * has focus so typing letters that map to digits / arrows doesn't
   * fight the user. Enter is handled separately on the input itself
   * so the existing `commitJoin()` behavior is preserved.
   */
  const onWindowKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement | null;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      cycleClass(-1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      cycleClass(1);
      return;
    }
    if (/^[1-9]$/.test(e.key)) {
      const idx = Number(e.key) - 1;
      if (idx < LOBBY_COLOR_SWATCHES.length) {
        e.preventDefault();
        pickSwatchByIndex(idx);
      }
    }
  };

  onMount(() => {
    ensureArenaDeviceId();
    inputRef?.focus();
    const unsub = subscribe(arenaLobbyStore, () => setTick((n) => n + 1), true);
    window.addEventListener('keydown', onWindowKeyDown);
    onCleanup(() => {
      unsub();
      window.removeEventListener('keydown', onWindowKeyDown);
    });
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

  const onInputKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitJoin();
    }
  };

  return (
    <div class={styles.overlay} data-arena-lobby data-tick={tick()}>
      <div class={styles.topBar}>
        <div class={styles.carousel}>
          <button
            type="button"
            class={styles.arrow}
            aria-label="Previous character"
            onClick={() => cycleClass(-1)}
          >
            <ChevronIcon direction="left" />
          </button>
          <div class={styles.classLabel}>
            <span class={styles.classKicker}>Character</span>
            <span class={styles.className}>
              {CHARACTER_LABELS[selectedClass()]}
            </span>
          </div>
          <button
            type="button"
            class={styles.arrow}
            aria-label="Next character"
            onClick={() => cycleClass(1)}
          >
            <ChevronIcon direction="right" />
          </button>
        </div>

        <div class={styles.swatchRow} role="radiogroup" aria-label="Color">
          <For each={LOBBY_COLOR_SWATCHES}>
            {(swatch) => {
              const active = () => selectedColor() === swatch.value;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={active()}
                  aria-label={swatch.label}
                  title={swatch.label}
                  class={`${styles.swatch} ${
                    active() ? styles.swatchActive : ''
                  }`}
                  style={{ background: swatchCss(swatch.value) }}
                  onClick={() => {
                    arenaLobbyStore.colorU32 = swatch.value;
                  }}
                />
              );
            }}
          </For>
        </div>
      </div>

      <div class={styles.middle}>
        <aside class={styles.artPanel} aria-label="Character portrait">
          <img
            class={styles.artImage}
            src={CHARACTER_ART[selectedClass()]}
            alt={`${CHARACTER_LABELS[selectedClass()]} portrait`}
          />
          <p class={styles.tagline}>{CHARACTER_TAGLINES[selectedClass()]}</p>
        </aside>

        <aside class={styles.statsPanel} aria-label="Character stats and specials">
          <section class={styles.statsSection}>
            <h3 class={styles.sectionHeading}>Stats</h3>
            <ul class={styles.statList}>
              <li class={styles.statItem}>
                <span class={styles.statKey}>HP</span>
                <span class={styles.statValue}>{loadout().stats.maxHp}</span>
              </li>
              <li class={styles.statItem}>
                <span class={styles.statKey}>Walk speed</span>
                <span class={styles.statValue}>
                  {loadout().platformerOpts.walkSpeed}
                </span>
              </li>
              <li class={styles.statItem}>
                <span class={styles.statKey}>Jump force</span>
                <span class={styles.statValue}>
                  {loadout().platformerOpts.jumpForce}
                </span>
              </li>
              <li class={styles.statItem}>
                <span class={styles.statKey}>Jumps</span>
                <span class={styles.statValue}>
                  {loadout().platformerOpts.maxJumps}
                </span>
              </li>
            </ul>
          </section>

          <section class={styles.specialsSection}>
            <h3 class={styles.sectionHeading}>Specials</h3>
            <ul class={styles.specialList}>
              <For each={specials()}>
                {({ slot, entry }) => (
                  <li class={styles.specialItem}>
                    <div class={styles.specialHead}>
                      <span class={styles.slotBadge}>{slot}</span>
                      <Show when={entry.icon}>
                        {(iconKey) => (
                          <img
                            class={styles.specialIcon}
                            src={demoAsset(iconKey())}
                            alt=""
                          />
                        )}
                      </Show>
                      <span class={styles.specialName}>
                        {prettyActionName(entry)}
                      </span>
                      <span class={styles.specialMeta}>
                        <Show when={entry.damage !== undefined}>
                          <span class={styles.specialMetaTag}>
                            {entry.damage} dmg
                          </span>
                        </Show>
                        <Show when={entry.cooldown !== undefined}>
                          <span class={styles.specialMetaTag}>
                            {entry.cooldown}s cd
                          </span>
                        </Show>
                      </span>
                    </div>
                    <Show when={entry.description}>
                      <p class={styles.specialDescription}>
                        {entry.description}
                      </p>
                    </Show>
                  </li>
                )}
              </For>
            </ul>
          </section>
        </aside>
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
          onKeyDown={onInputKeyDown}
        />
        <button type="button" class={styles.enter} onClick={commitJoin}>
          Enter arena
        </button>
      </div>
    </div>
  );
};

void CHARACTER_CLASSES;

export default ArenaLobby;
