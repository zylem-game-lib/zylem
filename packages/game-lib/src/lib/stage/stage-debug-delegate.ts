/**
 * Owns the stage's in-world debug/editor interaction layer.
 *
 * Self-manages around the global `debugState`, in two layers that switch on
 * independently. The tool layer — mouse listeners, physics raycasts to
 * hover/select/delete/spawn, the `DebugEntityCursor` highlight and the
 * `PlacementGhost` — is live whenever a tool is armed, so the toolbar's buttons
 * work on their own. The debug layer — the wasm simulation's collider
 * wireframes and the orbit camera — is the part `debugState.enabled` gates, and
 * is torn down when it goes off while the delegate stays alive to re-activate.
 *
 * Centralizes all of this so `ZylemStage` doesn't have to know about
 * raycasting, DOM input, or debug rendering.
 */
import { Box3, BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Raycaster, Vector2, Vector3 } from 'three';
import { subscribe } from 'valtio/vanilla';
import { nanoid } from 'nanoid';
import type { SceneOperationPayload } from '@zylem/bridge';
import { ZylemStage } from './zylem-stage';
import { StageCameraDebugDelegate } from './stage-camera-debug-delegate';
import {
	debugState,
	getDebugTool,
	getHoveredEntityId,
	getSnapSettings,
	isEditorInteractionActive,
	isTransformTool,
	registerDebugEntityResolver,
	resetHoveredEntity,
	setHoveredEntityId,
	setSelectedEntityId,
	type DebugTools,
	type TransformTool,
} from '../debug/debug-state';
import { registerEntityFocusContext } from '../debug/entity-focus';
import { publishGameNotice, publishSceneOperation } from '../bridge/game-bridge';
import { ConstructionGrid } from '../debug/construction-grid';
import { getEntityType } from '../entities/entity-registry';
import { DebugEntityCursor } from './debug-entity-cursor';
import { PlacementGhost } from './placement-ghost';
import { computePlacementPose, restPositionOnSurface } from './placement-geometry';
import {
	StageTransformTool,
	applySceneOperationPoses,
} from './stage-transform-tool';
import type { GizmoRay } from '../debug/transform-gizmo';
import type { GameEntity } from '../entities/entity';
import type { BaseNode } from '../core/base-node';
import type { ZylemCamera } from '../camera/zylem-camera';

export type AddEntityFactory = (params: { position: Vector3; normal?: Vector3 }) => Promise<any> | any;

export interface StageDebugDelegateOptions {
	maxRayDistance?: number;
	addEntityFactory?: AddEntityFactory | null;
}

const SELECT_TOOL_COLOR = 0x22ff22;
const DELETE_TOOL_COLOR = 0xff3333;

const _placementBounds = new Box3();
const _boundsSize = new Vector3();

/**
 * Self-managing debug delegate that subscribes to `debugState` internally.
 *
 * When debug is enabled it lazily initializes visuals and DOM listeners.
 * When debug is disabled it tears down visuals but stays alive so it can
 * re-activate without being recreated. Call `dispose()` to fully tear down.
 */
export class StageDebugDelegate {
	private stage: ZylemStage;
	private options: Required<StageDebugDelegateOptions>;
	private mouseNdc: Vector2 = new Vector2(-2, -2);
	private raycaster: Raycaster = new Raycaster();
	private domDisposeFns: Array<() => void> = [];
	private domListenersAttached = false;
	private debugCursor: DebugEntityCursor | null = null;
	private placementGhost: PlacementGhost | null = null;
	private debugLines: LineSegments | null = null;
	private cameraDebugDelegate: StageCameraDebugDelegate | null = null;
	private debugStateUnsubscribe: (() => void) | null = null;
	private focusContextUnregister: (() => void) | null = null;
	private entityResolverUnregister: (() => void) | null = null;
	private lastDebugEnabled: boolean | null = null;
	private warnedMissingAddFactory = false;
	private transformTool: StageTransformTool;
	private grid = new ConstructionGrid();
	private lastTool: string | null = null;
	/** Element the current gizmo drag captured, so pointerup is never missed. */
	private capturedPointer: { element: HTMLElement; pointerId: number } | null = null;

