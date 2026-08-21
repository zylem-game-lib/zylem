/**
 * Drives the in-scene transform gizmo: drag lifecycle, snapping, and the
 * committed scene operations the editor's undo stack is built from.
 *
 * Split out of {@link StageDebugDelegate} so the pick/hover/delete tools stay
 * readable next to what is genuinely a different job — stateful, multi-frame
 * gesture handling with its own before/after bookkeeping.
 *
 * Snapping is applied to the *resulting absolute value*, never to the drag
 * delta. Snapping deltas would only preserve whatever arbitrary offset an entity
 * started with, so two entities placed independently would never line up.
 */

import { Box3, Quaternion, Vector3, type Camera, type Scene } from 'three';
import { nanoid } from 'nanoid';
import type {
	BridgePose,
	SceneOperationEntry,
	SceneOperationPayload,
} from '@zylem/bridge';

import {
	TransformGizmo,
	type GizmoAxis,
	type GizmoRay,
} from '../debug/transform-gizmo';
import {
	debugState,
	getSnapSettings,
	type TransformTool,
} from '../debug/debug-state';
import {
	eulerToQuaternion,
	quaternionToEuler,
	snapScale,
	snapToIncrement,
	snapVec3,
} from '../core/transform-math';
import { commitColliderScale } from '../entities/entity-scale';
import { publishSceneOperation } from '../bridge/game-bridge';
import { clampPointToViewport, clampScaleToViewport } from './viewport-clamp';
import type { GameEntity } from '../entities/entity';

/** An entity's full transform at a point in time. */
interface PoseSnapshot {
	position: Vector3;
	quaternion: Quaternion;
	scale: Vector3;
}

interface DragEntry {
	uuid: string;
	entity: GameEntity<any>;
	start: PoseSnapshot;
	/**
	 * World AABB at drag start, for the scale bound. Captured once and scaled
	 * arithmetically afterwards: re-measuring the live object each frame would
	 * read back the scale the drag itself just wrote.
	 */
	startBounds: Box3 | null;
}

interface DragSession {
	mode: TransformTool;
	axis: GizmoAxis;
	entries: DragEntry[];
	pivotStart: Vector3;
	/** Whether anything actually moved, so no-op clicks add no undo entry. */
	changed: boolean;
}

export interface TransformToolContext {
	getScene(): Scene | null;
	getCamera(): Camera | null;
	resolveEntity(uuid: string): GameEntity<any> | null;
}

/** Human-readable operation labels, e.g. `Move Box`. */
const MODE_LABELS: Record<TransformTool, string> = {
	translate: 'Move',
	rotate: 'Rotate',
	scale: 'Scale',
};

function readPose(entity: any): PoseSnapshot {
	const pose = typeof entity?.getPose === 'function' ? entity.getPose() : null;
	const object = entity?.group ?? entity?.mesh;
	const position = pose?.position
		?? (object ? { x: object.position.x, y: object.position.y, z: object.position.z } : null)
		?? { x: 0, y: 0, z: 0 };
	const rotation = pose?.rotation ?? { x: 0, y: 0, z: 0, w: 1 };
	const scale = typeof entity?.getScale === 'function'
		? entity.getScale()
		: { x: 1, y: 1, z: 1 };

	return {
		position: new Vector3(position.x, position.y, position.z),
		quaternion: new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
		scale: new Vector3(scale.x, scale.y, scale.z),
	};
}

function toBridgePose(pose: PoseSnapshot): BridgePose {
	const euler = quaternionToEuler(pose.quaternion);
	return {
		position: { x: pose.position.x, y: pose.position.y, z: pose.position.z },
		rotation: euler,
		quaternion: {
			x: pose.quaternion.x,
			y: pose.quaternion.y,
			z: pose.quaternion.z,
			w: pose.quaternion.w,
		},
		scale: { x: pose.scale.x, y: pose.scale.y, z: pose.scale.z },
	};
}

function posesDiffer(a: PoseSnapshot, b: PoseSnapshot): boolean {
	const epsilon = 1e-5;
	return (
		a.position.distanceToSquared(b.position) > epsilon * epsilon
		|| Math.abs(a.quaternion.dot(b.quaternion)) < 1 - epsilon
		|| a.scale.distanceToSquared(b.scale) > epsilon * epsilon
	);
}

