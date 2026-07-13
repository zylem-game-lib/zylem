import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { focusEntity, debugState } from '@zylem/game-lib/debug';
import { useEditor } from '../EditorContext';
import { EntityThumbnail } from './EntityThumbnail';
import { dispatchEditorUpdate } from '../editor-events';
import { setDebugStore } from '../editor-store';
import { setSelectedEntityId } from './entities-state';
import { printToConsole } from '..';
import type { BaseEntityInterface } from '../../types';

/**
 * Handle entity button click — log entity info to the editor console, select
 * the entity, and best-effort frame the debug camera when a live stage focus
 * context exists (no-op in stub mode).
 */
function handleEntityClick(entity: Partial<BaseEntityInterface>): void {
	if (!entity.uuid) return;

	const { thumbnail: _thumbnail, ...entityInfo } = entity;
	printToConsole(`Entity: ${JSON.stringify(entityInfo, null, 2)}`);
	setSelectedEntityId(entity.uuid);
	focusEntity(entity.uuid);

	if (debugState.enabled) {
		setDebugStore('debug', true);
		dispatchEditorUpdate({ gameState: { debugFlag: true } });
	}
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
									thumbnail={entity.thumbnail}
									bounds={entity.bounds}
								/>
							</button>
						)}
					</For>
				</div>
			</section>
		</div>
	);
};
