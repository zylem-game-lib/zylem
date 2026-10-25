/**
 * Pointer roles for gameplay placement.
 *
 * A hover or droppable area is metadata on an entity plus a box the cursor ray
 * is tested against. The physics raycast is the wrong tool for this: it skips
 * sensors, and an invisible hotspot should not have to be a solid collider to
 * be clickable. Areas with a mesh already in the scene use that mesh's world
 * bounds; everyone else uses `options.position` and `options.size`.
 */

import { Box3, Object3D, Ray, Vector3 } from 'three';
import type { GizmoRay } from '../debug/transform-gizmo';
import {
	normalizeVec3,
	type Vec3Components,
	type Vec3Input,
} from '../core/vector';

/** Anything the stage can test with a pointer ray. GameEntity satisfies this. */
export interface PointerTargetEntity {
	uuid: string;
	options?: {
		position?: Vec3Input;
		size?: Vec3Input;
	};
	group?: Object3D;
	mesh?: Object3D;
	getPose?: () => { position: { x: number; y: number; z: number } } | null;
}

/** Where the cursor is, and whether an armed placement would accept it. */
export interface PointerAreaContext {
	area: PointerTargetEntity;
	position: Vec3Components;
	normal: Vec3Components;
	/** True when nothing is armed, or when the armed payload may land here. */
	valid: boolean;
	payload: unknown;
}

/** The pose a click would commit, including when it is not over an area. */
export interface PlacementPointContext {
	position: Vec3Components;
	normal: Vec3Components;
	area: PointerTargetEntity | null;
	valid: boolean;
	payload: unknown;
}

export interface HoverAreaOptions {
	onEnter?: (ctx: PointerAreaContext) => void;
	onLeave?: (ctx: PointerAreaContext) => void;
	onMove?: (ctx: PointerAreaContext) => void;
	onClick?: (ctx: PointerAreaContext) => void;
}

export interface DroppableAreaOptions extends HoverAreaOptions {
	/** Omit to accept every payload. */
	accepts?: (payload: unknown, area: PointerTargetEntity) => boolean;
	/** Called after a placement commits on this area. Not a second spawn. */
	onDrop?: (ctx: PlacementPointContext) => void;
	/**
	 * `area` sits the preview on this area's center (a grid cell).
	 * `hit` keeps it on the ray's intersection with the area.
	 */
	placeAt?: 'area' | 'hit';
}

export type PointerRole = 'hover' | 'droppable';

interface PointerAttachment {
	role: PointerRole;
	handlers: DroppableAreaOptions;
}

const attachments = new WeakMap<object, PointerAttachment>();

type RoleListener = (entity: PointerTargetEntity) => void;
type MembershipListener = (entity: { uuid: string }, present: boolean) => void;

const roleListeners = new Set<RoleListener>();
const membershipListeners = new Set<MembershipListener>();

export function onPointerRoleChanged(listener: RoleListener): () => void {
	roleListeners.add(listener);
	return () => roleListeners.delete(listener);
}

export function onPointerMembership(listener: MembershipListener): () => void {
	membershipListeners.add(listener);
	return () => membershipListeners.delete(listener);
}

/** Stage entity add/remove. The attachment itself stays, so a restore still hits. */
export function emitPointerMembership(entity: { uuid: string }, present: boolean): void {
	for (const listener of membershipListeners) listener(entity, present);
}

function emitRole(entity: PointerTargetEntity): void {
	for (const listener of roleListeners) listener(entity);
}

export function getPointerAttachment(entity: object): PointerAttachment | null {
	return attachments.get(entity) ?? null;
}

export function hasPointerRole(entity: object): boolean {
	return attachments.has(entity);
}

export function attachHoverArea(
	entity: PointerTargetEntity,
	handlers?: HoverAreaOptions,
): void {
	const previous = attachments.get(entity);
	attachments.set(entity, {
		role: 'hover',
		handlers: { ...previous?.handlers, ...handlers },
	});
	emitRole(entity);
}

export function attachDroppableArea(
	entity: PointerTargetEntity,
	handlers?: DroppableAreaOptions,
): void {
	const previous = attachments.get(entity);
	attachments.set(entity, {
		role: 'droppable',
		handlers: { ...previous?.handlers, ...handlers },
	});
	emitRole(entity);
}

export function updatePointerHandlers(
	entity: PointerTargetEntity,
	handlers: Partial<DroppableAreaOptions>,
): void {
	const attachment = attachments.get(entity);
	if (!attachment) return;
	attachment.handlers = { ...attachment.handlers, ...handlers };
}

/** Clone keeps the live handlers, including ones added after the factory ran. */
export function copyPointerAttachment(
	from: PointerTargetEntity,
	to: PointerTargetEntity,
): void {
	const attachment = attachments.get(from);
	if (!attachment) return;
	attachments.set(to, {
		role: attachment.role,
		handlers: { ...attachment.handlers },
	});
	emitRole(to);
}

const _ray = new Ray();
const _direction = new Vector3();

/** Distance along `ray` to the box, or null when the ray misses it. */
export function rayBoxHit(
	ray: GizmoRay,
	box: Box3,
): { distance: number; point: Vector3 } | null {
	if (box.isEmpty()) return null;
	_direction.copy(ray.direction);
	if (_direction.lengthSq() < 1e-12) return null;
	_direction.normalize();
	_ray.set(ray.origin, _direction);
	const point = _ray.intersectBox(box, new Vector3());
	if (!point) return null;
	return { distance: _ray.origin.distanceTo(point), point };
}

/**
 * World-space box the pointer tests.
 *
 * A mesh already parented in the scene wins, so a tile that physics has moved
 * is hit where it is drawn. An unparented or empty object (an invisible
 * hotspot, or a test double) falls back to the authored position and size.
 */
export function pointerTargetBounds(
	entity: PointerTargetEntity,
	target: Box3,
): Box3 | null {
	const object = entity.group ?? entity.mesh;
	if (object?.parent) {
		target.setFromObject(object);
		if (!target.isEmpty()) return target;
	}

	const size = normalizeVec3(entity.options?.size, { x: 1, y: 1, z: 1 });
	const pose = entity.getPose?.() ?? null;
	const position = pose?.position
		?? normalizeVec3(entity.options?.position, { x: 0, y: 0, z: 0 });
	target.setFromCenterAndSize(
		new Vector3(position.x, position.y, position.z),
		new Vector3(size.x, size.y, size.z),
	);
	return target.isEmpty() ? null : target;
}
