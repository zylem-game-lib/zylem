import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { focusEntity, debugState } from '@zylem/game-lib/debug';
import { useEditor } from '../EditorContext';
import { EntityThumbnail } from './EntityThumbnail';
import { dispatchEditorUpdate } from '../editor-events';
import { setDebugStore } from '../editor-store';
import { setSelectedEntityId } from './entities-state';
import type { BaseEntityInterface } from '../../types';

/**
 * Handle entity button click — select the entity and frame the debug camera.
 */
function handleEntityClick(entity: Partial<BaseEntityInterface>): void {
	if (!entity.uuid) return;
	const focused = focusEntity(entity.uuid);
	if (!focused) return;

	setSelectedEntityId(entity.uuid);
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
								title={entity.name ? `${entity.name} (${entity.uuid})` : entity.uuid}
								onClick={() => handleEntityClick(entity)}
							>
								<EntityThumbnail
									type={entity.type ?? 'Box'}
									name={entity.name}
									thumbnail={entity.thumbnail}
									bounds={entity.bounds}
								/>
								<span class="entity-grid-name">{entity.name ?? entity.type ?? 'Entity'}</span>
							</button>
						)}
					</For>
				</div>
			</section>
		</div>
	);
};