	constructor(stage: ZylemStage, options?: StageDebugDelegateOptions) {
		this.stage = stage;
		this.options = {
			maxRayDistance: options?.maxRayDistance ?? 5_000,
			addEntityFactory: options?.addEntityFactory ?? null,
		};

		this.transformTool = new StageTransformTool({
			getScene: () => this.stage.scene?.scene ?? null,
			getCamera: () => this.getDebugViewCamera()?.camera ?? null,
			resolveEntity: (uuid) => this.resolveEntity(uuid),
		});

		// Self-managing: sync with current state then subscribe for changes.
		// `debugState` also carries per-frame hover/selection writes, so only
		// an actual `enabled` transition may run the (expensive) activate path.
		this.syncWithDebugState();
		this.debugStateUnsubscribe = subscribe(debugState, () => {
			this.syncWithDebugState();
		});

		this.entityResolverUnregister = registerDebugEntityResolver((uuid) =>
			this.resolveEntity(uuid),
		);

		this.focusContextUnregister = registerEntityFocusContext({
			resolveEntity: (uuid) => this.resolveEntity(uuid),
			frameObject: (object) => {
				this.ensureCameraDebugDelegate();
				this.getDebugViewCamera()?.frameObject(object);
			},
			ensureDebugReady: () => {
				if (!debugState.enabled) {
					debugState.enabled = true;
				}
				// Activate now so the caller can frame immediately, and record
				// the transition so the queued subscription doesn't repeat it.
				this.lastDebugEnabled = true;
				this.activate();
			},
		});
	}

	/**
	 * Supply the factory the `add` tool uses to spawn entities at the clicked
	 * point. Without one the tool warns instead of silently doing nothing.
	 */
	setAddEntityFactory(factory: AddEntityFactory | null): void {
		this.options.addEntityFactory = factory;
		this.warnedMissingAddFactory = false;
	}

	/** Camera used for debug orbit / raycasts (active primary, usually `__debug__`). */
	private getDebugViewCamera(): ZylemCamera | null {
		return this.stage.cameraManagerRef?.primaryCamera
			?? this.stage.cameraManagerRef?.debugCamera
			?? this.stage.cameraRef
			?? null;
	}

	private resolveEntity(uuid: string): GameEntity<any> | null {
		const fromDebug = this.stage.entityDelegate.debugMap.get(uuid);
		if (fromDebug) return fromDebug as GameEntity<any>;

		const fromChildren = this.stage.entityDelegate.childrenMap.get(uuid);
		if (fromChildren) return fromChildren as GameEntity<any>;

		const fromCollision = this.stage.world?.collisionMap.get(uuid) as GameEntity<any> | undefined;
		return fromCollision ?? null;
	}

	/** Copy all stage children into debugMap so raycast/select tools work after enabling debug mid-session. */
	private populateDebugMap(): void {
		this.stage.entityDelegate.childrenMap.forEach((entity: BaseNode, uuid: string) => {
			this.stage.entityDelegate.debugMap.set(uuid, entity);
		});
	}

	private ensureCameraDebugDelegate(): void {
		const debugCam = this.stage.cameraManagerRef?.debugCamera ?? null;
		if (!debugCam) return;

		if (!this.cameraDebugDelegate) {
			this.cameraDebugDelegate = new StageCameraDebugDelegate(this.stage);
		}
		debugCam.setDebugDelegate(this.cameraDebugDelegate);
	}

	/**
	 * Activate/deactivate only when `debugState.enabled` actually flips.
	 * Hover and selection write to `debugState` every frame, and `activate()`
	 * rebuilds post-processing, so reacting to every notification would
	 * rebuild the render pipeline once per frame.
	 */
	private syncWithDebugState(): void {
		this.syncToolMode();
		this.syncGrid();

		const enabled = debugState.enabled;
		if (enabled === this.lastDebugEnabled) return;
		this.lastDebugEnabled = enabled;

		if (enabled) {
			this.activate();
		} else {
			this.deactivate();
		}
	}

