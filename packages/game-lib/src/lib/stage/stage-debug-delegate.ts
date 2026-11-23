/**
 * Owns the stage's in-world debug/editor interaction layer.
 *
 * Self-manages around the global `debugState`, in two layers that switch on
 * independently. The tool layer — mouse listeners, physics raycasts to
 * hover/select/delete/spawn, the `DebugEntityCursor` highlight and the
 * `PlacementGhost` — is live whenever a tool is armed, so the toolbar's buttons
 * work on their own. The debug layer — the wasm simulation's collider
 * wireframes — is the part `debugState.enabled` gates, and is torn down when
 * it goes off while the delegate stays alive to re-activate. This delegate
 * does not switch cameras; the bridge shows the free camera when debug is
 * enabled. Picking and gizmos use whichever camera is rendering.
 *
 * Centralizes all of this so `ZylemStage` doesn't have to know about
 * raycasting, DOM input, or debug rendering.
 */
import { Box3, BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Raycaster, Vector2, Vector3 } from 'three';
import { subscribe } from 'valtio/vanilla';
import { nanoid } from 'nanoid';
import {
	getZylemBridge,
	type EntityApplySwatchPayload,
	type LevelDocument,
	type LevelGesture,
	type LevelSelectPayload,
	type LevelSyncPayload,
	type SceneOperationPayload,
} from '@zylem/bridge';
import { StageBodyKind, type EntityHandle } from '@zylem/behaviors/core';
import { EDITOR_CAMERAS, editorCamerasAreAttached } from '../camera/editor-camera-session';
import { ZylemStage } from './zylem-stage';
import {
	debugState,
	getDebugTool,
	getHoveredEntityId,
	getSnapSettings,
	isEditorInteractionActive,
	isTransformTool,
	registerDebugEntityResolver,
	removeSelectedEntityIds,
	resetHoveredEntity,
	setHoveredEntityId,
	setSelectedEntityId,
	toggleSelectedEntityId,
	type DebugTools,
	type TransformTool,
} from '../debug/debug-state';
import { registerEntityFocusContext } from '../debug/entity-focus';
import { resolveSelectionBounds } from '../debug/selection-bounds';
import { publishGameNotice, publishSceneOperation } from '../bridge/game-bridge';
import { LevelSession, type LevelSessionHost } from '../level/level-session';
import { createZone } from '../entities/zone';
import { ConstructionGrid } from '../debug/construction-grid';
import { getEntityType } from '../entities/entity-registry';
import { DebugEntityCursor } from './debug-entity-cursor';
import { PlacementGhost } from './placement-ghost';
import { computePlacementPose, restPositionOnSurface } from './placement-geometry';
import {
	StageTransformTool,
	applySceneOperationPoses,
} from './stage-transform-tool';
import type { SwatchApplyOutcome } from '../bridge/game-bridge';
import {
	createSwatchApplier,
	emptySwatchApplyOutcome,
	type InstalledSwatchApplier,
} from './swatch-apply-hook';
import { StageMarqueeSelect } from './stage-marquee-select';
import { SelectionHighlight } from './selection-highlight';
import { HudOutline, type HudMark } from './hud-outline';
import { hudRectOf, pickHud } from './hud-pick';
import { chooseSelectTarget, type SelectTarget } from './select-target';
import { isHudEntity } from '../entities/screen-anchor';
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
/** The hover and selection colors again, for the HUD outlines drawn in the DOM. */
const HUD_HOVER_COLOR = '#22ff22';
const HUD_SELECTED_COLOR = '#ffd23f';

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
	private debugStateUnsubscribe: (() => void) | null = null;
	private focusContextUnregister: (() => void) | null = null;
	private entityResolverUnregister: (() => void) | null = null;
	private lastDebugEnabled: boolean | null = null;
	private warnedMissingAddFactory = false;
	private transformTool: StageTransformTool;
	private swatchApplier: InstalledSwatchApplier | null = null;
	private marquee: StageMarqueeSelect;
	private selectionHighlight: SelectionHighlight | null = null;
	private hudOutline = new HudOutline();
	private selectionBoundsPool: Box3[] = [];
	private hoverBounds = new Box3();
	private grid = new ConstructionGrid();
	private levelSession: LevelSession;
	/** The press belongs to the level session, through pointerup. */
	private levelPointer = false;
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

		this.marquee = new StageMarqueeSelect({
			getCamera: () => this.getDebugViewCamera()?.camera ?? null,
			forEachEntity: (visit) => this.forEachSelectableEntity(visit),
		});

		this.levelSession = new LevelSession(this.levelSessionHost());

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
				const manager = this.stage.cameraManagerRef;
				const frame = () => {
					if (manager && !manager.isEditorViewActive() && manager.hasEditorCameras()) {
						manager.activateCameraById(EDITOR_CAMERAS.free);
					}
					this.getDebugViewCamera()?.frameObject(object);
				};
				if (manager && editorCamerasAreAttached() && !manager.hasEditorCameras()) {
					void manager.ensureEditorCameras().then(frame);
					return;
				}
				frame();
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

		this.stage.cameraManagerRef?.setEditorEntityBounds(() => this.editorEntityBoxes());
	}

	/**
	 * Supply the factory the `add` tool uses to spawn entities at the clicked
	 * point. Without one the tool warns instead of silently doing nothing.
	 */
	setAddEntityFactory(factory: AddEntityFactory | null): void {
		this.options.addEntityFactory = factory;
		this.warnedMissingAddFactory = false;
	}

	/** Show the level document as an edit preview. Brush faces, no collision. */
	syncLevel(payload: LevelSyncPayload): void {
		this.levelSession.sync(payload);
		this.stage.navigation.sync(payload.document);
		this.syncTransformTool();
		this.syncGrid();
	}

	/** Respawn the document for play: hull collision, hidden brush faces, live zones. */
	playLevel(document: LevelDocument): void {
		this.levelSession.play(document);
		this.stage.navigation.setTool({ tool: 'none' });
		this.stage.navigation.sync(document);
		this.syncTransformTool();
		this.syncGrid();
	}

	/** Remove the preview and any play collision. Stage entities stay. */
	closeLevel(): void {
		this.levelSession.close();
		this.stage.navigation.clear();
		this.syncTransformTool();
		this.syncGrid();
	}

	private levelSessionHost(): LevelSessionHost {
		return {
			getScene: () => this.stage.scene?.scene ?? null,
			cameraId: () => this.stage.cameraManagerRef?.activeEditorCameraId() ?? null,
			viewDirection: () => {
				const camera = this.getDebugViewCamera()?.camera;
				if (!camera) return { x: 0, y: -1, z: 0 };
				camera.updateMatrixWorld(true);
				const direction = new Vector3();
				camera.getWorldDirection(direction);
				return { x: direction.x, y: direction.y, z: direction.z };
			},
			camera: () => this.getDebugViewCamera()?.camera ?? null,
			viewport: () => {
				const rect = this.stage.rendererManager?.getDomElement().getBoundingClientRect();
				return rect && rect.width > 0 && rect.height > 0
					? { width: rect.width, height: rect.height }
					: null;
			},
			physicsHit: (ray: { origin: Vector3; direction: Vector3 }) => {
				const hit = this.stage.world?.raycast(
					ray.origin,
					ray.direction,
					this.options.maxRayDistance,
				);
				if (!hit) return null;
				return { distance: hit.distance, normal: hit.normal };
			},
			spawnZone: async (zone: { name: string; position: { x: number; y: number; z: number }; size: { x: number; y: number; z: number } }) => {
				const node = createZone({
					name: zone.name,
					position: zone.position,
					size: zone.size,
					editorOwned: true,
				});
				await this.stage.spawnEntity(node);
				return node.uuid ?? null;
			},
			detach: (uuid: string) => {
				this.stage.entityDelegate.detachEntity(uuid);
			},
			spawnHulls: (hulls: Float32Array[]) => {
				const simulation = this.stage.world?.simulation;
				if (!simulation || hulls.length === 0) return null;
				return simulation.spawn({
					body: {
						kind: StageBodyKind.Static,
						position: [0, 0, 0],
						rotation: [0, 0, 0, 1],
						canSleep: true,
						ccdEnabled: false,
					},
					colliders: hulls.map((vertices) => ({
						shape: { type: 'convexHull' as const, vertices },
						friction: 0.5,
						restitution: 0,
						sensor: false,
					})),
				});
			},
			despawnHulls: (handle: unknown) => {
				if (!handle) return;
				try {
					this.stage.world?.simulation.despawn(handle as EntityHandle);
				} catch {
					// The body is already gone with the world.
				}
			},
			publishGesture: (gesture: LevelGesture) => {
				getZylemBridge().channel.send('level:gesture', { gesture });
			},
			publishSelect: (payload: LevelSelectPayload) => {
				getZylemBridge().channel.send('level:select', payload);
			},
			publishNotice: (message: string) => {
				publishGameNotice('info', message);
			},
		};
	}

	/** Camera used for raycasts and gizmos: whichever one is rendering. */
	private getDebugViewCamera(): ZylemCamera | null {
		return this.stage.cameraManagerRef?.primaryCamera
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

	/**
	 * Every entity a marquee may catch. `childrenMap` is the live stage;
	 * `debugMap` is consulted too so anything only registered there (the same
	 * set the single pick resolves through) is not skipped. Whether an entity
	 * has a selectable volume is the marquee's call, via its selection bounds.
	 * HUD elements are left out: the marquee casts a frustum through the
	 * world, and they sit on the lens. So are the level's trigger zones, which
	 * the editor spawned and never lists.
	 */
	private forEachSelectableEntity(visit: (uuid: string, entity: GameEntity<any>) => void): void {
		const seen = new Set<string>();
		const visitEntry = (node: BaseNode, uuid: string) => {
			if (seen.has(uuid)) return;
			seen.add(uuid);
			const entity = node as GameEntity<any>;
			if (isHudEntity(entity) || entity.options?.editorOwned) return;
			visit(uuid, entity);
		};
		this.stage.entityDelegate.childrenMap.forEach(visitEntry);
		this.stage.entityDelegate.debugMap.forEach(visitEntry);
	}

	/** Copy all stage children into debugMap so raycast/select tools work after enabling debug mid-session. */
	private populateDebugMap(): void {
		this.stage.entityDelegate.childrenMap.forEach((entity: BaseNode, uuid: string) => {
			this.stage.entityDelegate.debugMap.set(uuid, entity);
		});
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

		// A marquee in flight belongs to the Select tool; switching away
		// mid-drag must not commit it later against a different tool's state.
		if (this.marquee.isArmed) {
			this.marquee.cancel();
			this.endPointerCapture();
		}
		// A draw, clip, or drag belongs to the tool that started it.
		this.levelSession.cancelGesture();

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

		this.syncTransformTool();
	}

	/** The entity gizmo stands down while the level holds the selection; the level session runs its own. */
	private syncTransformTool(): void {
		const tool = debugState.tool;
		const entityGizmo = isTransformTool(tool) && !this.levelSession.holdsGizmo;
		this.transformTool.setMode(entityGizmo ? (tool as TransformTool) : null);
	}

	private syncGrid(): void {
		const scene = this.stage.scene?.scene;
		if (!scene) return;
		this.grid.addTo(scene);
		this.grid.setIncrement(getSnapSettings().translate);
		const draw = this.levelSession.drawPlane;
		this.grid.setPlane(draw?.frame ?? null, draw?.focus);
		// The Show grid toggle, including while a level is being edited.
		this.grid.setVisible(debugState.gridVisible);
	}

	/** Initialize DOM listeners. The rendering camera stays whatever the editor selected. */
	private activate(): void {
		if (!this.domListenersAttached) {
			this.domListenersAttached = this.attachDomListeners();
		}

		this.populateDebugMap();
		this.rebindPostProcessing(this.getDebugViewCamera());

		if (document.pointerLockElement) {
			document.exitPointerLock();
		}
	}

	/** Tear down visuals without changing which camera is rendering. */
	private deactivate(): void {
		this.disposeDebugVisuals();
		this.transformTool.cancelDrag();
		this.grid.setVisible(false);
		this.rebindPostProcessing(this.getDebugViewCamera());
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
		this.selectionHighlight ??= new SelectionHighlight(scene);
	}

	/**
	 * Outline every selected entity. Re-fitted each frame so the boxes follow
	 * entities that move, and so a uuid whose entity has gone (deleted, or
	 * undone) simply drops out instead of leaving a stale box behind.
	 */
	private updateSelectionHighlight(): void {
		const highlight = this.selectionHighlight;
		if (!highlight) return;
		const uuids = debugState.selectedEntityIds;
		if (uuids.length === 0) {
			highlight.hide();
			return;
		}
		// Scratch boxes are pooled across frames; the highlight copies what it
		// needs before the next call reuses them.
		const boxes: Box3[] = [];
		for (const uuid of uuids) {
			const entity = this.resolveEntity(uuid);
			// Outlined on screen instead; see `updateHudOutline`.
			if (isHudEntity(entity)) continue;
			const scratch = this.selectionBoundsPool[boxes.length] ??= new Box3();
			const bounds = resolveSelectionBounds(entity, scratch);
			if (bounds) boxes.push(bounds);
		}
		highlight.update(boxes);
	}

	/**
	 * Outline the selected HUD elements and the hovered one, on screen.
	 *
	 * Only those pinned to the rendering camera have a box to outline. Under
	 * an editor camera the HUD is not on the lens, so nothing is drawn.
	 */
	private updateHudOutline(): void {
		const canvas = this.stage.rendererManager?.getDomElement();
		const camera = this.getDebugViewCamera()?.camera;
		if (!canvas || !camera) {
			this.hudOutline.hide();
			return;
		}
		const marks: HudMark[] = [];
		for (const uuid of debugState.selectedEntityIds) {
			const rect = hudRectOf(this.resolveEntity(uuid), camera);
			if (rect) marks.push({ rect, color: HUD_SELECTED_COLOR });
		}
		// Only Select hovers HUD elements; another tool leaves the last hover behind.
		const hovered = getDebugTool() === 'select' ? debugState.hoveredEntityId : null;
		if (hovered && !debugState.selectedEntityIds.includes(hovered)) {
			const rect = hudRectOf(this.resolveEntity(hovered), camera);
			if (rect) marks.push({ rect, color: HUD_HOVER_COLOR });
		}
		this.hudOutline.show(canvas, marks);
	}

	/** The HUD element on top under the pointer, while the HUD's camera is the one rendering. */
	private hudAtPointer(): string | null {
		const camera = this.getDebugViewCamera()?.camera;
		if (!camera) return null;
		return pickHud(this.stage.entityDelegate.childrenMap, camera, this.mouseNdc);
	}

	/**
	 * A raycast hit as something Select may pick. The level's own trigger
	 * zones are entities the editor spawned and never lists; a click on one
	 * belongs to the level, which picks the marker it stands for.
	 */
	private selectableUuid(uuid: string | null | undefined): string | null {
		if (!uuid) return null;
		const entity = this.resolveEntity(uuid);
		return entity && !entity.options?.editorOwned ? uuid : null;
	}

	/** The entity the physics raycast finds first along `ray`. */
	private entityHit(ray: GizmoRay): { uuid: string; distance: number } | null {
		const hit = this.stage.world?.raycast(ray.origin, ray.direction, this.options.maxRayDistance);
		const uuid = this.selectableUuid(hit?.uuid);
		return hit && uuid ? { uuid, distance: hit.distance } : null;
	}

	/**
	 * What a Select click at the pointer would pick, the same in every mode:
	 * the HUD element on top, else whichever of the level and an entity is
	 * nearer along the ray.
	 */
	private selectTarget(ray: GizmoRay): SelectTarget | null {
		return chooseSelectTarget({
			hud: this.hudAtPointer(),
			entity: this.entityHit(ray),
			level: this.levelSession.selectDistance(ray),
		});
	}

	/**
	 * How far along `ray` the level session may hover for Select: up to
	 * whatever a click would pick ahead of the level.
	 */
	private levelHoverLimit(ray: GizmoRay): number {
		if (getDebugTool() !== 'select') return Infinity;
		if (this.hudAtPointer()) return 0;
		return this.entityHit(ray)?.distance ?? Infinity;
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
		// With nothing armed and debug off, `update()` stops running and the
		// outlines would otherwise stay frozen over a game being played.
		if (tool === 'none' && !debugState.enabled) {
			this.selectionHighlight?.hide();
			this.hudOutline.hide();
		}
	}

	private disposeToolVisuals(): void {
		this.debugCursor?.dispose();
		this.debugCursor = null;
		this.placementGhost?.dispose();
		this.placementGhost = null;
		this.selectionHighlight?.dispose();
		this.selectionHighlight = null;
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
		this.levelSession.tick();
		// A sync can arrive before the scene exists; the next frame catches it.
		this.syncGrid();

		if (debugState.enabled) {
			this.initDebugVisuals();
			this.updateColliderWireframes(world);
		} else {
			this.disposeDebugVisuals();
		}

		// Before the tool branches below, all of which return early.
		this.updatePlacementGhost(tool, world);
		this.updateSelectionHighlight();

		// Gizmo tools own the pointer entirely; entity picking would fight them.
		if (isTransformTool(tool)) {
			this.debugCursor?.hide();
			this.transformTool.update();
			if (!this.transformTool.isDragging) {
				this.transformTool.hover(this.currentRay());
			}
			this.updateHudOutline();
			return;
		}
		this.transformTool.update();
		this.updateHover(tool, world);
		this.updateHudOutline();
	}

	/** Find what is under the pointer for the hover tools and paint the cursor highlight on it. */
	private updateHover(
		tool: ReturnType<typeof getDebugTool>,
		world: NonNullable<ZylemStage['world']>,
	): void {
		// Hover tools paint the cursor highlight. The add tool has its ghost
		// instead, and a highlight box around whatever is under the cursor would
		// only compete with it.
		const isHoverTool = tool === 'select' || tool === 'delete' || debugState.pickMode;

		if (!isHoverTool) {
			this.debugCursor?.hide();
			return;
		}

		const ray = this.currentRay();
		// Select hovers what its click would pick. Delete and host picking stay
		// on the physics raycast.
		let onHud = false;
		if (tool === 'select' && !debugState.pickMode) {
			const target = this.selectTarget(ray);
			onHud = target?.kind === 'hud';
			if (target && target.kind !== 'level') setHoveredEntityId(target.uuid);
			else resetHoveredEntity();
		} else {
			const hit = world.raycast(ray.origin, ray.direction, this.options.maxRayDistance);
			if (hit) {
				setHoveredEntityId(hit.uuid ?? null);
			} else {
				resetHoveredEntity();
			}
		}

		const hoveredUuid = getHoveredEntityId();
		// A HUD element is outlined on screen; see `updateHudOutline`.
		if (!hoveredUuid || onHud) {
			this.debugCursor?.hide();
			return;
		}
		// The same padded view the selection outline uses, so hovering a flat
		// plane shows a slab rather than a hairline.
		const hoverBounds = resolveSelectionBounds(this.resolveEntity(hoveredUuid), this.hoverBounds);
		if (!hoverBounds) {
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
		this.debugCursor?.updateFromBounds(hoverBounds);
	}

	/**
	 * Raycast at NDC coordinates (from a host that cannot send DOM pointer
	 * events, e.g. an overlay sitting on a preview iframe, or the bridge's
	 * `entity:pick`).
	 *
	 * Hover follows the pick only while pick mode is armed (a drag in flight),
	 * so a one-shot pick from an inspector does not disturb the user's hover.
	 * While armed, the next `update()` paints the highlight.
	 */
	pickAtNdc(
		ndcX: number,
		ndcY: number,
		options: { updateHover?: boolean } = {},
	): { uuid: string; name: string } | null {
		const updateHover = options.updateHover ?? debugState.pickMode;
		this.mouseNdc.set(ndcX, ndcY);
		const world = this.stage.world;
		if (!world || !this.getDebugViewCamera()) {
			if (updateHover) resetHoveredEntity();
			return null;
		}
		const ray = this.currentRay();
		const hit = world.raycast(ray.origin, ray.direction, this.options.maxRayDistance);
		const uuid = hit?.uuid ?? null;
		if (!uuid) {
			if (updateHover) resetHoveredEntity();
			return null;
		}
		if (updateHover) setHoveredEntityId(uuid);
		const entity = this.resolveEntity(uuid);
		return { uuid, name: entity?.name ?? '' };
	}

	/**
	 * Apply swatches to live entities (`entity:apply-swatch`). Every uuid ×
	 * swatch pair is attempted and reported; successful pairs are recorded so
	 * the operation can be undone exactly via {@link applySceneOperation}.
	 */
	applySwatches(payload: EntityApplySwatchPayload & { opId: string }): SwatchApplyOutcome {
		const applier = this.ensureSwatchApplier();
		if (!applier) return emptySwatchApplyOutcome(payload);
		return applier.applySwatches(payload);
	}

	/**
	 * The catalog entry installs the applier. A stage created before that
	 * import still picks it up on the next apply.
	 */
	private ensureSwatchApplier(): InstalledSwatchApplier | null {
		if (this.swatchApplier) return this.swatchApplier;
		const created = createSwatchApplier({
			resolveEntity: (uuid) => this.resolveEntity(uuid),
		});
		if (created) this.swatchApplier = created;
		return created;
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

	/** Selection boxes for the first side, top, and isometric placement. Level brushes are not included. */
	private editorEntityBoxes(): Box3[] {
		const boxes: Box3[] = [];
		this.stage.entityDelegate.childrenMap.forEach((entity) => {
			const box = resolveSelectionBounds(entity, new Box3());
			if (box) boxes.push(box.clone());
		});
		return boxes;
	}

	/** Full teardown — unsubscribes from debugState and cleans up all resources. */
	dispose(): void {
		this.stage.cameraManagerRef?.setEditorEntityBounds(null);
		this.focusContextUnregister?.();
		this.focusContextUnregister = null;
		this.entityResolverUnregister?.();
		this.entityResolverUnregister = null;
		this.debugStateUnsubscribe?.();
		this.debugStateUnsubscribe = null;
		this.endPointerCapture();
		this.levelSession.dispose();
		this.hudOutline.dispose();
		this.marquee.dispose();
		this.transformTool.dispose();
		this.swatchApplier?.dispose();
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
			case 'swatch':
				this.ensureSwatchApplier()?.applySceneOperation(op, direction);
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

	private handleAction(
		ray: GizmoRay,
		modifiers: { shiftKey: boolean; altKey: boolean } = { shiftKey: false, altKey: false },
	): void {
		const tool = getDebugTool();
		if (tool !== 'select' && tool !== 'delete' && tool !== 'add') return;

		const world = this.stage.world;
		const hit = world?.raycast(ray.origin, ray.direction, this.options.maxRayDistance)
			?? null;

		switch (tool) {
			case 'select': {
				this.selectByClick(this.selectableUuid(hit?.uuid), modifiers);
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
	 * Apply a Select click on an entity, or on nothing, to the selection.
	 *
	 * @param resolved The entity clicked, or `null` for empty space.
	 */
	private selectByClick(
		resolved: string | null,
		modifiers: { shiftKey: boolean; altKey: boolean },
	): void {
		if (modifiers.altKey) {
			// Alt-click drops one entity from the selection; on empty
			// space it leaves the selection alone.
			if (resolved) removeSelectedEntityIds([resolved]);
		} else if (modifiers.shiftKey) {
			// Shift-click toggles membership, the click counterpart of a
			// shift-drag. Empty space is a no-op so a slipped shift-click
			// cannot throw away a selection being built.
			if (resolved) toggleSelectedEntityId(resolved);
		} else if (resolved) {
			setSelectedEntityId(resolved);
		} else {
			// Clicking empty space clears, which is what makes the gizmo
			// dismissable without another tool. The level selection goes with
			// it: the click was offered to the level first and missed.
			setSelectedEntityId(null);
			this.levelSession.selectNothing();
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

		const typeId = debugState.addTypeId;
		const createdProps = {
			...(typeId ? getEntityType(typeId)?.defaultProps ?? {} : {}),
			...(debugState.addTypeProps ?? {}),
		};
		const registration = typeId ? getEntityType(typeId) : null;

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
					entries: [
						{
							uuid: resolvedNode.uuid,
							...(typeId ? { typeId } : {}),
							...(Object.keys(createdProps).length > 0 ? { props: createdProps } : {}),
						},
					],
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
			if (this.levelPointer) {
				e.preventDefault();
				e.stopImmediatePropagation();
				this.levelSession.pointerMove(this.currentRay(), e);
				return;
			}
			const hoverRay = this.currentRay();
			this.levelSession.pointerHover(hoverRay, this.levelHoverLimit(hoverRay));
			if (this.marquee.isArmed) {
				this.marquee.pointerMove(this.mouseNdc, e);
				return;
			}
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

			if (this.stage.navigation.pointerDown(ray)) {
				e.preventDefault();
				e.stopImmediatePropagation();
				return;
			}

			// The entity gizmo is only up while the level holds no selection, so
			// a press on one of its handles is never the level's.
			if (this.transformTool.pointerDown(ray)) {
				this.beginPointerCapture(canvas, e.pointerId);
				return;
			}

			if (getDebugTool() === 'select') {
				const target = this.selectTarget(ray);
				if (target?.kind === 'hud') {
					// Picked on the press. Stopped here so the camera does not
					// orbit off a press that landed on the HUD.
					e.preventDefault();
					e.stopImmediatePropagation();
					this.selectByClick(target.uuid, e);
					return;
				}
				if (target?.kind !== 'level') {
					// The press is not resolved until release: a drag becomes a
					// marquee, anything shorter is the ordinary single pick. Orbit is
					// suspended for the whole press, since the first few pixels of a
					// marquee would otherwise also swing the camera.
					this.marquee.pointerDown(this.mouseNdc, e, canvas);
					this.beginPointerCapture(canvas, e.pointerId);
					return;
				}
			}

			if (this.levelSession.pointerDown(ray, e)) {
				// Capture phase, and stopped here, so OrbitControls never starts
				// a drag on the same press. Otherwise the camera swings instead
				// of the brush.
				e.preventDefault();
				e.stopImmediatePropagation();
				this.levelPointer = true;
				this.beginPointerCapture(canvas, e.pointerId);
				return;
			}

			this.handleAction(ray, e);
		};

		const onPointerUp = (e: PointerEvent) => {
			if (this.levelPointer) {
				e.preventDefault();
				e.stopImmediatePropagation();
				this.levelSession.pointerUp(this.currentRay());
				this.levelPointer = false;
				this.endPointerCapture();
				return;
			}
			if (this.marquee.isArmed) {
				const release = this.marquee.pointerUp(this.mouseNdc);
				this.endPointerCapture();
				if (release === 'click') this.handleAction(this.currentRay(), e);
				return;
			}
			if (!this.transformTool.isDragging) return;
			this.transformTool.pointerUp();
			this.endPointerCapture();
		};

		// A cancelled pointer (browser gesture, window blur) never delivers
		// pointerup, so without this a drag would never commit or release. A
		// marquee is abandoned rather than committed: the rectangle it ended on
		// is wherever the pointer happened to be lost.
		const onPointerCancel = (e: PointerEvent) => {
			if (this.levelPointer) {
				this.levelPointer = false;
				this.levelSession.pointerUp(this.currentRay());
				this.endPointerCapture();
				return;
			}
			if (this.marquee.isArmed) {
				this.marquee.cancel();
				this.endPointerCapture();
				return;
			}
			onPointerUp(e);
		};

		// Capture phase on the window, ahead of the editor's own Escape, which
		// would also disarm the tool. Only while a level gesture is under way.
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Escape' || !this.levelSession.hasGesture) return;
			e.preventDefault();
			e.stopImmediatePropagation();
			this.levelSession.cancelGesture();
		};

		canvas.addEventListener('pointermove', onPointerMove, true);
		canvas.addEventListener('pointerdown', onPointerDown, true);
		canvas.addEventListener('pointerup', onPointerUp, true);
		canvas.addEventListener('pointercancel', onPointerCancel, true);
		window.addEventListener('keydown', onKeyDown, true);

		this.domDisposeFns.push(
			() => canvas.removeEventListener('pointermove', onPointerMove, true),
			() => canvas.removeEventListener('pointerdown', onPointerDown, true),
			() => canvas.removeEventListener('pointerup', onPointerUp, true),
			() => canvas.removeEventListener('pointercancel', onPointerCancel, true),
			() => window.removeEventListener('keydown', onKeyDown, true),
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
