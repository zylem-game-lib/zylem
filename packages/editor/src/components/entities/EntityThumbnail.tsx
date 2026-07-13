import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { EntityIcon } from './EntityIcon';

export interface EntityThumbnailProps {
	type: string;
	name?: string | undefined;
	thumbnail?: string | null | undefined;
	bounds?: { width: number; height: number; depth: number } | undefined;
}

function formatDim(value: number): string {
	if (!Number.isFinite(value)) return '—';
	if (value >= 10) return value.toFixed(0);
	if (value >= 1) return value.toFixed(1);
	return value.toFixed(2);
}

/**
 * Entity list preview: 3D thumbnail image (or type icon fallback) with
 * AABB dimension rulers along the bottom (width) and side (height).
 * Name caption overlays the bottom of the frame; rulers show on hover.
 */
export const EntityThumbnail: Component<EntityThumbnailProps> = (props) => {
	const widthLabel = () => formatDim(props.bounds?.width ?? 0);
	const heightLabel = () => formatDim(props.bounds?.height ?? 0);
	const depthLabel = () => formatDim(props.bounds?.depth ?? 0);
	const hasBounds = () => Boolean(props.bounds);
	const caption = () => props.name ?? props.type;

	return (
		<div class="entity-thumbnail" title={props.name}>
			<div class="entity-thumbnail-frame">
				<Show
					when={props.thumbnail}
					fallback={<EntityIcon type={props.type} class="entity-icon" />}
				>
					{(src) => (
						<img
							class="entity-thumbnail-image"
							src={src()}
							alt={props.name ?? props.type}
							draggable={false}
						/>
					)}
				</Show>
				<span class="entity-grid-name">{caption()}</span>
				<Show when={hasBounds()}>
					<div class="entity-ruler entity-ruler-bottom" aria-hidden="true">
						<span class="entity-ruler-ticks" />
						<span class="entity-ruler-label">{widthLabel()}</span>
					</div>
					<div class="entity-ruler entity-ruler-side" aria-hidden="true">
						<span class="entity-ruler-ticks" />
						<span class="entity-ruler-label">{heightLabel()}</span>
					</div>
					<span class="entity-ruler-depth">d {depthLabel()}</span>
				</Show>
			</div>
		</div>
	);
};