	/** Hand the transform tool its mode whenever the active tool changes. */
	private syncToolMode(): void {
		const tool = debugState.tool;
		if (tool === this.lastTool) return;
		this.lastTool = tool;

		if (tool !== 'none') {
			this.ensureInteraction();
			// Raycast hits resolve through `debugMap`, which is otherwise only
			// filled when debug mode activates. Guarded by the tool transition
			// above, because `debugState` notifies on every hover write.
			this.populateDebugMap();
		}
		this.parkToolVisuals(tool);

		const transforming = isTransformTool(tool);
		// The orbit target otherwise re-aims the camera at the entity being
		// dragged, which sweeps the cursor ray and runs the drag away. Suspended
		// for the whole tool rather than just the drag, so the view holds still
		// between gestures too.
		this.getDebugViewCamera()?.setOrbitFollowEnabled(!transforming);

		this.transformTool.setMode(transforming ? (tool as TransformTool) : null);
	}

	private syncGrid(): void {
		const scene = this.stage.scene?.scene;
		if (!scene) return;
		this.grid.addTo(scene);
		this.grid.setIncrement(getSnapSettings().translate);
		this.grid.setVisible(debugState.gridVisible);
	}

	/** Initialize DOM listeners and switch rendering to the debug orbit camera. */
	private activate(): void {
		if (!this.domListenersAttached) {
			this.domListenersAttached = this.attachDomListeners();
		}

		this.populateDebugMap();
		this.stage.cameraManagerRef?.activateDebugCamera();
		const debugCam = this.stage.cameraManagerRef?.debugCamera ?? null;
		this.rebindPostProcessing(debugCam);
		this.ensureCameraDebugDelegate();

		if (document.pointerLockElement) {
			document.exitPointerLock();
		}
	}

	/** Tear down visuals and restore the gameplay primary camera. */
	private deactivate(): void {
		this.disposeDebugVisuals();
		this.transformTool.cancelDrag();
		this.grid.setVisible(false);

		const debugCam = this.stage.cameraManagerRef?.debugCamera;
		if (debugCam) {
			debugCam.setDebugDelegate(null);
		}
		if (this.stage.cameraRef && this.stage.cameraRef !== debugCam) {
			this.stage.cameraRef.setDebugDelegate(null);
		}
		this.cameraDebugDelegate = null;
		this.stage.cameraManagerRef?.deactivateDebugCamera();
		const restored = this.stage.cameraManagerRef?.primaryCamera ?? this.stage.cameraRef ?? null;
		this.rebindPostProcessing(restored);
	}

	private rebindPostProcessing(camera: ZylemCamera | null): void {
		const scene = this.stage.scene?.scene;
		const rm = this.stage.rendererManager;
		if (scene && rm && camera) {
			rm.setupPostProcessing(scene, camera.camera);
		}
	}

	/**
	 * Collider wireframes: the one overlay that really is debug-mode-only, since
	 * it draws the simulation itself rather than anything being edited.
	 */
	private initDebugVisuals(): void {
		if (this.debugLines || !this.stage.scene) return;

		this.debugLines = new LineSegments(
			new BufferGeometry(),
			new LineBasicMaterial({ vertexColors: true })
		);
		this.stage.scene.scene.add(this.debugLines);
		this.debugLines.visible = true;
	}

	private disposeDebugVisuals(): void {
		if (this.debugLines && this.stage.scene) {
			this.stage.scene.scene.remove(this.debugLines);
			this.debugLines.geometry.dispose();
			(this.debugLines.material as LineBasicMaterial).dispose();
			this.debugLines = null;
		}
	}

	/**
	 * Tool feedback, built on first use and kept for the delegate's life.
	 *
	 * Separate from {@link initDebugVisuals} because the hover highlight and the
	 * placement ghost belong to the tools, not to debug mode: they have to be
	 * available when a tool is armed with debug off.
	 */
	private ensureToolVisuals(): void {
		const scene = this.stage.scene?.scene;
		if (!scene) return;
		this.debugCursor ??= new DebugEntityCursor(scene);
		this.placementGhost ??= new PlacementGhost(scene);
	}

