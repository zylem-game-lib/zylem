/**
 * In-scene translate / rotate / scale gizmo.
 *
 * Lives in the game rather than the editor overlay because it needs the camera,
 * the scene graph, and per-frame screen-space sizing — none of which cross the
 * bridge. The editor only chooses the mode and records what was committed.
 *
 * Responsibilities stop at geometry, handle picking, and *raw* drag deltas.
 * Snapping is deliberately not done here: the grid is absolute world-space, so
 * it has to be applied to the resulting target rather than to a delta, and the
 * caller is the one holding each entity's drag-start pose.
 */

import {
	BoxGeometry,
	ConeGeometry,
	CylinderGeometry,
	Group,
	Mesh,
	MeshBasicMaterial,
	OrthographicCamera,
	PerspectiveCamera,
	PlaneGeometry,
	Quaternion,
	Raycaster,
	TorusGeometry,
	Vector3,
	type BufferGeometry,
	type Camera,
	type Object3D,
	type Scene,
} from 'three';

export type GizmoMode = 'translate' | 'rotate' | 'scale';

/** Single-axis, planar, and uniform handle identifiers. */
export type GizmoAxis = 'x' | 'y' | 'z' | 'xy' | 'yz' | 'xz' | 'xyz';

/** A raw, unsnapped drag result in world space. */
export type GizmoDelta =
	| { kind: 'translate'; offset: Vector3 }
	| { kind: 'rotate'; axis: Vector3; angle: number }
	| { kind: 'scale'; factor: Vector3 };

/** A mouse ray in world space. */
export interface GizmoRay {
	origin: Vector3;
	direction: Vector3;
}

const AXIS_COLORS: Record<string, number> = {
	x: 0xff3b53,
	y: 0x4cd94c,
	z: 0x3b82f6,
	xy: 0x3b82f6,
	yz: 0xff3b53,
	xz: 0x4cd94c,
	xyz: 0xdddddd,
};

const HIGHLIGHT_COLOR = 0xffd23b;

/** How large the gizmo appears, as a fraction of viewport height. */
const SCREEN_SIZE = 0.16;

const AXIS_VECTORS: Record<string, Vector3> = {
	x: new Vector3(1, 0, 0),
	y: new Vector3(0, 1, 0),
	z: new Vector3(0, 0, 1),
};

/** Plane handles are defined by their normal. */
const PLANE_NORMALS: Record<string, Vector3> = {
	xy: new Vector3(0, 0, 1),
	yz: new Vector3(1, 0, 0),
	xz: new Vector3(0, 1, 0),
};

interface HandleRecord {
	axis: GizmoAxis;
	visuals: Mesh[];
	picker: Mesh;
}

/** Drag state captured on pointer down. */
interface DragSession {
	axis: GizmoAxis;
	mode: GizmoMode;
	pivot: Vector3;
	/** Position along the axis line at drag start (axis modes). */
	startAxisValue: number;
	/** Hit point at drag start (plane modes). */
	startPoint: Vector3;
	/** Angle at drag start (rotate). */
	startAngle: number;
	/** Distance from pivot in the camera plane at drag start (uniform scale). */
	startRadius: number;
}

/**
 * Most a drag may amplify pointer motion before it is refused.
 *
 * Both the axis and plane solves divide by a term that vanishes as the handle
 * turns edge-on to the view, so the world distance per pixel grows without
 * bound: sighting almost straight down an axis, a few pixels of pointer motion
 * used to fling the entity out of the scene. Refusing the gesture instead keeps
 * the entity still, which reads as "that handle can't be dragged from here"
 * rather than as a glitch.
 */
const MAX_DRAG_GAIN = 12;

/** Corresponding limit on the ray/axis alignment, from {@link MAX_DRAG_GAIN}. */
const MAX_AXIS_ALIGNMENT = Math.sqrt(1 - 1 / MAX_DRAG_GAIN);

