/**
 * Invisible pointer volumes.
 *
 * These are entities so they join a stage the same way a box does, but they
 * have no collider. Hit testing is a ray against the authored box — a sensor
 * would be skipped by the solid-only physics raycast, and a hotspot should
 * not push characters around. An existing mesh can take the same role with
 * `entity.hoverArea(...)` / `entity.droppableArea(...)`.
 */

import { Group, Vector3 } from 'three';
import { BaseNode } from '../core/base-node';
import { finalizeEntityCloneSupport, GameEntity, type GameEntityOptions } from './entity';
import { commonDefaults, mergeArgs } from './common';
import {
	attachDroppableArea,
	attachHoverArea,
	getPointerAttachment,
	updatePointerHandlers,
	type DroppableAreaOptions,
	type HoverAreaOptions,
	type PointerAreaContext,
	type PointerTargetEntity,
	type PlacementPointContext,
} from '../stage/pointer-target';

type HoverAreaEntityOptions = GameEntityOptions & HoverAreaOptions;
type DroppableAreaEntityOptions = GameEntityOptions & DroppableAreaOptions;

const areaDefaults: HoverAreaEntityOptions = {
	...commonDefaults,
	size: new Vector3(1, 1, 1),
};

export const HOVER_AREA_TYPE = Symbol('HoverArea');
export const DROPPABLE_AREA_TYPE = Symbol('DroppableArea');

function bindHandlers(
	entity: PointerTargetEntity,
	handlers: Partial<DroppableAreaOptions>,
	promoteToDroppable: boolean,
): void {
	const existing = getPointerAttachment(entity);
	if (!existing) {
		if (promoteToDroppable) attachDroppableArea(entity, handlers);
		else attachHoverArea(entity, handlers);
		return;
	}
	if (promoteToDroppable && existing.role !== 'droppable') {
		attachDroppableArea(entity, { ...existing.handlers, ...handlers });
		return;
	}
	updatePointerHandlers(entity, handlers);
}

export class ZylemHoverArea extends GameEntity<HoverAreaEntityOptions> {
	static type: symbol = HOVER_AREA_TYPE;
	protected areaName = 'HoverArea';

	constructor(options?: HoverAreaEntityOptions) {
		super();
		this.options = { ...areaDefaults, ...options };
	}

	public create(): this {
		super.create();
		if (!this.group) this.group = new Group();
		this.group.name = this.name || this.areaName;
		return this;
	}

	onEnter(callback: (ctx: PointerAreaContext) => void): this {
		bindHandlers(this, { onEnter: callback }, false);
		return this;
	}

	onLeave(callback: (ctx: PointerAreaContext) => void): this {
		bindHandlers(this, { onLeave: callback }, false);
		return this;
	}

	onMove(callback: (ctx: PointerAreaContext) => void): this {
		bindHandlers(this, { onMove: callback }, false);
		return this;
	}

	onClick(callback: (ctx: PointerAreaContext) => void): this {
		bindHandlers(this, { onClick: callback }, false);
		return this;
	}
}

export class ZylemDroppableArea extends ZylemHoverArea {
	static override type: symbol = DROPPABLE_AREA_TYPE;
	protected override areaName = 'DroppableArea';

	onDrop(callback: (ctx: PlacementPointContext) => void): this {
		bindHandlers(this, { onDrop: callback }, true);
		return this;
	}

	accepts(predicate: NonNullable<DroppableAreaOptions['accepts']>): this {
		bindHandlers(this, { accepts: predicate }, true);
		return this;
	}
}

type HoverAreaArgs = BaseNode | Partial<HoverAreaEntityOptions>;
type DroppableAreaArgs = BaseNode | Partial<DroppableAreaEntityOptions>;

function handlersFrom(options: Partial<DroppableAreaOptions>): DroppableAreaOptions {
	return {
		onEnter: options.onEnter,
		onLeave: options.onLeave,
		onMove: options.onMove,
		onClick: options.onClick,
		onDrop: options.onDrop,
		accepts: options.accepts,
		placeAt: options.placeAt,
	};
}

export function createHoverArea(...args: Array<HoverAreaArgs>): ZylemHoverArea {
	const options = mergeArgs(args, areaDefaults);
	const entity = new ZylemHoverArea(options);
	attachHoverArea(entity, handlersFrom(options));
	return finalizeEntityCloneSupport(entity, (cloneOptions) => createHoverArea(cloneOptions ?? {}));
}

export function createDroppableArea(...args: Array<DroppableAreaArgs>): ZylemDroppableArea {
	const options = mergeArgs(args, areaDefaults);
	const entity = new ZylemDroppableArea(options);
	attachDroppableArea(entity, handlersFrom(options));
	return finalizeEntityCloneSupport(entity, (cloneOptions) => createDroppableArea(cloneOptions ?? {}));
}
