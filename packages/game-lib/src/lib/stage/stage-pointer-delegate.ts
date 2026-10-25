/**
 * Play-mode pointer: hover areas, droppable areas, and click-to-place.
 *
 * The editor's Add tool owns the canvas while `isEditorInteractionActive()`
 * is true. This delegate stays out of that — an armed session is hidden and
 * not cancelled, and its listeners come off so the gizmo and the add ghost
 * keep the pointer. Left click is swallowed only when a placement commits or
 * a hover area handles the click, so an empty press still reaches the camera.
 */

import { Box3, Raycaster, Vector2, Vector3, type Camera, type Scene } from 'three';
import { isEditorInteractionActive } from '../debug/debug-state';
import type { GizmoRay } from '../debug/transform-gizmo';
import { snapVec3 } from '../core/transform-math';
import {
	DEFAULT_REPRESENTATIVE_FADE_IN,
	DEFAULT_REPRESENTATIVE_OPACITY,
	EntityRepresentativeView,
} from './entity-representative';
import type { ArmPlacementOptions } from './placement-session';
import {
	computePlacementPose,
	type PlacementHit,
} from './placement-geometry';
import {
	getPointerAttachment,
	hasPointerRole,
	onPointerMembership,
	onPointerRoleChanged,
	pointerTargetBounds,
	rayBoxHit,
	type PlacementPointContext,
	type PointerAreaContext,
	type PointerTargetEntity,
} from './pointer-target';

const MAX_RAY_DISTANCE = 5_000;

export interface StagePointerHost {
	getScene(): Scene | null;
	raycast(
		origin: Vector3,
		direction: Vector3,
		maxDistance: number,
	): PlacementHit | null;
	addSpawn(entity: unknown): void;
	getCanvas(): HTMLElement | null;
	getCamera(): Camera | null;
	/** The durable stage should drop its saved session. Not called while repeating. */
	onSessionEnded?: () => void;
}

interface AreaPick {
	entity: PointerTargetEntity;
	distance: number;
	point: Vector3;
	center: Vector3;
}

interface Aim {
	area: PointerTargetEntity | null;
	position: Vector3 | null;
	normal: Vector3;
	valid: boolean;
}

const _up = new Vector3(0, 1, 0);

export class StagePointerDelegate {
	private readonly host: StagePointerHost;
	private readonly unsubscribe: Array<() => void>;
	private readonly known = new Set<string>();
	private readonly targets = new Map<string, PointerTargetEntity>();
	private readonly bounds = new Box3();
	private readonly raycaster = new Raycaster();
	private readonly mouseNdc = new Vector2();

	private session: ArmPlacementOptions | null = null;
	private view: EntityRepresentativeView | null = null;
	private closing = false;
	private disposed = false;
	private hovered: PointerTargetEntity | null = null;
	private hoveredId: string | null = null;
	private lastAim: Aim | null = null;
	/** Test and host injection. When set, the camera ray is not used. */
	private rayOverride: GizmoRay | null = null;

	private canvas: HTMLElement | null = null;
	private listening = false;
	private keys = false;

	constructor(host: StagePointerHost) {
		this.host = host;
		this.unsubscribe = [
			onPointerMembership((entity, present) => {
				if (this.disposed) return;
				if (!present) {
					this.known.delete(entity.uuid);
					this.targets.delete(entity.uuid);
					if (this.hoveredId === entity.uuid) this.leaveHovered();
					this.syncListeners();
					return;
				}
				this.known.add(entity.uuid);
				this.syncTarget(entity as PointerTargetEntity);
			}),
			onPointerRoleChanged((entity) => {
				if (this.disposed || !this.known.has(entity.uuid)) return;
				this.syncTarget(entity);
			}),
		];
	}

	/** True while a click would still try to place. False during the fade-out. */
	get isPlacing(): boolean {
		return this.session != null && !this.closing;
	}

	get previewOpacity(): number {
		return this.view?.opacity ?? 0;
	}

	get previewPosition(): Vector3 | null {
		if (!this.view?.container.visible) return null;
		return this.view.container.position.clone();
	}

	/**
	 * Use this ray instead of the camera. Tests inject one; a live stage leaves
	 * it null and rebuilds the ray from the canvas every frame so a moving
	 * camera does not leave the preview behind.
	 */
	setRay(ray: GizmoRay | null): void {
		this.rayOverride = ray;
	}

	/** Register a target that is not going through the stage entity list. */
	registerTarget(entity: PointerTargetEntity): void {
		if (this.disposed) return;
		this.known.add(entity.uuid);
		this.syncTarget(entity);
	}