	/**
	 * Hide the overlays whose tool has just gone away.
	 *
	 * `update()` normally does this, but it stops being called once nothing is
	 * armed and debug is off — so the frame that would have hidden a disarmed
	 * Add's ghost never arrives, and the preview is left floating in the scene.
	 * Driven from the tool transition, which always fires.
	 */
	private parkToolVisuals(tool: DebugTools): void {
		if (tool !== 'add') this.placementGhost?.hide();
		if (tool !== 'select' && tool !== 'delete' && !debugState.pickMode) {
			this.debugCursor?.hide();
		}
	}

	private disposeToolVisuals(): void {
		this.debugCursor?.dispose();
		this.debugCursor = null;
		this.placementGhost?.dispose();
		this.placementGhost = null;
	}

	update(): void {
		const viewCamera = this.getDebugViewCamera();
		if (!this.stage.scene || !this.stage.world || !viewCamera) return;

		const { world } = this.stage;
		const tool = getDebugTool();

		// Attached here as well as on the tool transition, because the canvas does
		// not exist for the first frames: a tool armed before it does would
		// otherwise never get its listeners.
		this.ensureInteraction();
		this.ensureToolVisuals();

		if (debugState.enabled) {
			this.initDebugVisuals();
			this.updateColliderWireframes(world);
		} else {
			this.disposeDebugVisuals();
		}

		// Before the tool branches below, all of which return early.
		this.updatePlacementGhost(tool, world);

		// Gizmo tools own the pointer entirely; entity picking would fight them.
		if (isTransformTool(tool)) {
			this.debugCursor?.hide();
			this.transformTool.update();
			if (!this.transformTool.isDragging) {
				this.transformTool.hover(this.currentRay());
			}
			return;
		}
		this.transformTool.update();

		// Hover tools paint the cursor highlight. The add tool has its ghost
		// instead, and a highlight box around whatever is under the cursor would
		// only compete with it.
		const isHoverTool = tool === 'select' || tool === 'delete' || debugState.pickMode;

		if (!isHoverTool) {
			this.debugCursor?.hide();
			return;
		}

		const ray = this.currentRay();
		const hit = world.raycast(ray.origin, ray.direction, this.options.maxRayDistance);
		if (hit) {
			setHoveredEntityId(hit.uuid ?? null);
		} else {
			resetHoveredEntity();
		}

		const hoveredUuid = getHoveredEntityId();
		if (!hoveredUuid) {
			this.debugCursor?.hide();
			return;
		}
		const hoveredEntity: any = this.resolveEntity(hoveredUuid);
		const targetObject = hoveredEntity?.group ?? hoveredEntity?.mesh ?? null;
		if (!targetObject) {
			this.debugCursor?.hide();
			return;
		}
		switch (tool) {
			case 'select':
				this.debugCursor?.setColor(SELECT_TOOL_COLOR);
				break;
			case 'delete':
				this.debugCursor?.setColor(DELETE_TOOL_COLOR);
				break;
			default:
				this.debugCursor?.setColor(debugState.pickMode ? SELECT_TOOL_COLOR : 0xffffff);
				break;
		}
		this.debugCursor?.updateFromObject(targetObject);
	}

	/**
	 * Raycast at NDC coordinates (from a host that cannot send DOM pointer
	 * events, e.g. an overlay sitting on a preview iframe). Updates hover so
	 * the next `update()` paints the highlight.
	 */
	pickAtNdc(ndcX: number, ndcY: number): { uuid: string; name: string } | null {
		this.mouseNdc.set(ndcX, ndcY);
		const world = this.stage.world;
		if (!world || !this.getDebugViewCamera()) {
			resetHoveredEntity();
			return null;
		}
		const ray = this.currentRay();
		const hit = world.raycast(ray.origin, ray.direction, this.options.maxRayDistance);
		const uuid = hit?.uuid ?? null;
		if (!uuid) {
			resetHoveredEntity();
			return null;
		}
		setHoveredEntityId(uuid);
		const entity = this.resolveEntity(uuid);
		return { uuid, name: entity?.name ?? '' };
	}

