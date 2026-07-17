import type { GameEntityOptions } from '../entities/entity';

/** How an entity's mesh is drawn: scene-direct, WebGPU bundle, or instanced pack. */
export type RenderCategory = 'none' | 'environment' | 'pack';

type RenderCategoryOptions = Pick<GameEntityOptions, 'category'>;

/** Resolve the render category for an entity. Defaults to `none`. */
export function resolveRenderCategory(
	options?: RenderCategoryOptions | null,
): RenderCategory {
	return options?.category ?? 'none';
}

/** Whether the entity opts into a managed render path (bundle or instanced). */
export function usesManagedRenderPath(options?: RenderCategoryOptions | null): boolean {
	const category = resolveRenderCategory(options);
	return category === 'environment' || category === 'pack';
}

/** Whether the entity is already registered on a managed render path. */
export function isManagedRenderEntity(entity: {
	isInstanced?: boolean;
	isBundled?: boolean;
}): boolean {
	return entity.isInstanced === true || entity.isBundled === true;
}