/** Corresponding limit on how edge-on a plane handle may be dragged. */
const MIN_PLANE_INCIDENCE = 1 / MAX_DRAG_GAIN;

/**
 * Whether a handle along `axis` is too aligned with the view to drag.
 *
 * Shared with picking, so a handle that cannot be dragged also cannot be
 * grabbed — otherwise it looks live and then does nothing.
 */
export function isAxisTooAligned(viewDirection: Vector3, axis: Vector3): boolean {
	return Math.abs(viewDirection.dot(axis)) > MAX_AXIS_ALIGNMENT;
}

/**
 * Closest point along an infinite line to a ray, as a distance along the line.
 *
 * Returns `null` when the ray is close enough to parallel with the line that the
 * closest point becomes unstable; see {@link MAX_DRAG_GAIN}.
 */
export function closestAxisValue(
	ray: GizmoRay,
	origin: Vector3,
	axis: Vector3,
): number | null {
	const w0 = _v1.copy(ray.origin).sub(origin);
	const b = ray.direction.dot(axis);
	const denominator = 1 - b * b;
	if (denominator < 1 / MAX_DRAG_GAIN) return null;
	return (w0.dot(axis) - b * w0.dot(ray.direction)) / denominator;
}

/**
 * Intersect a ray with the plane through `origin` with the given normal.
 *
 * Returns `null` for a plane seen too close to edge-on, where the hit point
 * races away across the plane for very little pointer motion.
 */
export function intersectPlane(
	ray: GizmoRay,
	origin: Vector3,
	normal: Vector3,
	target: Vector3,
): Vector3 | null {
	const denominator = normal.dot(ray.direction);
	if (Math.abs(denominator) < MIN_PLANE_INCIDENCE) return null;
	const distance = _v1.copy(origin).sub(ray.origin).dot(normal) / denominator;
	if (distance < 0) return null;
	return target.copy(ray.direction).multiplyScalar(distance).add(ray.origin);
}

const _v1 = new Vector3();
const _v2 = new Vector3();
const _v3 = new Vector3();
const _cameraPosition = new Vector3();
const _quaternion = new Quaternion();

export class TransformGizmo {
	/** Root added to the scene; carries the pivot transform. */
	readonly root = new Group();

	private scene: Scene | null = null;
	private modeGroups: Record<GizmoMode, Group> = {
		translate: new Group(),
		rotate: new Group(),
		scale: new Group(),
	};
	private handles: Record<GizmoMode, HandleRecord[]> = {
		translate: [],
		rotate: [],
		scale: [],
	};
	private materials: MeshBasicMaterial[] = [];
	private geometries: BufferGeometry[] = [];
	private mode: GizmoMode = 'translate';
	private highlighted: GizmoAxis | null = null;
	private drag: DragSession | null = null;
	private raycaster = new Raycaster();

	constructor() {
		this.root.name = '__zylem_transform_gizmo__';
		// Drawn after the scene and without depth testing, so handles stay
		// reachable even when the entity they belong to encloses them.
		this.root.renderOrder = 1_000;
		this.root.visible = false;
		this.buildTranslate();
		this.buildRotate();
		this.buildScale();
		for (const mode of Object.keys(this.modeGroups) as GizmoMode[]) {
			this.root.add(this.modeGroups[mode]);
		}
		this.applyModeVisibility();
	}

	// ── Lifecycle ───────────────────────────────────────────────────────────

	addTo(scene: Scene): void {
		if (this.scene === scene) return;
		this.scene = scene;
		scene.add(this.root);
	}

	removeFromScene(): void {
		if (!this.scene) return;
		this.scene.remove(this.root);
		this.scene = null;
	}

	dispose(): void {
		this.removeFromScene();
		for (const geometry of this.geometries) geometry.dispose();
		for (const material of this.materials) material.dispose();
		this.geometries = [];
		this.materials = [];
	}

	// ── Configuration ───────────────────────────────────────────────────────