	/** Collider wireframes, straight from the wasm simulation. */
	private updateColliderWireframes(
		world: NonNullable<ZylemStage['world']>,
	): void {
		if (!this.debugLines) return;

		const debugRender = world.simulation.getDebugRender();
		if (debugRender && debugRender.vertices.length > 0) {
			this.debugLines.geometry.setAttribute(
				'position',
				new BufferAttribute(new Float32Array(debugRender.vertices), 3),
			);
			this.debugLines.geometry.setAttribute(
				'color',
				new BufferAttribute(new Float32Array(debugRender.colors), 4),
			);
			this.debugLines.geometry.attributes.position.needsUpdate = true;
			this.debugLines.geometry.attributes.color.needsUpdate = true;
			this.debugLines.visible = true;
		} else {
			this.debugLines.visible = false;
		}
	}

	/**
	 * Make sure an armed tool can actually receive the pointer.
	 *
	 * The listeners outlive debug mode once attached — `deactivate()` leaves them
	 * in place and only `dispose()` removes them — so this only ever has to run
	 * until it succeeds.
	 */
	private ensureInteraction(): void {
		if (this.domListenersAttached || !isEditorInteractionActive()) return;
		this.domListenersAttached = this.attachDomListeners();
	}

	/**
	 * Drive the translucent preview of the armed entity type from the cursor.
	 *
	 * Runs while the game is paused as well as while it plays: only the
	 * fixed-step `step()` is pause-gated, so this pass still ticks and the
	 * ghost keeps following the mouse in a frozen scene — which is exactly when
	 * a scene is usually being built. It runs with debug mode off too, for the
	 * same reason: arming Add is a request to place something, not to inspect
	 * colliders.
	 *
	 * The ghost is a scene overlay, not an entity, so it is invisible to the
	 * physics raycast here and cannot preview itself.
	 */
	private updatePlacementGhost(
		tool: ReturnType<typeof getDebugTool>,
		world: NonNullable<ZylemStage['world']>,
	): void {
		const ghost = this.placementGhost;
		if (!ghost) return;

		const typeId = debugState.addTypeId;
		// Left built rather than torn down, so toggling between Select and Add
		// does not re-run the type's factory each time.
		if (tool !== 'add' || !typeId) {
			ghost.hide();
			return;
		}

		ghost.setType(typeId, debugState.addTypeProps ?? null);

		const ray = this.currentRay();
		const hit = world.raycast(ray.origin, ray.direction, this.options.maxRayDistance)
			?? null;

		// The same math the click runs, so the preview cannot lie about where the
		// entity lands. The ghost knows its own bounds, so unlike a real
		// placement — which is lifted after spawn — this shows the rested
		// position straight away.
		const placement = computePlacementPose(
			ray,
			hit,
			getSnapSettings(),
			ghost.measure(),
		);
		if (!placement) {
			ghost.hide();
			return;
		}
		ghost.showAt(placement.position);
	}

	/** Full teardown — unsubscribes from debugState and cleans up all resources. */
	dispose(): void {
		this.focusContextUnregister?.();
		this.focusContextUnregister = null;
		this.entityResolverUnregister?.();
		this.entityResolverUnregister = null;
		this.debugStateUnsubscribe?.();
		this.debugStateUnsubscribe = null;
		this.endPointerCapture();
		this.transformTool.dispose();
		this.grid.dispose();
		this.deactivate();
		// Not part of `deactivate()`: the cursor and ghost survive debug mode
		// being switched off, so only a full teardown may take them.
		this.disposeToolVisuals();
		this.domDisposeFns.forEach((fn) => fn());
		this.domDisposeFns = [];
		this.domListenersAttached = false;
	}