/** Write an absolute pose onto a live entity. */
export function writePose(entity: any, pose: Partial<PoseSnapshot>): void {
	if (pose.position || pose.quaternion) {
		entity.setPose?.({
			position: pose.position
				? { x: pose.position.x, y: pose.position.y, z: pose.position.z }
				: undefined,
			rotation: pose.quaternion
				? {
					x: pose.quaternion.x,
					y: pose.quaternion.y,
					z: pose.quaternion.z,
					w: pose.quaternion.w,
				}
				: undefined,
		});
	}
	if (pose.scale) {
		entity.setScale?.(pose.scale.x, pose.scale.y, pose.scale.z);
	}
}

/**
 * World-space AABB of an entity's renderable, or `null` when it has none to
 * measure — a body with no mesh yet, or geometry without a bounding box.
 */
function readWorldBounds(entity: any): Box3 | null {
	const object = entity?.group ?? entity?.mesh;
	if (!object?.isObject3D) return null;

	const bounds = new Box3().setFromObject(object);
	return bounds.isEmpty() ? null : bounds;
}

/**
 * How far a single drag may scale an entity relative to its starting size.
 *
 * A backstop rather than the real limit: the viewport bound normally stops a
 * grow-drag long before this. It covers the cases that bound cannot see, such as
 * an entity with no bounds to project or one already off screen.
 */
const MIN_SCALE_RATIO = 0.02;
const MAX_SCALE_RATIO = 50;