	setMode(mode: GizmoMode): void {
		if (this.mode === mode) return;
		this.mode = mode;
		this.applyModeVisibility();
	}

	getMode(): GizmoMode {
		return this.mode;
	}

	/** Place the gizmo at a pivot and show it. */
	show(pivot: Vector3): void {
		this.root.position.copy(pivot);
		this.root.visible = true;
	}

	hide(): void {
		this.root.visible = false;
		this.setHighlight(null);
	}

	get visible(): boolean {
		return this.root.visible;
	}

	get pivot(): Vector3 {
		return this.root.position;
	}

	/**
	 * Keep the gizmo a constant size on screen.
	 *
	 * A world-sized gizmo is unusable in an orbit view: it fills the screen up
	 * close and disappears from a distance.
	 */
	update(camera: Camera): void {
		if (!this.root.visible) return;

		let scale: number;
		if ((camera as PerspectiveCamera).isPerspectiveCamera) {
			const perspective = camera as PerspectiveCamera;
			_cameraPosition.setFromMatrixPosition(perspective.matrixWorld);
			const distance = _cameraPosition.distanceTo(this.root.position);
			const frustumHeight =
				2 * distance * Math.tan((perspective.fov * Math.PI) / 360);
			scale = frustumHeight * SCREEN_SIZE;
		} else if ((camera as OrthographicCamera).isOrthographicCamera) {
			const orthographic = camera as OrthographicCamera;
			const frustumHeight =
				(orthographic.top - orthographic.bottom) / (orthographic.zoom || 1);
			scale = frustumHeight * SCREEN_SIZE;
		} else {
			scale = 1;
		}

		this.root.scale.setScalar(Math.max(scale, 1e-4));
	}

	// ── Picking ─────────────────────────────────────────────────────────────

	/**
	 * Which handle a ray hits, or `null`.
	 *
	 * Raycasts the gizmo's own meshes rather than the physics world. Handles are
	 * render-only objects with no colliders, so the physics raycast used to pick
	 * entities cannot see them at all.
	 */
	pick(ray: GizmoRay): GizmoAxis | null {
		if (!this.root.visible) return null;

		this.raycaster.set(ray.origin, ray.direction);
		// Handles the current view cannot drag are left out entirely, so the
		// nearest *usable* one wins instead of the geometrically nearest one
		// swallowing the click and doing nothing.
		const pickers: Object3D[] = this.handles[this.mode]
			.filter((handle) => this.isHandleDraggable(handle.axis, ray))
			.map((handle) => handle.picker);
		const hits = this.raycaster.intersectObjects(pickers, false);
		if (!hits.length) return null;
		return (hits[0].object.userData.gizmoAxis as GizmoAxis) ?? null;
	}

	/**
	 * Whether a handle can be dragged from the current viewing angle.
	 *
	 * Each handle type degenerates differently: an arrow aimed at the camera has
	 * no screen-space direction left to follow, while a plane quad or rotation
	 * ring seen edge-on turns a pixel of motion into a huge sweep across it.
	 */
	private isHandleDraggable(axis: GizmoAxis, ray: GizmoRay): boolean {
		if (axis === 'xyz') return true;

		if (this.isPlaneAxis(axis)) {
			return Math.abs(ray.direction.dot(PLANE_NORMALS[axis])) >= MIN_PLANE_INCIDENCE;
		}

		const axisVector = AXIS_VECTORS[axis];
		if (this.mode === 'rotate') {
			// A ring's plane normal *is* its axis, so it degenerates edge-on.
			return Math.abs(ray.direction.dot(axisVector)) >= MIN_PLANE_INCIDENCE;
		}
		return !isAxisTooAligned(ray.direction, axisVector);
	}