	unregisterTarget(uuid: string): void {
		this.known.delete(uuid);
		this.targets.delete(uuid);
		if (this.hoveredId === uuid) this.leaveHovered();
		this.syncListeners();
	}

	arm(options: ArmPlacementOptions): void {
		if (this.disposed) return;
		this.closing = false;
		this.session = options;
		this.mountView();
		this.syncListeners();
	}

	setPayload(payload: unknown): void {
		if (!this.session) return;
		this.session.payload = payload;
	}

	setRepresentative(representative: ArmPlacementOptions['representative']): void {
		if (!this.session) return;
		this.session.representative = representative;
		this.mountView();
	}

	cancel(): void {
		if (this.disposed) return;
		if (!this.session && !this.view && !this.closing) return;
		this.beginClose();
		this.host.onSessionEnded?.();
	}

	update(delta: number): void {
		if (this.disposed) return;
		this.syncListeners();
		if (this.suspended()) {
			this.view?.hide();
			return;
		}

		if (!this.view && this.session && !this.closing) this.mountView();

		const ray = this.currentRay();
		if (ray) {
			const aim = this.resolveAim(ray);
			this.applyHover(aim);
			this.present(aim);
			this.lastAim = aim;
		}

		this.view?.advance(delta, {
			valid: this.lastAim?.valid ?? false,
			position: toComponents(this.lastAim?.position),
		});

		if (this.closing && this.view?.fadeCompleted) {
			this.view.dispose();
			this.view = null;
			this.closing = false;
			this.syncListeners();
		}
	}

	/**
	 * @returns whether the press was handled. Unhandled presses are left for
	 * the camera.
	 */
	pointerDown(button: number): boolean {
		if (this.disposed || this.suspended()) return false;
		if (button === 2) {
			if (!this.session && !this.closing && !this.view) return false;
			this.cancel();
			return true;
		}
		if (button !== 0 || this.closing) return false;
		if (this.session) {
			const ray = this.currentRay();
			if (!ray) return false;
			return this.tryCommit(this.resolveAim(ray));
		}
		return this.clickHovered();
	}

	dispose(): void {
		if (this.disposed) return;
		this.disposed = true;
		for (const unsubscribe of this.unsubscribe) unsubscribe();
		this.unsubscribe.length = 0;
		this.detachListeners();
		this.view?.dispose();
		this.view = null;
		this.session = null;
		this.closing = false;
		this.targets.clear();
		this.known.clear();
		this.hovered = null;
		this.hoveredId = null;
	}

	private suspended(): boolean {
		return isEditorInteractionActive();
	}

	private mountView(): void {
		const scene = this.host.getScene();
		if (!scene || !this.session) return;
		this.view?.dispose();
		this.view = new EntityRepresentativeView(scene, this.session.representative);
	}

	private syncTarget(entity: PointerTargetEntity): void {
		if (hasPointerRole(entity)) this.targets.set(entity.uuid, entity);
		else {
			this.targets.delete(entity.uuid);
			if (this.hoveredId === entity.uuid) this.leaveHovered();
		}
		this.syncListeners();
	}

	private resolveAim(ray: GizmoRay): Aim {
		const pick = this.nearestArea(ray);
		const surface = this.surfacePoint(ray);
		const attachment = pick ? getPointerAttachment(pick.entity) : null;
		const overDroppable = attachment?.role === 'droppable';
		let accepted = false;
		if (this.session && overDroppable && pick) {
			const accepts = attachment?.handlers.accepts;
			accepted = accepts ? accepts(this.session.payload, pick.entity) === true : true;
		}

		let position: Vector3 | null = null;
		if (overDroppable && pick) {
			const placeAt = attachment?.handlers.placeAt ?? this.session?.placeAt ?? 'area';
			position = (placeAt === 'hit' ? pick.point : pick.center).clone();
			if (this.session?.snap != null) {
				const snapped = snapVec3(position, this.session.snap);
				position.set(snapped.x, snapped.y, snapped.z);
			}
		} else if (surface) {
			position = surface.position.clone();
		}

		const normal = surface?.normal.clone() ?? _up.clone();
		let valid = false;
		if (this.session && position) {
			valid = this.hasDroppable() ? overDroppable && accepted : true;
		}

		return {
			area: pick?.entity ?? null,
			position,
			normal,
			valid,
		};
	}