function clampScaleRatio(factor: Vector3): Vector3 {
	return new Vector3(
		clamp(factor.x, MIN_SCALE_RATIO, MAX_SCALE_RATIO),
		clamp(factor.y, MIN_SCALE_RATIO, MAX_SCALE_RATIO),
		clamp(factor.z, MIN_SCALE_RATIO, MAX_SCALE_RATIO),
	);
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

const _deltaQuaternion = new Quaternion();
const _workingVector = new Vector3();

export class StageTransformTool {
	private gizmo = new TransformGizmo();
	private context: TransformToolContext;
	private mode: TransformTool | null = null;
	private session: DragSession | null = null;
	/** Pause state to restore when leaving a transform tool. */
	private pausedBeforeEntry: boolean | null = null;

	constructor(context: TransformToolContext) {
		this.context = context;
	}

	/**
	 * Enter or leave a transform tool.
	 *
	 * Entering pauses the simulation. A dragged entity is a live rigid body, so
	 * an unpaused world would immediately overwrite whatever the gizmo wrote —
	 * gravity and contact resolution would fight every frame of the drag.
	 */
	setMode(mode: TransformTool | null): void {
		if (this.mode === mode) return;

		if (mode && this.pausedBeforeEntry === null) {
			this.pausedBeforeEntry = debugState.paused;
			debugState.paused = true;
		} else if (!mode && this.pausedBeforeEntry !== null) {
			debugState.paused = this.pausedBeforeEntry;
			this.pausedBeforeEntry = null;
		}

		this.mode = mode;
		this.cancelDrag();

		if (!mode) {
			this.gizmo.hide();
			return;
		}
		this.gizmo.setMode(mode);
	}

	getMode(): TransformTool | null {
		return this.mode;
	}

	get isDragging(): boolean {
		return this.session !== null;
	}

	/** Reposition the gizmo on the current selection and keep it screen-sized. */
	update(): void {
		const scene = this.context.getScene();
		if (scene) this.gizmo.addTo(scene);

		if (!this.mode) {
			this.gizmo.hide();
			return;
		}

		// Mid-drag the pivot must stay where the gesture started, or the gizmo
		// would chase the entity it is moving.
		if (!this.session) {
			const pivot = this.selectionPivot();
			if (!pivot) {
				this.gizmo.hide();
				return;
			}
			this.gizmo.show(pivot);
		}

		const camera = this.context.getCamera();
		if (camera) this.gizmo.update(camera);
	}

	/** Highlight the handle under the cursor while not dragging. */
	hover(ray: GizmoRay): GizmoAxis | null {
		if (!this.mode || this.session) return null;
		const axis = this.gizmo.pick(ray);
		this.gizmo.setHighlight(axis);
		return axis;
	}

	/**
	 * Try to start a drag.
	 *
	 * @returns `true` when a handle was grabbed, so the caller can suppress the
	 * entity picking that would otherwise select whatever is behind the gizmo.
	 */
	pointerDown(ray: GizmoRay): boolean {
		if (!this.mode) return false;
		const camera = this.context.getCamera();
		if (!camera) return false;

		const axis = this.gizmo.pick(ray);
		if (!axis) return false;
		if (!this.gizmo.beginDrag(axis, ray, camera)) return false;

		const entries: DragEntry[] = [];
		for (const uuid of debugState.selectedEntityIds) {
			const entity = this.context.resolveEntity(uuid);
			if (!entity) continue;
			entries.push({
				uuid,
				entity,
				start: readPose(entity),
				startBounds: this.mode === 'scale' ? readWorldBounds(entity) : null,
			});
		}
		if (!entries.length) {
			this.gizmo.endDrag();
			return false;
		}

		this.session = {
			mode: this.mode,
			axis,
			entries,
			pivotStart: this.gizmo.pivot.clone(),
			changed: false,
		};
		return true;
	}

	/**
	 * Apply the drag for a new pointer position.
	 *
	 * @param freeform Bypass snapping for this move (the alt/option key). Read
	 * per event rather than tracked, so releasing the key mid-drag needs no
	 * keyup bookkeeping and a missed keyup cannot leave snapping stuck off.
	 */
	pointerMove(ray: GizmoRay, freeform: boolean): void {
		const session = this.session;
		if (!session) return;
		const camera = this.context.getCamera();
		if (!camera) return;

		const delta = this.gizmo.updateDrag(ray, camera);
		if (!delta) return;

		const snap = getSnapSettings();
		const snapping = snap.enabled && !freeform;

		switch (delta.kind) {
			case 'translate':
				this.applyTranslate(
					session,
					delta.offset,
					snapping ? snap.translate : 0,
					camera,
				);
				break;
			case 'rotate':
				this.applyRotate(
					session,
					delta.axis,
					delta.angle,
					snapping ? snap.rotate : 0,
				);
				break;
			case 'scale':
				this.applyScale(session, delta.factor, snapping ? snap.scale : 0, camera);
				break;
		}

		session.changed = true;
	}

	/** Commit the drag, publishing an undoable operation when anything moved. */
	pointerUp(): void {
		const session = this.session;
		this.session = null;
		this.gizmo.endDrag();
		if (!session) return;

		const entries: SceneOperationEntry[] = [];
		for (const entry of session.entries) {
			const after = readPose(entry.entity);
			if (!posesDiffer(entry.start, after)) continue;

			// Colliders are rebuilt once here rather than per drag frame; see
			// `commitColliderScale`.
			if (session.mode === 'scale') {
				commitColliderScale(entry.entity as any);
			}

			entries.push({
				uuid: entry.uuid,
				before: toBridgePose(entry.start),
				after: toBridgePose(after),
			});
		}

		if (!entries.length) return;

		publishSceneOperation({
			opId: nanoid(10),
			kind: 'transform',
			label: this.describeOperation(session),
			entries,
		});
	}

	/** Abandon an in-flight drag without committing or reverting. */
	cancelDrag(): void {
		this.session = null;
		this.gizmo.endDrag();
	}

	dispose(): void {
		this.cancelDrag();
		if (this.pausedBeforeEntry !== null) {
			debugState.paused = this.pausedBeforeEntry;
			this.pausedBeforeEntry = null;
		}
		this.gizmo.dispose();
	}

	// ── Application ─────────────────────────────────────────────────────────

	private applyTranslate(
		session: DragSession,
		offset: Vector3,
		increment: number,
		camera: Camera,
	): void {
		const target = _workingVector.copy(session.pivotStart).add(offset);
		// Clamped before snapping, since snapping can only nudge the pivot by half
		// an increment and the margin leaves room for that.
		const bounded = clampPointToViewport(session.pivotStart, target, camera);
		const snapped = increment > 0 ? snapVec3(bounded, increment) : bounded;
		const applied = new Vector3(
			snapped.x - session.pivotStart.x,
			snapped.y - session.pivotStart.y,
			snapped.z - session.pivotStart.z,
		);

		for (const entry of session.entries) {
			writePose(entry.entity, {
				position: entry.start.position.clone().add(applied),
			});
		}
	}

	/**
	 * Rotate about the world axis through the pivot.
	 *
	 * Only the dragged axis is snapped. Snapping all three Euler components
	 * would silently straighten an entity the user deliberately tilted on
	 * another axis.
	 */
	private applyRotate(
		session: DragSession,
		axis: Vector3,
		angle: number,
		increment: number,
	): void {
		const axisKey = session.axis as 'x' | 'y' | 'z';

		for (const entry of session.entries) {
			_deltaQuaternion.setFromAxisAngle(axis, angle);
			// Pre-multiply: the rotation is about a world axis, not the entity's.
			const target = _deltaQuaternion.clone().multiply(entry.start.quaternion);

			let quaternion = target;
			if (increment > 0 && (axisKey === 'x' || axisKey === 'y' || axisKey === 'z')) {
				const euler = quaternionToEuler(target);
				euler[axisKey] = snapToIncrement(euler[axisKey], increment);
				const snapped = eulerToQuaternion(euler);
				quaternion = new Quaternion(snapped.x, snapped.y, snapped.z, snapped.w);
			}

			const position = entry.start.position
				.clone()
				.sub(session.pivotStart)
				.applyQuaternion(_deltaQuaternion)
				.add(session.pivotStart);

			writePose(entry.entity, { position, quaternion });
		}
	}

	private applyScale(
		session: DragSession,
		factor: Vector3,
		increment: number,
		camera: Camera,
	): void {
		for (const entry of session.entries) {
			// `setScale` grows the object about its own origin, so that is the
			// centre the bound has to be measured from.
			const bounded = entry.startBounds
				? clampScaleToViewport(entry.startBounds, entry.start.position, factor, camera)
				: factor;
			// Backstop for entities with no measurable bounds, and for anything the
			// viewport test lets through because it is off screen already.
			const limited = clampScaleRatio(bounded);
			const target = new Vector3(
				entry.start.scale.x * limited.x,
				entry.start.scale.y * limited.y,
				entry.start.scale.z * limited.z,
			);
			const snapped = increment > 0 ? snapScale(target, increment) : target;
			writePose(entry.entity, {
				scale: new Vector3(snapped.x, snapped.y, snapped.z),
			});
		}
	}

	private describeOperation(session: DragSession): string {
		const verb = MODE_LABELS[session.mode];
		if (session.entries.length > 1) {
			return `${verb} ${session.entries.length} entities`;
		}
		const entity = session.entries[0]?.entity as any;
		const name = entity?.name
			|| String((entity?.constructor as any)?.type ?? '')
				.replace('Symbol(', '')
				.replace(')', '')
			|| 'Entity';
		return `${verb} ${name}`;
	}

	private selectionPivot(): Vector3 | null {
		const uuids = debugState.selectedEntityIds;
		if (!uuids.length) return null;

		const pivot = new Vector3();
		let count = 0;
		for (const uuid of uuids) {
			const entity = this.context.resolveEntity(uuid);
			if (!entity) continue;
			pivot.add(readPose(entity).position);
			count++;
		}
		if (!count) return null;
		return pivot.divideScalar(count);
	}
}

/**
 * Apply the inverse (or replay) of a committed operation.
 *
 * Transforms are written straight back; create and delete are inverted through
 * the stage's detach/restore bin, since the same entity instance — and uuid —
 * has to come back for the rest of the history stack to stay valid.
 */
export function applySceneOperationPoses(
	op: SceneOperationPayload,
	direction: 'undo' | 'redo',
	resolveEntity: (uuid: string) => GameEntity<any> | null,
): void {
	for (const entry of op.entries) {
		const pose = direction === 'undo' ? entry.before : entry.after;
		if (!pose) continue;
		const entity = resolveEntity(entry.uuid);
		if (!entity) continue;

		const quaternion = pose.quaternion
			?? (pose.rotation ? eulerToQuaternion(pose.rotation) : undefined);

		writePose(entity, {
			position: pose.position
				? new Vector3(pose.position.x, pose.position.y, pose.position.z)
				: undefined,
			quaternion: quaternion
				? new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
				: undefined,
			scale: pose.scale
				? new Vector3(pose.scale.x, pose.scale.y, pose.scale.z)
				: undefined,
		});

		if (pose.scale) {
			commitColliderScale(entity as any);
		}
	}
}
