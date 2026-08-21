import { ItemPicker, MenuButton } from '@zylem/ui/components';
import Plus from 'lucide-solid/icons/plus';
import { createMemo, Show, type Component } from 'solid-js';
import { unwrap } from 'solid-js/store';
import type { EntityTypeDescriptor } from '@zylem/bridge';

import { setDebugTool, debugStore } from '..';
import { sendAddType, sendTool } from '../../bridge/editor-bridge';
import {
  isAddArmed,
  resolvePlacementTarget,
  toPickerItems,
} from './add-button-state';
import { catalogStore, setArmedType } from './catalog-state';

/**
 * The Add tool: a palette of entity types plus an armed placement mode.
 *
 * Split interaction, because choosing what to place and placing it are separate
 * jobs. The chevron half opens the palette; the button face toggles the armed
 * state for whatever is already chosen, so placing ten boxes is one pick and ten
 * clicks rather than ten trips through the menu.
 *
 * The palette's entries are game-owned — they arrive as `catalog:snapshot` — so a
 * host that registers its own entity types gets them here for free.
 */
export const AddButton: Component = () => {
  const isArmed = () => isAddArmed(debugStore.tool, catalogStore.armedTypeId);

  const find = (id: string | null): EntityTypeDescriptor | null => {
    if (!id) return null;
    return catalogStore.entities.find((entity) => entity.id === id) ?? null;
  };

  /** What the face shows and what a press places. */
  const target = createMemo(() =>
    resolvePlacementTarget(
      catalogStore.entities,
      catalogStore.armedTypeId,
      catalogStore.lastTypeId,
    ),
  );

  const items = createMemo(() => toPickerItems(catalogStore.entities));

  const arm = (descriptor: EntityTypeDescriptor) => {
    setArmedType(descriptor.id);
    // Unwrapped: the props cross the bridge into the game, which should not
    // receive a live handle on the editor's store.
    sendAddType(descriptor.id, unwrap(descriptor.defaultProps));
    setDebugTool('add');
    sendTool('add');
  };

  /** Arm placement, or re-arm it — pressing an armed Add leaves it armed. */
  const armTarget = () => {
    const descriptor = target();
    if (descriptor) arm(descriptor);
  };

  return (
    <div class="zylem-add-tool">
      <MenuButton
        label={target() ? `Place ${target()!.label}` : 'Add'}
        selected={isArmed()}
        // An empty catalog is the one case with nothing to arm. Disabled
        // rather than silently inert, so a press that cannot work looks
        // like one; the game publishes its catalog on connect, so this is
        // only ever the no-game state.
        disabled={catalogStore.entities.length === 0}
        onAction={armTarget}
        menu={(close) => (
          <ItemPicker
            items={items()}
            selectedId={catalogStore.armedTypeId}
            searchPlaceholder="Search entities…"
            emptyMessage="No entity types published. Is a game running?"
            onSelect={(item) => {
              const descriptor = find(item.id);
              if (descriptor) arm(descriptor);
              close();
            }}
          />
        )}
      >
        {/* Follows `target`, not `current`, so the glyph, the label and what
				    a press actually places all agree before the first pick. */}
        <Show when={target()?.icon} fallback={<Plus class="zylem-icon" />}>
          {(icon) => <span class="zylem-add-tool__glyph" innerHTML={icon()} />}
        </Show>
      </MenuButton>
    </div>
  );
};