	/**
	 * Undo or redo a committed operation.
	 *
	 * The editor holds the history but cannot apply it: reverting a delete means
	 * producing the original entity, which only the stage can do. So the editor
	 * hands the record back and the inversion happens here.
	 */
	applySceneOperation(op: SceneOperationPayload, direction: 'undo' | 'redo'): void {
		const undoing = direction === 'undo';

		switch (op.kind) {
			case 'transform':
				applySceneOperationPoses(op, direction, (uuid) => this.resolveEntity(uuid));
				break;
			case 'create':
				// Undoing a create removes it; redoing puts the same instance back.
				for (const entry of op.entries) {
					if (undoing) {
						this.stage.entityDelegate.detachEntity(entry.uuid);
					} else {
						this.stage.entityDelegate.restoreEntity(entry.uuid);
					}
				}
				break;
			case 'delete':
				for (const entry of op.entries) {
					if (undoing) {
						this.stage.entityDelegate.restoreEntity(entry.uuid);
					} else {
						this.stage.entityDelegate.detachEntity(entry.uuid);
					}
				}
				break;
		}
	}

	/** The mouse ray in world space, from the last pointer position. */
	private currentRay(): GizmoRay {
		const camera = this.getDebugViewCamera();
		if (!camera) return { origin: new Vector3(), direction: new Vector3(0, 0, -1) };
		this.raycaster.setFromCamera(this.mouseNdc, camera.camera);
		return {
			origin: this.raycaster.ray.origin.clone(),
			direction: this.raycaster.ray.direction.clone().normalize(),
		};
	}

	private handleAction(ray: GizmoRay): void {
		const tool = getDebugTool();
		if (tool !== 'select' && tool !== 'delete' && tool !== 'add') return;

		const world = this.stage.world;
		const hit = world?.raycast(ray.origin, ray.direction, this.options.maxRayDistance)
			?? null;

		switch (tool) {
			case 'select': {
				const uuid = hit?.uuid ?? null;
				if (uuid && this.resolveEntity(uuid)) {
					setSelectedEntityId(uuid);
				} else {
					// Clicking empty space clears, which is what makes the gizmo
					// dismissable without another tool.
					setSelectedEntityId(null);
				}
				break;
			}
			case 'delete': {
				const uuid = hit?.uuid ?? null;
				if (!uuid) break;
				if (this.stage.entityDelegate.detachEntity(uuid)) {
					publishSceneOperation({
						opId: nanoid(10),
						kind: 'delete',
						label: 'Delete entity',
						entries: [{ uuid }],
					});
				}
				break;
			}
			case 'add':
				this.placeEntity(ray, hit);
				break;
		}
	}

	/**
	 * Spawn the armed entity type at the clicked point.
	 *
	 * Placement resolves in two steps because a click into empty sky is the
	 * common case when building a scene from nothing: the physics hit is
	 * preferred (the entity rests on the surface it was dropped onto), and
	 * otherwise the ray is intersected with the y=0 construction plane. Before
	 * this, clicking anywhere without an existing collider under the cursor did
	 * nothing at all.
	 */
	private placeEntity(
		ray: GizmoRay,
		hit: { uuid: string | null; distance: number; normal: [number, number, number] } | null,
	): void {
		// Shared with the ghost preview, so what you see is where it lands. The
		// surface lift is applied after spawn instead of here, once the entity's
		// real bounds exist.
		const placement = computePlacementPose(ray, hit, getSnapSettings());
		if (!placement) return;
		const { position: snapped, normal } = placement;

		const registration = debugState.addTypeId
			? getEntityType(debugState.addTypeId)
			: null;

		if (!registration && !this.options.addEntityFactory) {
			this.warnMissingAddSource();
			return;
		}

		const node = registration
			? registration.create({
				position: { x: snapped.x, y: snapped.y, z: snapped.z },
				normal: { x: normal.x, y: normal.y, z: normal.z },
				props: {
					...(registration.defaultProps ?? {}),
					...(debugState.addTypeProps ?? {}),
				},
			})
			: this.options.addEntityFactory!({ position: snapped, normal });

		if (!node) return;

		Promise.resolve(node)
			.then(async (resolvedNode) => {
				if (!resolvedNode) return;
				await this.stage.entityDelegate.spawnEntity(resolvedNode);
				this.restOnSurface(resolvedNode, snapped, normal);
				publishSceneOperation({
					opId: nanoid(10),
					kind: 'create',
					label: `Add ${registration?.label ?? 'entity'}`,
					entries: [{ uuid: resolvedNode.uuid }],
				});
			})
			.catch((error) => {
				console.error('Add tool: failed to spawn entity', error);
			});
	}

