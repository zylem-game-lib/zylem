/**
 * Entity thumbnail side-channel.
 *
 * Thumbnails are kept out of `stageState.entities` on purpose. They are large
 * (a PNG blob or data URL per entity) and arrive on their own message stream,
 * so carrying them in entity state would make every `reconcile` diff megabytes
 * of image payload and force a full array rewrite for each thumbnail that
 * lands. Components read this store directly by uuid instead.
 */

import { createStore, produce } from 'solid-js/store';

export interface EntityThumbnailEntry {
	url: string;
	bounds?: { width: number; height: number; depth: number };
}

const [thumbnails, setThumbnails] = createStore<
	Record<string, EntityThumbnailEntry>
>({});

/** Reactive thumbnail lookup for an entity, or undefined when none exists. */
export function getEntityThumbnail(
	uuid: string | undefined,
): EntityThumbnailEntry | undefined {
	return uuid ? thumbnails[uuid] : undefined;
}

/**
 * Store thumbnails, revoking any blob URL each one replaces so the browser can
 * release the underlying image.
 */
export function setEntityThumbnails(
	entries: { uuid: string; url: string; bounds?: EntityThumbnailEntry['bounds'] }[],
): void {
	setThumbnails(
		produce((draft) => {
			for (const entry of entries) {
				const previous = draft[entry.uuid];
				if (previous && previous.url !== entry.url) {
					revokeIfBlobUrl(previous.url);
				}
				draft[entry.uuid] = entry.bounds
					? { url: entry.url, bounds: entry.bounds }
					: { url: entry.url };
			}
		}),
	);
}

/** Drop thumbnails for entities that no longer exist. */
export function removeEntityThumbnails(uuids: string[]): void {
	setThumbnails(
		produce((draft) => {
			for (const uuid of uuids) {
				const previous = draft[uuid];
				if (!previous) continue;
				revokeIfBlobUrl(previous.url);
				delete draft[uuid];
			}
		}),
	);
}

/** Drop every thumbnail, e.g. when a new stage is loaded. */
export function clearEntityThumbnails(): void {
	setThumbnails(
		produce((draft) => {
			for (const uuid of Object.keys(draft)) {
				revokeIfBlobUrl(draft[uuid]!.url);
				delete draft[uuid];
			}
		}),
	);
}

function revokeIfBlobUrl(url: string): void {
	if (url.startsWith('blob:') && typeof URL !== 'undefined') {
		URL.revokeObjectURL(url);
	}
}
