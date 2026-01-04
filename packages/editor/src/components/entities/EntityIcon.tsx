import type { Component, JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import Box from 'lucide-solid/icons/box';
import Circle from 'lucide-solid/icons/circle';
import Image from 'lucide-solid/icons/image';
import Type from 'lucide-solid/icons/type';
import User from 'lucide-solid/icons/user';
import Square from 'lucide-solid/icons/square';
import Layers from 'lucide-solid/icons/layers';
import Grid3x3 from 'lucide-solid/icons/grid-3x3';

/**
 * Map entity type strings to lucide-solid icons.
 * Will be replaced with thumbnail previews in the future.
 */
const ICON_MAP: Record<string, Component<{ class?: string }>> = {
	Box: Box as Component<{ class?: string }>,
	Sphere: Circle as Component<{ class?: string }>,
	Sprite: Image as Component<{ class?: string }>,
	Actor: User as Component<{ class?: string }>,
	Text: Type as Component<{ class?: string }>,
	Rect: Square as Component<{ class?: string }>,
	Plane: Layers as Component<{ class?: string }>,
	Zone: Grid3x3 as Component<{ class?: string }>,
};

export interface EntityIconProps {
	type: string;
	class?: string;
}

/**
 * Renders an icon based on entity type.
 * Falls back to Box icon for unknown types.
 */
export const EntityIcon: Component<EntityIconProps> = (props) => {
	const IconComponent = ICON_MAP[props.type] ?? Box;
	return <IconComponent class={props.class ?? 'entity-icon'} />;
};
