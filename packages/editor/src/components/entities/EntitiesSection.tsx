import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { useEditor } from '../EditorContext';
import { EntityThumbnail } from './EntityThumbnail';
import { sendEntityFocus, sendEntitySelect } from '../../bridge/editor-bridge';
import { setDebugStore } from '../editor-store';
import { setSelectedEntityId } from './entities-state';
import { getEntityThumbnail } from './thumbnail-store';
import { printToConsole } from '..';
import type { BaseEntityInterface } from '../../types';

/**
 * Handle entity button click — log entity info to the editor console, select
 * the entity, and ask the game (via the bridge) to frame the debug camera on
 * it (no-op in stub mode).
 */
function handleEntityClick(entity: Partial<BaseEntityInterface>): void {
	if (!entity.uuid) return;

	printToConsole(`Entity: ${JSON.stringify(entity, null, 2)}`);
	setSelectedEntityId(entity.uuid);
	sendEntitySelect(entity.uuid);
	// Focusing enables debug mode game-side; mirror that in the editor store.
	sendEntityFocus(entity.uuid);
	setDebugStore('debug', true);
}

export const EntitiesSection: Component = () => {
	const { stage } = useEditor();

	return (
		<div class="panel-content">
			<section class="zylem-section">
				<h4 class="zylem-section-title">Entities ({stage.entities.length})</h4>
				<div class="entity-grid">
					<For each={stage.entities}>
						{(entity) => (
							<button
								class="entity-grid-item"
								type="button"
								title={
									entity.name ? `${entity.name} (${entity.uuid})` : entity.uuid
								}
								onClick={() => handleEntityClick(entity)}
							>
								<EntityThumbnail
									type={entity.type ?? 'Box'}
									name={entity.name}
									thumbnail={getEntityThumbnail(entity.uuid)?.url}
									bounds={getEntityThumbnail(entity.uuid)?.bounds ?? entity.bounds}
								/>
							</button>
						)}
					</For>
				</div>
			</section>
		</div>
	);
};
