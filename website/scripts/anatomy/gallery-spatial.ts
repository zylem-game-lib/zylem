import type { Part } from './spatial.ts';
export interface GalleryPart extends Part {
	motion?: 'selector' | number;
}
export function galleryPose(parts: GalleryPart[], selector: number, drawers: number[]): GalleryPart[] {
	return parts.map(part => ({ ...part,
		x: part.x + (part.motion === 'selector' ? selector : 0),
		y: part.y + (typeof part.motion === 'number' ? (drawers[part.motion] ?? 0) * 55 : 0),
	}));
}
