import type { Component } from 'solid-js';
import Box from 'lucide-solid/icons/box';
import Type from 'lucide-solid/icons/type';
import Square from 'lucide-solid/icons/square';
import Grid3x3 from 'lucide-solid/icons/grid-3x3';
import Torus from 'lucide-solid/icons/torus';
import PersonStanding from 'lucide-solid/icons/person-standing';
import GhostIcon from 'lucide-solid/icons/ghost';
import SquareDashed from 'lucide-solid/icons/square-dashed';
import Globe from 'lucide-solid/icons/globe';

/**
 * Map entity type strings to lucide-solid icons.
 * Will be replaced with thumbnail previews in the future.
 */
const ICON_MAP: Record<string, Component<{ class?: string }>> = {
	Box: Box as Component<{ class?: string }>,
	Sphere: Globe as Component<{ class?: string }>,
	Disk: Torus as Component<{ class?: string }>,
	Sprite: GhostIcon as Component<{ class?: string }>,
	Actor: PersonStanding as Component<{ class?: string }>,
	Text: Type as Component<{ class?: string }>,
	Rect: Square as Component<{ class?: string }>,
	Plane: Grid3x3 as Component<{ class?: string }>,
	Zone: SquareDashed as Component<{ class?: string }>,
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
