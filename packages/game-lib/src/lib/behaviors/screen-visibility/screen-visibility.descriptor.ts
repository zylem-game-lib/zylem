import type { IWorld } from 'bitecs';
import {
	Box3,
	Frustum,
	Matrix4,
	Quaternion,
	Vector3,
	type Object3D,
} from 'three';

import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import { ScreenVisibilityFSM, type ScreenVisibilitySnapshot } from './screen-visibility-fsm';
import type { GameEntity } from '../../entities/entity';
import type { ZylemCamera } from '../../camera/zylem-camera';

export interface ScreenVisibilitySize {
	x: number;
	y: number;
	z: number;
}

export interface ScreenVisibilityChangeContext {
	entity: GameEntity<any>;
	visible: boolean;
	wasVisible: boolean;
	justEntered: boolean;
	justExited: boolean;
	visibleCameraNames: string[];
	cameraName: string | null;
}

export interface ScreenVisibilityOptions {
	/**
	 * Restrict visibility checks to one active camera by name.
	 * When omitted, any active camera can make the entity visible.
	 */
	cameraName: string | null;
	/**
	 * Require the full entity bounds to remain inside the camera frustum.
	 * Defaults to partial visibility (any intersection counts).
	 */
	requireFullyVisible: boolean;
	/**
	 * Expand or shrink the computed bounds in world units.
	 * Positive values make visibility checks more generous.
	 */
	padding: number;
	/**
	 * Optional bounds to use when the entity has no renderable mesh/group.
	 * Falls back to the entity's configured size when available.
	 */
	fallbackSize: ScreenVisibilitySize | null;
	onChange?: (context: ScreenVisibilityChangeContext) => void;
	onEnter?: (context: ScreenVisibilityChangeContext) => void;
	onExit?: (context: ScreenVisibilityChangeContext) => void;
}

export interface ScreenVisibilityHandle {
	isVisible(): boolean;
	isOffscreen(): boolean;
	wasJustEntered(): boolean;
	wasJustExited(): boolean;
	getVisibleCameraNames(): string[];
	getState(): ScreenVisibilitySnapshot | null;
}

const defaultOptions: ScreenVisibilityOptions = {
	cameraName: null,
	requireFullyVisible: false,
	padding: 0,
	fallbackSize: null,
	onChange: undefined,
	onEnter: undefined,
	onExit: undefined,
};

const SCREEN_VISIBILITY_BEHAVIOR_KEY = Symbol.for(
	'zylem:behavior:screen-visibility',
);

class ScreenVisibilitySystem implements BehaviorSystem {
	private readonly worldBounds = new Box3();
	private readonly projectionMatrix = new Matrix4();
	private readonly frustum = new Frustum();
	private readonly savedPosition = new Vector3();
	private readonly savedQuaternion = new Quaternion();
	private readonly worldPosition = new Vector3();
	private readonly fallbackMin = new Vector3();
	private readonly fallbackMax = new Vector3();
	private readonly corners = Array.from({ length: 8 }, () => new Vector3());

	constructor(
		private scene: any,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) { }

	update(_ecs: IWorld, _delta: number): void {
		const links = this.getBehaviorLinks?.(SCREEN_VISIBILITY_BEHAVIOR_KEY);
		if (!links) return;

		for (const link of links) {
			const entity = link.entity as GameEntity<any>;
			const visibilityRef = link.ref as BehaviorRef<ScreenVisibilityOptions>;
			const options = visibilityRef.options;

			if (!visibilityRef.fsm) {
				visibilityRef.fsm = new ScreenVisibilityFSM();
			}

			const fsm = visibilityRef.fsm as ScreenVisibilityFSM;
			const previousState = fsm.getState();
			const cameras = this.resolveActiveCameras(options.cameraName);
			const visibleCameraNames: string[] = [];

			const bounds = this.computeWorldBounds(entity, options);
			if (bounds) {
				for (let index = 0; index < cameras.length; index++) {
					const cameraRef = cameras[index];
					if (this.isBoundsVisible(bounds, cameraRef, options.requireFullyVisible)) {
						visibleCameraNames.push(this.getCameraLabel(cameraRef, index));
					}
				}
			}

			fsm.update(visibleCameraNames.length > 0, visibleCameraNames);
			this.notifyVisibilityChange(entity, options, previousState, fsm.getState());
		}
	}

	private resolveActiveCameras(cameraName: string | null): ZylemCamera[] {
		const activeCameras = this.scene?.cameraManager?.activeCameras?.length
			? [...this.scene.cameraManager.activeCameras]
			: this.scene?.zylemCamera
				? [this.scene.zylemCamera]
				: [];

		if (!cameraName) {
			return activeCameras;
		}

		return activeCameras.filter((camera: ZylemCamera) => camera.name === cameraName);
	}