	/**
	 * Nudge a freshly placed entity out along the surface normal by half its
	 * own size, so it sits on the surface rather than half-buried in it.
	 *
	 * Runs after spawn because the entity's bounds are not known until its mesh
	 * exists.
	 */
	private restOnSurface(node: any, position: Vector3, normal: Vector3): void {
		const object = node?.group ?? node?.mesh;
		if (!object || typeof node.setPose !== 'function') return;

		_placementBounds.setFromObject(object);
		if (_placementBounds.isEmpty()) return;
		_placementBounds.getSize(_boundsSize);

		const rested = restPositionOnSurface(position, _boundsSize, normal);
		if (rested.equals(position)) return;
		node.setPose({ position: { x: rested.x, y: rested.y, z: rested.z } });
	}

	private warnMissingAddSource(): void {
		if (this.warnedMissingAddFactory) return;
		this.warnedMissingAddFactory = true;
		const message =
			'Add tool: no entity type is armed and no `addEntityFactory` is '
			+ 'configured, so there is nothing to spawn.';
		console.warn(message);
		publishGameNotice('warn', message);
	}

	private attachDomListeners(): boolean {
		const canvas = this.stage.rendererManager?.getDomElement();
		if (!canvas) return false;

		const trackPointer = (e: PointerEvent | MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
			this.mouseNdc.set(x, y);
		};

		const onPointerMove = (e: PointerEvent) => {
			trackPointer(e);
			if (!this.transformTool.isDragging) return;
			// Read the modifier per event: a drag that starts snapped and is then
			// freed (or vice versa) needs no keydown/keyup tracking, and a keyup
			// lost to a blurred window cannot leave snapping stuck off.
			this.transformTool.pointerMove(this.currentRay(), e.altKey);
		};

		const onPointerDown = (e: PointerEvent) => {
			if (e.button !== 0) return;
			trackPointer(e);
			const ray = this.currentRay();

			if (this.transformTool.pointerDown(ray)) {
				this.beginPointerCapture(canvas, e.pointerId);
				return;
			}
			this.handleAction(ray);
		};

		const onPointerUp = () => {
			if (!this.transformTool.isDragging) return;
			this.transformTool.pointerUp();
			this.endPointerCapture();
		};

		canvas.addEventListener('pointermove', onPointerMove);
		canvas.addEventListener('pointerdown', onPointerDown);
		canvas.addEventListener('pointerup', onPointerUp);
		// A cancelled pointer (browser gesture, window blur) never delivers
		// pointerup, so without this the drag would never commit or release.
		canvas.addEventListener('pointercancel', onPointerUp);

		this.domDisposeFns.push(
			() => canvas.removeEventListener('pointermove', onPointerMove),
			() => canvas.removeEventListener('pointerdown', onPointerDown),
			() => canvas.removeEventListener('pointerup', onPointerUp),
			() => canvas.removeEventListener('pointercancel', onPointerUp),
		);
		return true;
	}

	/**
	 * Own the pointer for the duration of a gizmo drag.
	 *
	 * Capture keeps events coming even when the cursor leaves the canvas, which
	 * happens constantly when dragging an axis toward the edge of the viewport.
	 * Orbit is suspended for the same window so the drag does not also swing the
	 * camera.
	 */
	private beginPointerCapture(element: HTMLElement, pointerId: number): void {
		this.getDebugViewCamera()?.setOrbitInteractionEnabled(false);
		try {
			element.setPointerCapture(pointerId);
			this.capturedPointer = { element, pointerId };
		} catch {
			this.capturedPointer = null;
		}
	}

	private endPointerCapture(): void {
		this.getDebugViewCamera()?.setOrbitInteractionEnabled(true);
		if (!this.capturedPointer) return;
		try {
			this.capturedPointer.element.releasePointerCapture(
				this.capturedPointer.pointerId,
			);
		} catch { /* already released */ }
		this.capturedPointer = null;
	}
}
