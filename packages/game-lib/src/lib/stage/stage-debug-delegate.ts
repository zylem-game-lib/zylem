import { Ray, RayColliderToi } from '@dimforge/rapier3d-compat';
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Raycaster, Vector2, Vector3 } from 'three';
import { subscribe } from 'valtio/vanilla';
import { ZylemStage } from './zylem-stage';
import { StageCameraDebugDelegate } from './stage-camera-debug-delegate';
import { debugState, getDebugTool, getHoveredEntity, resetHoveredEntity, setHoveredEntity, setSelectedEntity } from '../debug/debug-state';
import { DebugEntityCursor } from './debug-entity-cursor';

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
	private cameraDebugDelegate: StageCameraDebugDelegate | null = null;
	private debugStateUnsubscribe: (() => void) | null = null;

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

		if (this.stage.cameraRef && !this.cameraDebugDelegate) {
			this.cameraDebugDelegate = new StageCameraDebugDelegate(this.stage);
			this.stage.cameraRef.setDebugDelegate(this.cameraDebugDelegate);
		}
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

		this.debugCursor = new DebugEntityCursor(this.stage.scene.scene);
	}

	private disposeDebugVisuals(): void {
		if (this.debugLines && this.stage.scene) {
			this.stage.scene.scene.remove(this.debugLines);
			this.debugLines.geometry.dispose();
			(this.debugLines.material as LineBasicMaterial).dispose();
			this.debugLines = null;
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
		const tool = getDebugTool();
		const isCursorTool = tool === 'select' || tool === 'delete';

		let hit: RayColliderToi | null = null;
		let origin: Vector3 | null = null;
		let direction: Vector3 | null = null;

		if (hasDirectWorld) {
			this.raycaster.setFromCamera(this.mouseNdc, cameraRef.camera);
			origin = this.raycaster.ray.origin.clone();
			direction = this.raycaster.ray.direction.clone().normalize();

			const rapierRay = new Ray(
				{ x: origin.x, y: origin.y, z: origin.z },
				{ x: direction.x, y: direction.y, z: direction.z },
			);
			hit = world.world.castRay(rapierRay, this.options.maxRayDistance, true);
		}

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
					const entity = this.stage.entityDelegate.debugMap.get(hoveredUuid);
					if (entity) setSelectedEntity(entity as any);
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