	private computeWorldBounds(
		entity: GameEntity<any>,
		options: ScreenVisibilityOptions,
	): Box3 | null {
		const target = (entity.group ?? entity.mesh) as Object3D | undefined;
		this.worldBounds.makeEmpty();

		if (target) {
			const body = (entity as any).body;
			if (body) {
				this.savedPosition.copy(target.position);
				this.savedQuaternion.copy(target.quaternion);

				const translation = body.translation();
				target.position.set(translation.x, translation.y, translation.z);

				if (!(entity as any).controlledRotation) {
					const rotation = body.rotation();
					target.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
				}

				target.updateWorldMatrix(true, true);
				this.worldBounds.setFromObject(target);

				target.position.copy(this.savedPosition);
				target.quaternion.copy(this.savedQuaternion);
				target.updateWorldMatrix(true, true);
			} else {
				target.updateWorldMatrix(true, true);
				this.worldBounds.setFromObject(target);
			}
		}

		if (this.worldBounds.isEmpty()) {
			const fallbackSize = options.fallbackSize
				?? ((entity.options?.size as ScreenVisibilitySize | undefined) ?? null);
			this.resolveFallbackCenter(entity, target);

			const halfX = (fallbackSize?.x ?? 0) / 2;
			const halfY = (fallbackSize?.y ?? 0) / 2;
			const halfZ = (fallbackSize?.z ?? 0) / 2;

			this.fallbackMin.set(
				this.worldPosition.x - halfX,
				this.worldPosition.y - halfY,
				this.worldPosition.z - halfZ,
			);
			this.fallbackMax.set(
				this.worldPosition.x + halfX,
				this.worldPosition.y + halfY,
				this.worldPosition.z + halfZ,
			);
			this.worldBounds.set(this.fallbackMin, this.fallbackMax);
		}

		if (options.padding !== 0) {
			this.worldBounds.expandByScalar(options.padding);
		}

		return this.worldBounds.isEmpty() ? null : this.worldBounds;
	}

	private resolveFallbackCenter(
		entity: GameEntity<any>,
		target: Object3D | undefined,
	): void {
		const body = (entity as any).body;
		if (body) {
			const translation = body.translation();
			this.worldPosition.set(translation.x, translation.y, translation.z);
			return;
		}

		if (target) {
			target.updateWorldMatrix(true, false);
			target.getWorldPosition(this.worldPosition);
			return;
		}

		const position = entity.options?.position ?? { x: 0, y: 0, z: 0 };
		this.worldPosition.set(position.x, position.y, position.z);
	}

	private isBoundsVisible(
		bounds: Box3,
		cameraRef: ZylemCamera,
		requireFullyVisible: boolean,
	): boolean {
		const camera = cameraRef.camera;
		camera.updateMatrixWorld(true);
		this.projectionMatrix.multiplyMatrices(
			camera.projectionMatrix,
			camera.matrixWorldInverse,
		);
		this.frustum.setFromProjectionMatrix(this.projectionMatrix);

		if (!requireFullyVisible) {
			return this.frustum.intersectsBox(bounds);
		}

		return this.getCorners(bounds).every((corner) => this.frustum.containsPoint(corner));
	}

	private getCorners(bounds: Box3): Vector3[] {
		const { min, max } = bounds;
		this.corners[0].set(min.x, min.y, min.z);
		this.corners[1].set(min.x, min.y, max.z);
		this.corners[2].set(min.x, max.y, min.z);
		this.corners[3].set(min.x, max.y, max.z);
		this.corners[4].set(max.x, min.y, min.z);
		this.corners[5].set(max.x, min.y, max.z);
		this.corners[6].set(max.x, max.y, min.z);
		this.corners[7].set(max.x, max.y, max.z);
		return this.corners;
	}

	private getCameraLabel(camera: ZylemCamera, index: number): string {
		return camera.name || (index === 0 ? 'primary' : `camera-${index}`);
	}

	private notifyVisibilityChange(
		entity: GameEntity<any>,
		options: ScreenVisibilityOptions,
		previousState: ScreenVisibilitySnapshot,
		nextState: ScreenVisibilitySnapshot,
	): void {
		if (!nextState.justEntered && !nextState.justExited) {
			return;
		}

		const context: ScreenVisibilityChangeContext = {
			entity,
			visible: nextState.visible,
			wasVisible: previousState.visible,
			justEntered: nextState.justEntered,
			justExited: nextState.justExited,
			visibleCameraNames: [...nextState.visibleCameraNames],
			cameraName: options.cameraName,
		};

		if (nextState.justEntered) {
			options.onEnter?.(context);
		}

		if (nextState.justExited) {
			options.onExit?.(context);
		}

		options.onChange?.(context);
	}
}

function createScreenVisibilityHandle(
	ref: BehaviorRef<ScreenVisibilityOptions>,
): ScreenVisibilityHandle {
	return {
		isVisible: () => {
			const fsm = ref.fsm as ScreenVisibilityFSM | undefined;
			return fsm?.isVisible() ?? false;
		},
		isOffscreen: () => {
			const fsm = ref.fsm as ScreenVisibilityFSM | undefined;
			return !(fsm?.isVisible() ?? false);
		},
		wasJustEntered: () => {
			const fsm = ref.fsm as ScreenVisibilityFSM | undefined;
			return fsm?.wasJustEntered() ?? false;
		},
		wasJustExited: () => {
			const fsm = ref.fsm as ScreenVisibilityFSM | undefined;
			return fsm?.wasJustExited() ?? false;
		},
		getVisibleCameraNames: () => {
			const fsm = ref.fsm as ScreenVisibilityFSM | undefined;
			return fsm?.getVisibleCameraNames() ?? [];
		},
		getState: () => {
			const fsm = ref.fsm as ScreenVisibilityFSM | undefined;
			return fsm?.getState() ?? null;
		},
	};
}

export const ScreenVisibilityBehavior = defineBehavior<
	ScreenVisibilityOptions,
	ScreenVisibilityHandle
>({
	name: 'screen-visibility',
	defaultOptions,
	systemFactory: (ctx) =>
		new ScreenVisibilitySystem(ctx.scene, ctx.getBehaviorLinks),
	createHandle: createScreenVisibilityHandle,
});
