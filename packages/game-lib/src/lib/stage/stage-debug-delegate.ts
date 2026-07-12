/**
 * Owns the stage's in-world debug/editor interaction layer.
 *
 * Self-manages around the global `debugState`: when debug is enabled it draws
 * Rapier + runtime collider wireframes, attaches mouse listeners, raycasts into
 * the physics world to hover/select/delete/spawn entities, and drives the
 * `DebugEntityCursor` highlight. When disabled it tears down visuals but stays
 * alive to re-activate. Centralizes all debug-tool plumbing so `ZylemStage`
 * doesn't have to know about raycasting, DOM input, or debug rendering.
 */

// TODO: needs an implementation update

import { Ray, RayColliderToi } from '@dimforge/rapier3d-compat';
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Raycaster, Vector2, Vector3 } from 'three';
import { subscribe } from 'valtio/vanilla';
import { ZylemStage } from './zylem-stage';
import { StageCameraDebugDelegate } from './stage-camera-debug-delegate';
import { debugState, getDebugTool, getHoveredEntity, resetHoveredEntity, setHoveredEntity, setSelectedEntity } from '../debug/debug-state';
import { registerEntityFocusContext } from '../debug/entity-focus';
import { DebugEntityCursor } from './debug-entity-cursor';
import type { GameEntity } from '../entities/entity';
import type { BaseNode } from '../core/base-node';

export type AddEntityFactory = (params: { position: Vector3; normal?: Vector3 }) => Promise<any> | any;

export interface StageDebugDelegateOptions {
	maxRayDistance?: number;
	addEntityFactory?: AddEntityFactory | null;
}