	/** Tint a handle to show it is hovered or being dragged. */
	setHighlight(axis: GizmoAxis | null): void {
		if (this.highlighted === axis) return;
		this.highlighted = axis;
		for (const mode of Object.keys(this.handles) as GizmoMode[]) {
			for (const handle of this.handles[mode]) {
				const color = handle.axis === axis
					? HIGHLIGHT_COLOR
					: AXIS_COLORS[handle.axis];
				for (const visual of handle.visuals) {
					(visual.material as MeshBasicMaterial).color.setHex(color);
				}
			}
		}
	}

	// ── Dragging ────────────────────────────────────────────────────────────

	/**
	 * Begin a drag on a handle.
	 *
	 * @returns `false` when the gesture cannot be tracked (a near-parallel view
	 * of the drag axis), so the caller can ignore the press rather than start a
	 * drag that would jump.
	 */
	beginDrag(axis: GizmoAxis, ray: GizmoRay, camera: Camera): boolean {
		const pivot = this.root.position.clone();
		const session: DragSession = {
			axis,
			mode: this.mode,
			pivot,
			startAxisValue: 0,
			startPoint: new Vector3(),
			startAngle: 0,
			startRadius: 0,
		};

		if (axis === 'xyz') {
			const radius = this.cameraPlaneRadius(ray, pivot, camera);
			if (radius === null || radius < 1e-4) return false;
			session.startRadius = radius;
		} else if (this.isPlaneAxis(axis)) {
			const normal = PLANE_NORMALS[axis];
			if (!intersectPlane(ray, pivot, normal, session.startPoint)) return false;
		} else if (this.mode === 'rotate') {
			const normal = AXIS_VECTORS[axis];
			const angle = this.angleOnPlane(ray, pivot, normal);
			if (angle === null) return false;
			session.startAngle = angle;
		} else {
			const value = closestAxisValue(ray, pivot, AXIS_VECTORS[axis]);
			if (value === null) return false;
			session.startAxisValue = value;
			if (this.mode === 'scale' && Math.abs(value) < 1e-4) return false;
		}

		this.drag = session;
		this.setHighlight(axis);
		return true;
	}

	/** Raw delta for the current pointer position, or `null` when unusable. */
	updateDrag(ray: GizmoRay, camera: Camera): GizmoDelta | null {
		const session = this.drag;
		if (!session) return null;

		if (session.mode === 'rotate') {
			const normal = AXIS_VECTORS[session.axis] ?? AXIS_VECTORS.y;
			const angle = this.angleOnPlane(ray, session.pivot, normal);
			if (angle === null) return null;
			return {
				kind: 'rotate',
				axis: normal.clone(),
				angle: angle - session.startAngle,
			};
		}

		if (session.mode === 'scale') {
			if (session.axis === 'xyz') {
				const radius = this.cameraPlaneRadius(ray, session.pivot, camera);
				if (radius === null) return null;
				const factor = radius / session.startRadius;
				return { kind: 'scale', factor: new Vector3(factor, factor, factor) };
			}
			const value = closestAxisValue(ray, session.pivot, AXIS_VECTORS[session.axis]);
			if (value === null) return null;
			const ratio = value / session.startAxisValue;
			const factor = new Vector3(1, 1, 1);
			// Per-axis handles scale only their own axis; the centre handle above
			// is the uniform one.
			(factor as any)[session.axis] = ratio;
			return { kind: 'scale', factor };
		}

		if (this.isPlaneAxis(session.axis)) {
			const normal = PLANE_NORMALS[session.axis];
			const point = intersectPlane(ray, session.pivot, normal, _v2);
			if (!point) return null;
			return { kind: 'translate', offset: point.clone().sub(session.startPoint) };
		}

		const axis = AXIS_VECTORS[session.axis];
		const value = closestAxisValue(ray, session.pivot, axis);
		if (value === null) return null;
		return {
			kind: 'translate',
			offset: axis.clone().multiplyScalar(value - session.startAxisValue),
		};
	}

	endDrag(): void {
		this.drag = null;
		this.setHighlight(null);
	}

	get isDragging(): boolean {
		return this.drag !== null;
	}