	private nearestArea(ray: GizmoRay): AreaPick | null {
		let best: AreaPick | null = null;
		for (const entity of this.targets.values()) {
			if (!getPointerAttachment(entity)) continue;
			const bounds = pointerTargetBounds(entity, this.bounds);
			if (!bounds) continue;
			const hit = rayBoxHit(ray, bounds);
			if (!hit) continue;
			if (best && hit.distance >= best.distance) continue;
			best = {
				entity,
				distance: hit.distance,
				point: hit.point,
				center: bounds.getCenter(new Vector3()),
			};
		}
		return best;
	}

	private hasDroppable(): boolean {
		for (const entity of this.targets.values()) {
			if (getPointerAttachment(entity)?.role === 'droppable') return true;
		}
		return false;
	}

	private surfacePoint(ray: GizmoRay) {
		const hit = this.host.raycast(ray.origin, ray.direction, MAX_RAY_DISTANCE);
		const snap = this.session?.snap != null
			? { enabled: true, translate: this.session.snap }
			: { enabled: false, translate: 0 };
		return computePlacementPose(ray, hit, snap, this.view?.measure() ?? null);
	}

	private present(aim: Aim): void {
		if (!this.view || this.closing || !this.session) return;
		if (!aim.position) {
			this.view.hide();
			return;
		}
		const options = this.session.representative.options;
		const look = aim.valid ? options.valid : options.invalid;
		this.view.setLook(
			look,
			options.fadeIn ?? DEFAULT_REPRESENTATIVE_FADE_IN,
			options.opacity ?? DEFAULT_REPRESENTATIVE_OPACITY,
		);
		this.view.showAt(aim.position);
	}

	private applyHover(aim: Aim): void {
		const nextId = aim.area?.uuid ?? null;
		if (nextId !== this.hoveredId) {
			if (this.hovered) this.fire(this.hovered, 'onLeave', this.lastAim ?? aim);
			this.hovered = aim.area;
			this.hoveredId = nextId;
			if (aim.area) this.fire(aim.area, 'onEnter', aim);
		}
		if (aim.area) this.fire(aim.area, 'onMove', aim);
	}

	private leaveHovered(): void {
		const previous = this.hovered;
		const aim = this.lastAim;
		this.hovered = null;
		this.hoveredId = null;
		if (previous && aim) this.fire(previous, 'onLeave', aim);
	}

	private fire(
		area: PointerTargetEntity,
		event: 'onEnter' | 'onLeave' | 'onMove',
		aim: Aim,
	): void {
		const handler = getPointerAttachment(area)?.handlers[event];
		if (!handler) return;
		try {
			handler(this.areaContext(area, aim));
		} catch (error) {
			console.error('[zylem] pointer area callback failed', error);
		}
	}

	private areaContext(area: PointerTargetEntity, aim: Aim): PointerAreaContext {
		return {
			area,
			position: toComponents(aim.position ?? areaCenter(area)),
			normal: {
				x: aim.normal.x,
				y: aim.normal.y,
				z: aim.normal.z,
			},
			valid: this.session ? aim.valid : true,
			payload: this.session?.payload,
		};
	}

	private tryCommit(aim: Aim): boolean {
		if (!this.session || !aim.valid || !aim.position) return false;
		const ctx = this.pointContext(aim);
		const spawn = this.session.spawnOnClick;
		if (spawn) {
			let produced: unknown;
			try {
				produced = spawn(ctx);
			} catch (error) {
				console.error('[zylem] spawnOnClick failed', error);
				return false;
			}
			if (!isSpawnable(produced)) return false;
			try {
				this.host.addSpawn(produced);
			} catch (error) {
				console.error('[zylem] placement spawn failed', error);
				return false;
			}
			this.notifyDrop(aim.area, ctx);
			this.finishCommit();
			return true;
		}

		const role = aim.area ? getPointerAttachment(aim.area)?.role : null;
		if (role !== 'droppable') return false;
		this.notifyDrop(aim.area, ctx);
		this.finishCommit();
		return true;
	}

	private pointContext(aim: Aim): PlacementPointContext {
		return {
			position: toComponents(aim.position),
			normal: { x: aim.normal.x, y: aim.normal.y, z: aim.normal.z },
			area: aim.area,
			valid: aim.valid,
			payload: this.session?.payload,
		};
	}

	private notifyDrop(
		area: PointerTargetEntity | null,
		ctx: PlacementPointContext,
	): void {
		if (!area) return;
		const attachment = getPointerAttachment(area);
		if (attachment?.role !== 'droppable' || !attachment.handlers.onDrop) return;
		try {
			attachment.handlers.onDrop(ctx);
		} catch (error) {
			console.error('[zylem] droppable onDrop failed', error);
		}
	}