const SELECT_TOOL_COLOR = 0x22ff22;
const DELETE_TOOL_COLOR = 0xff3333;

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
	private isMouseDown = false;
	private domDisposeFns: Array<() => void> = [];
	private domListenersAttached = false;
	private debugCursor: DebugEntityCursor | null = null;
	private debugLines: LineSegments | null = null;
	private runtimeDebugLines: LineSegments | null = null;
	/** Bridge collider-debug buffer currently bound to `runtimeDebugLines`, for zero-copy reuse. */
	private boundColliderPositions: Float32Array | null = null;
	private cameraDebugDelegate: StageCameraDebugDelegate | null = null;
	private debugStateUnsubscribe: (() => void) | null = null;
	private focusContextUnregister: (() => void) | null = null;

	constructor(stage: ZylemStage, options?: StageDebugDelegateOptions) {
		this.stage = stage;
		this.options = {
			maxRayDistance: options?.maxRayDistance ?? 5_000,
			addEntityFactory: options?.addEntityFactory ?? null,
		};

		// Self-managing: sync with current state then subscribe for changes
		this.syncWithDebugState();
		this.debugStateUnsubscribe = subscribe(debugState, () => {
			this.syncWithDebugState();
		});

		this.focusContextUnregister = registerEntityFocusContext({
			resolveEntity: (uuid) => this.resolveEntity(uuid),
			frameObject: (object) => {
				this.ensureCameraDebugDelegate();
				this.stage.cameraRef?.frameObject(object);
			},
			ensureDebugReady: () => {
				if (!debugState.enabled) {
					debugState.enabled = true;
				}
				this.activate();
				this.populateDebugMap();
			},
		});
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
		if (this.stage.cameraRef && !this.cameraDebugDelegate) {
			this.cameraDebugDelegate = new StageCameraDebugDelegate(this.stage);
			this.stage.cameraRef.setDebugDelegate(this.cameraDebugDelegate);
		}
	}

	private syncWithDebugState(): void {
		if (debugState.enabled) {
			this.activate();
		} else {
			this.deactivate();
		}
	}

	/** Initialize DOM listeners and camera debug delegate when debug is turned on. */
	private activate(): void {
		if (!this.domListenersAttached) {
			this.attachDomListeners();
			this.domListenersAttached = true;
		}

		this.populateDebugMap();
		this.ensureCameraDebugDelegate();
	}

	/** Tear down visuals and camera debug delegate when debug is turned off. */
	private deactivate(): void {
		this.disposeDebugVisuals();

		if (this.stage.cameraRef) {
			this.stage.cameraRef.setDebugDelegate(null);
		}
		this.cameraDebugDelegate = null;
	}

	private initDebugVisuals(): void {
		if (this.debugLines || !this.stage.scene) return;

		this.debugLines = new LineSegments(
			new BufferGeometry(),
			new LineBasicMaterial({ vertexColors: true })
		);
		this.stage.scene.scene.add(this.debugLines);
		this.debugLines.visible = true;

		this.runtimeDebugLines = new LineSegments(
			new BufferGeometry(),
			new LineBasicMaterial({ vertexColors: true }),
		);
		this.runtimeDebugLines.visible = true;
		this.stage.scene.scene.add(this.runtimeDebugLines);

		this.debugCursor = new DebugEntityCursor(this.stage.scene.scene);
	}

	private disposeDebugVisuals(): void {
		if (this.debugLines && this.stage.scene) {
			this.stage.scene.scene.remove(this.debugLines);
			this.debugLines.geometry.dispose();
			(this.debugLines.material as LineBasicMaterial).dispose();
			this.debugLines = null;
		}
		if (this.runtimeDebugLines && this.stage.scene) {
			this.stage.scene.scene.remove(this.runtimeDebugLines);
			this.runtimeDebugLines.geometry.dispose();
			(this.runtimeDebugLines.material as LineBasicMaterial).dispose();
			this.runtimeDebugLines = null;
			this.boundColliderPositions = null;
		}
		this.debugCursor?.dispose();
		this.debugCursor = null;
	}

	update(): void {
		if (!debugState.enabled) {
			if (this.debugLines) {
				this.disposeDebugVisuals();
			}
			return;
		}

		if (!this.stage.scene || !this.stage.world || !this.stage.cameraRef) return;

		if (!this.debugLines) {
			this.initDebugVisuals();
		}

		const { world, cameraRef } = this.stage;

		// Debug rendering and raycasting require the direct Rapier world
		// instance, which is not available in worker mode.
		const hasDirectWorld = world.world != null;

		if (this.debugLines && hasDirectWorld) {
			const { vertices, colors } = world.world.debugRender();
			this.debugLines.geometry.setAttribute('position', new BufferAttribute(vertices, 3));
			this.debugLines.geometry.setAttribute('color', new BufferAttribute(colors, 4));
		}

		if (this.runtimeDebugLines) {
			// In the bundle/WASM path the Rapier world is empty (physics is owned
			// by WASM), so collider wireframes come from the bridge, which rebuilds
			// them from the live interpolated transforms each frame.
			const bridge = this.stage.physicsBridge;
			if (bridge) {
				const dbg = bridge.getColliderDebugRender();
				if (dbg.vertices.length === 0) {
					this.runtimeDebugLines.visible = false;
				} else {
					const geom = this.runtimeDebugLines.geometry;
					// The bridge reuses its buffers across frames, so bind them
					// directly (zero-copy) and only rebind when the backing array
					// is reallocated (collider count changed). Positions change
					// every frame; colors are constant.
					if (this.boundColliderPositions !== dbg.vertices) {
						geom.setAttribute('position', new BufferAttribute(dbg.vertices, 3));
						geom.setAttribute('color', new BufferAttribute(dbg.colors, 4));
						this.boundColliderPositions = dbg.vertices;
					} else if (dbg.changed) {
						// Only re-upload when colliders actually moved — the GPU
						// upload of this buffer is the overlay's dominant cost.
						geom.attributes.position.needsUpdate = true;
					}
					this.runtimeDebugLines.visible = true;
				}
			} else {
				const runtimeDebug = this.stage.runtimeAdapter?.getDebugRender?.() ?? null;
				if (runtimeDebug && runtimeDebug.vertices.length > 0) {
					this.runtimeDebugLines.geometry.setAttribute(
						'position',
						new BufferAttribute(new Float32Array(runtimeDebug.vertices), 3),
					);
					this.runtimeDebugLines.geometry.setAttribute(
						'color',
						new BufferAttribute(new Float32Array(runtimeDebug.colors), 4),
					);
					this.runtimeDebugLines.geometry.attributes.position.needsUpdate = true;
					this.runtimeDebugLines.geometry.attributes.color.needsUpdate = true;
					this.runtimeDebugLines.visible = true;
				} else {
					this.runtimeDebugLines.visible = false;
				}
			}
		}
		const tool = getDebugTool();
		const isCursorTool = tool === 'select' || tool === 'delete';

		let hit: RayColliderToi | null = null;
		let origin: Vector3 | null = null;
		let direction: Vector3 | null = null;

		// Phase A/B: when WASM owns transforms, bundle entities have no Rapier
		// colliders, so pick against the rendered bundle meshes directly.
		const bundleManager = this.stage.renderBundleManager;
		if (bundleManager) {
			this.raycaster.setFromCamera(this.mouseNdc, cameraRef.camera);
			origin = this.raycaster.ray.origin.clone();
			direction = this.raycaster.ray.direction.clone().normalize();

			const bundleHit = bundleManager.raycast(this.raycaster);
			if (isCursorTool) {
				const hoveredUuid = bundleHit?.uuid;
				if (hoveredUuid) {
					const entity = this.stage.entityDelegate.debugMap.get(hoveredUuid);
					if (entity) setHoveredEntity(entity as any);
				} else {
					resetHoveredEntity();
				}
				if (this.isMouseDown && origin && direction) {
					this.handleActionOnHit(hoveredUuid ?? null, origin, direction, bundleHit?.distance ?? 0);
				}
			}
		} else if (hasDirectWorld) {
			this.raycaster.setFromCamera(this.mouseNdc, cameraRef.camera);
			origin = this.raycaster.ray.origin.clone();
			direction = this.raycaster.ray.direction.clone().normalize();

			const rapierRay = new Ray(
				{ x: origin.x, y: origin.y, z: origin.z },
				{ x: direction.x, y: direction.y, z: direction.z },
			);
			hit = world.world.castRay(rapierRay, this.options.maxRayDistance, true);

			if (hit && isCursorTool) {
				// @ts-ignore - access compat object's parent userData mapping back to GameEntity
				const rigidBody = hit.collider?._parent;
				const hoveredUuid: string | undefined = rigidBody?.userData?.uuid;
				if (hoveredUuid) {
					const entity = this.stage.entityDelegate.debugMap.get(hoveredUuid);
					if (entity) setHoveredEntity(entity as any);
				} else {
					resetHoveredEntity();
				}

				if (this.isMouseDown && origin && direction) {
					this.handleActionOnHit(hoveredUuid ?? null, origin, direction, hit.toi);
				}
			}
		}
		this.isMouseDown = false;

		const hoveredUuid = getHoveredEntity();
		if (!hoveredUuid) {
			this.debugCursor?.hide();
			return;
		}
		const hoveredEntity: any = this.stage.entityDelegate.debugMap.get(`${hoveredUuid}`);
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
				this.debugCursor?.setColor(0xffffff);
				break;
		}
		this.debugCursor?.updateFromObject(targetObject);
	}

	/** Full teardown — unsubscribes from debugState and cleans up all resources. */
	dispose(): void {
		this.focusContextUnregister?.();
		this.focusContextUnregister = null;
		this.debugStateUnsubscribe?.();
		this.debugStateUnsubscribe = null;
		this.deactivate();
		this.domDisposeFns.forEach((fn) => fn());
		this.domDisposeFns = [];
		this.domListenersAttached = false;
	}

	private handleActionOnHit(hoveredUuid: string | null, origin: Vector3, direction: Vector3, toi: number) {
		const tool = getDebugTool();
		switch (tool) {
			case 'select': {
				if (hoveredUuid) {
					const entity = this.resolveEntity(hoveredUuid);
					if (entity) setSelectedEntity(entity);
				}
				break;
			}
			case 'delete': {
				if (hoveredUuid) {
					this.stage.entityDelegate.removeEntityByUuid(hoveredUuid);
				}
				break;
			}
			case 'scale': {
				if (!this.options.addEntityFactory) break;
				const hitPosition = origin.clone().add(direction.clone().multiplyScalar(toi));
				const newNode = this.options.addEntityFactory({ position: hitPosition });
				if (newNode) {
					Promise.resolve(newNode).then((node) => {
						if (node) this.stage.entityDelegate.spawnEntity(node);
					}).catch(() => { });
				}
				break;
			}
			default:
				break;
		}
	}

	private attachDomListeners() {
		const canvas = this.stage.cameraRef?.renderer.domElement ?? this.stage.scene?.zylemCamera.renderer.domElement;
		if (!canvas) return;

		const onMouseMove = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
			const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
			this.mouseNdc.set(x, y);
		};

		const onMouseDown = () => {
			this.isMouseDown = true;
		};

		canvas.addEventListener('mousemove', onMouseMove);
		canvas.addEventListener('mousedown', onMouseDown);

		this.domDisposeFns.push(() => canvas.removeEventListener('mousemove', onMouseMove));
		this.domDisposeFns.push(() => canvas.removeEventListener('mousedown', onMouseDown));
	}
}