	get draggingAxis(): GizmoAxis | null {
		return this.drag?.axis ?? null;
	}

	// ── Internals ───────────────────────────────────────────────────────────

	private isPlaneAxis(axis: GizmoAxis): boolean {
		return axis === 'xy' || axis === 'yz' || axis === 'xz';
	}

	/** Signed angle of the ray's hit point around `normal`, in radians. */
	private angleOnPlane(
		ray: GizmoRay,
		pivot: Vector3,
		normal: Vector3,
	): number | null {
		const point = intersectPlane(ray, pivot, normal, _v2);
		if (!point) return null;
		const radial = _v3.copy(point).sub(pivot);
		if (radial.lengthSq() < 1e-8) return null;

		// Build a stable basis in the rotation plane.
		const reference = Math.abs(normal.y) > 0.9
			? AXIS_VECTORS.x
			: AXIS_VECTORS.y;
		const u = _v1.copy(reference).cross(normal).normalize();
		const v = new Vector3().copy(normal).cross(u);
		return Math.atan2(radial.dot(v), radial.dot(u));
	}

	/** Distance from pivot to the ray hit on the camera-facing plane. */
	private cameraPlaneRadius(
		ray: GizmoRay,
		pivot: Vector3,
		camera: Camera,
	): number | null {
		_quaternion.setFromRotationMatrix(camera.matrixWorld);
		const normal = new Vector3(0, 0, 1).applyQuaternion(_quaternion);
		const point = intersectPlane(ray, pivot, normal, _v2);
		if (!point) return null;
		return point.distanceTo(pivot);
	}

	private applyModeVisibility(): void {
		for (const mode of Object.keys(this.modeGroups) as GizmoMode[]) {
			this.modeGroups[mode].visible = mode === this.mode;
		}
	}

	private makeMaterial(axis: GizmoAxis, opacity: number): MeshBasicMaterial {
		const material = new MeshBasicMaterial({
			color: AXIS_COLORS[axis],
			transparent: true,
			opacity,
			depthTest: false,
			depthWrite: false,
			toneMapped: false,
		});
		this.materials.push(material);
		return material;
	}

	private track<T extends BufferGeometry>(geometry: T): T {
		this.geometries.push(geometry);
		return geometry;
	}

	/**
	 * An invisible, generously sized mesh used only for hit testing.
	 *
	 * The visible shafts and rings are a couple of pixels wide, which is
	 * miserable to click. The raycaster still reaches `visible: false` meshes,
	 * so picking accuracy is decoupled from how thin the handle looks.
	 */
	private makePicker(
		axis: GizmoAxis,
		geometry: BufferGeometry,
		configure: (mesh: Mesh) => void,
	): Mesh {
		const material = new MeshBasicMaterial({ visible: false });
		this.materials.push(material);
		const mesh = new Mesh(this.track(geometry), material);
		mesh.visible = false;
		mesh.userData.gizmoAxis = axis;
		configure(mesh);
		return mesh;
	}

	private orientAlongAxis(object: Object3D, axis: 'x' | 'y' | 'z'): void {
		// Shaft geometry is built along +Y, so X and Z need a quarter turn.
		if (axis === 'x') object.rotation.z = -Math.PI / 2;
		if (axis === 'z') object.rotation.x = Math.PI / 2;
	}