	private finishCommit(): void {
		if (this.session?.repeat === true) return;
		this.beginClose();
		// A one-shot placement is over. Clear the copy the stage would re-arm
		// on the next load; a repeating session keeps that copy.
		this.host.onSessionEnded?.();
	}

	private beginClose(): void {
		if (this.closing && !this.session) return;
		const fadeOut = this.session?.representative.options.fadeOut
			?? this.view?.fadeOutDuration
			?? 0.1;
		this.closing = true;
		this.session = null;
		if (!this.view || fadeOut <= 0) {
			this.view?.dispose();
			this.view = null;
			this.closing = false;
			this.syncListeners();
			return;
		}
		this.view.fadeTo(0, fadeOut);
		this.syncListeners();
	}

	private clickHovered(): boolean {
		const ray = this.currentRay();
		if (!ray) return false;
		const aim = this.resolveAim(ray);
		if (!aim.area) return false;
		const onClick = getPointerAttachment(aim.area)?.handlers.onClick;
		if (!onClick) return false;
		try {
			onClick(this.areaContext(aim.area, aim));
		} catch (error) {
			console.error('[zylem] pointer area callback failed', error);
			return false;
		}
		return true;
	}

	private currentRay(): GizmoRay | null {
		if (this.rayOverride) {
			return {
				origin: this.rayOverride.origin,
				direction: this.rayOverride.direction.clone().normalize(),
			};
		}
		const camera = this.host.getCamera();
		if (!camera) return null;
		this.raycaster.setFromCamera(this.mouseNdc, camera);
		return {
			origin: this.raycaster.ray.origin.clone(),
			direction: this.raycaster.ray.direction.clone().normalize(),
		};
	}

	private syncListeners(): void {
		if (this.disposed) return;
		const suspended = this.suspended();
		const wantKeys = !suspended && (this.session != null || this.closing);
		if (wantKeys && !this.keys && typeof window !== 'undefined') {
			window.addEventListener('keydown', this.onKeyDown);
			this.keys = true;
		} else if ((!wantKeys || suspended) && this.keys && typeof window !== 'undefined') {
			window.removeEventListener('keydown', this.onKeyDown);
			this.keys = false;
		}

		const canvas = this.host.getCanvas();
		const wantPointer = !suspended && canvas != null && (
			this.targets.size > 0 || this.session != null || this.view != null || this.closing
		);
		if (wantPointer && canvas && (!this.listening || this.canvas !== canvas)) {
			this.detachPointer();
			this.canvas = canvas;
			canvas.addEventListener('pointermove', this.onPointerMove, true);
			canvas.addEventListener('pointerdown', this.onPointerDown, true);
			this.listening = true;
		} else if (!wantPointer && this.listening) {
			this.detachPointer();
		}
	}

	private detachListeners(): void {
		this.detachPointer();
		if (this.keys && typeof window !== 'undefined') {
			window.removeEventListener('keydown', this.onKeyDown);
			this.keys = false;
		}
	}

	private detachPointer(): void {
		if (!this.listening || !this.canvas) {
			this.listening = false;
			this.canvas = null;
			return;
		}
		this.canvas.removeEventListener('pointermove', this.onPointerMove, true);
		this.canvas.removeEventListener('pointerdown', this.onPointerDown, true);
		this.listening = false;
		this.canvas = null;
	}

	private onPointerMove = (event: PointerEvent): void => {
		this.trackPointer(event);
	};

	private onPointerDown = (event: PointerEvent): void => {
		this.trackPointer(event);
		if (!this.pointerDown(event.button)) return;
		event.preventDefault();
		event.stopImmediatePropagation();
	};

	private onKeyDown = (event: KeyboardEvent): void => {
		if (event.key !== 'Escape') return;
		if (!this.session && !this.closing) return;
		this.cancel();
	};

	private trackPointer(event: PointerEvent): void {
		const canvas = this.canvas;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;
		const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
		this.mouseNdc.set(x, y);
	}
}

function areaCenter(area: PointerTargetEntity): Vector3 {
	const box = pointerTargetBounds(area, new Box3());
	if (!box) return new Vector3();
	return box.getCenter(new Vector3());
}

function toComponents(position: Vector3 | null | undefined): { x: number; y: number; z: number } {
	if (!position) return { x: 0, y: 0, z: 0 };
	return { x: position.x, y: position.y, z: position.z };
}

function isSpawnable(value: unknown): boolean {
	if (value == null || value === false) return false;
	return typeof value === 'object' || typeof value === 'function';
}