	private buildTranslate(): void {
		const group = this.modeGroups.translate;

		for (const axis of ['x', 'y', 'z'] as const) {
			const material = this.makeMaterial(axis, 1);
			const shaft = new Mesh(
				this.track(new CylinderGeometry(0.012, 0.012, 0.7, 8)),
				material,
			);
			shaft.position.y = 0.35;
			const tip = new Mesh(this.track(new ConeGeometry(0.045, 0.16, 12)), material);
			tip.position.y = 0.78;

			const holder = new Group();
			holder.add(shaft, tip);
			this.orientAlongAxis(holder, axis);

			const picker = this.makePicker(
				axis,
				new CylinderGeometry(0.1, 0.1, 0.9, 6),
				(mesh) => {
					mesh.position.y = 0.45;
				},
			);
			const pickerHolder = new Group();
			pickerHolder.add(picker);
			this.orientAlongAxis(pickerHolder, axis);

			group.add(holder, pickerHolder);
			this.handles.translate.push({ axis, visuals: [shaft, tip], picker });
		}

		for (const axis of ['xy', 'yz', 'xz'] as const) {
			const material = this.makeMaterial(axis, 0.35);
			const quad = new Mesh(this.track(new PlaneGeometry(0.22, 0.22)), material);
			this.positionPlaneHandle(quad, axis);

			const picker = this.makePicker(axis, new PlaneGeometry(0.22, 0.22), (mesh) => {
				this.positionPlaneHandle(mesh, axis);
			});

			group.add(quad, picker);
			this.handles.translate.push({ axis, visuals: [quad], picker });
		}
	}

	private positionPlaneHandle(object: Object3D, axis: 'xy' | 'yz' | 'xz'): void {
		const offset = 0.28;
		if (axis === 'xy') {
			object.position.set(offset, offset, 0);
		} else if (axis === 'yz') {
			object.position.set(0, offset, offset);
			object.rotation.y = Math.PI / 2;
		} else {
			object.position.set(offset, 0, offset);
			object.rotation.x = -Math.PI / 2;
		}
	}

	private buildRotate(): void {
		const group = this.modeGroups.rotate;

		for (const axis of ['x', 'y', 'z'] as const) {
			const material = this.makeMaterial(axis, 1);
			const ring = new Mesh(
				this.track(new TorusGeometry(0.68, 0.01, 6, 64)),
				material,
			);
			this.orientRing(ring, axis);

			const picker = this.makePicker(
				axis,
				new TorusGeometry(0.68, 0.08, 4, 24),
				(mesh) => this.orientRing(mesh, axis),
			);

			group.add(ring, picker);
			this.handles.rotate.push({ axis, visuals: [ring], picker });
		}
	}

	private orientRing(object: Object3D, axis: 'x' | 'y' | 'z'): void {
		// Torus lies in the XY plane, so its normal starts as +Z.
		if (axis === 'x') object.rotation.y = Math.PI / 2;
		if (axis === 'y') object.rotation.x = Math.PI / 2;
	}

	private buildScale(): void {
		const group = this.modeGroups.scale;

		for (const axis of ['x', 'y', 'z'] as const) {
			const material = this.makeMaterial(axis, 1);
			const shaft = new Mesh(
				this.track(new CylinderGeometry(0.012, 0.012, 0.7, 8)),
				material,
			);
			shaft.position.y = 0.35;
			const cap = new Mesh(this.track(new BoxGeometry(0.09, 0.09, 0.09)), material);
			cap.position.y = 0.74;

			const holder = new Group();
			holder.add(shaft, cap);
			this.orientAlongAxis(holder, axis);

			const picker = this.makePicker(
				axis,
				new CylinderGeometry(0.1, 0.1, 0.85, 6),
				(mesh) => {
					mesh.position.y = 0.43;
				},
			);
			const pickerHolder = new Group();
			pickerHolder.add(picker);
			this.orientAlongAxis(pickerHolder, axis);

			group.add(holder, pickerHolder);
			this.handles.scale.push({ axis, visuals: [shaft, cap], picker });
		}

		// Centre handle scales all three axes together.
		const material = this.makeMaterial('xyz', 0.9);
		const cube = new Mesh(this.track(new BoxGeometry(0.13, 0.13, 0.13)), material);
		const picker = this.makePicker('xyz', new BoxGeometry(0.22, 0.22, 0.22), () => {});
		group.add(cube, picker);
		this.handles.scale.push({ axis: 'xyz', visuals: [cube], picker });
	}
}
