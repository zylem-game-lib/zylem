import type { SimulationColliderDefinition } from '@zylem/behaviors/core';
import { Group, Object3D, SkinnedMesh } from 'three';

import { BaseNode } from '../../core/base-node';
import { GameEntity } from '../entity';
import { createEntity } from '../create';
import {
	UnloadContext,
	UpdateContext,
	UpdateFunction,
} from '../../core/base-node-life-cycle';
import { AssetLoaderResult, EntityAssetLoader } from '../../core/entity-asset-loader';
import {
	disposeGaussianSplatResources,
	isExclusiveGaussianSplatModel,
} from '../../core/loaders/gaussian-model';
import { EntityLoaderDelegate } from '../delegates/loader';
import { VEC3_ONE, normalizeVec3 } from '../../core/vector';
import { AnimationDelegate, AnimationOptions } from '../delegates/animation';
import { DebugInfoProvider } from '../delegates/debug';
import { EntityBuilder } from '../builder';
import { deepMergeValues } from '../../core/clone-utils';
import { syncPendingPlacementVisibility } from '../spawn-placement';
import {
	ActorCollisionBuilder,
	createBoundsColliderFromModel,
	createCapsuleColliderFromModel,
	createTrimeshColliderFromModel,
	hasExplicitCollisionSize,
	resolveCollisionShape,
	warnDynamicTrimeshOnce,
} from './collision';
import { applyActorMaterialOverrides } from './materials';
import {
	actorDefaults,
	getActorScale,
	type ResolvedCollisionShape,
	type ZylemActorOptions,
} from './types';
import {
	computeVisualFeetGapWorld,
	shouldStripRootMotionForActor,
	VISUAL_GROUND_EPSILON,
} from './visual-ground';

type CollisionSourceSelection = {
	file: string | null;
	reuseVisibleModel: boolean;
};

function disposeObjectResources(object: Object3D | null): void {
	if (!object) {
		return;
	}

	object.traverse((child) => {
		if (!(child as SkinnedMesh).isMesh) {
			return;
		}
		disposeGaussianSplatResources(child);

		const mesh = child as SkinnedMesh;
		mesh.geometry?.dispose();
		if (Array.isArray(mesh.material)) {
			mesh.material.forEach((material) => material.dispose());
		} else {
			mesh.material?.dispose();
		}
	});
}

class ActorBuilder extends EntityBuilder<ZylemActor, ZylemActorOptions> {
	protected createEntity(options: Partial<ZylemActorOptions>): ZylemActor {
		return new ZylemActor(options);
	}
}

export const ACTOR_TYPE = Symbol('Actor');

export class ZylemActor extends GameEntity<ZylemActorOptions> implements EntityLoaderDelegate, DebugInfoProvider {
	static type = ACTOR_TYPE;

	private _object: Object3D | null = null;
	private _collisionSource: Object3D | null = null;
	private _animationDelegate: AnimationDelegate | null = null;
	private _modelFileNames: string[] = [];
	private _assetLoader: EntityAssetLoader = new EntityAssetLoader();
	private _loadGeneration = 0;
	private _loadStatus: 'idle' | 'loading' | 'loaded' = 'idle';
	/** The model failed to load. Cleared by the next {@link load}. */
	private _loadFailed = false;
	/** The model is in, and its animation clips are still loading. */
	private _animationsPending = false;

	controlledRotation: boolean = false;
	hasWarnedDynamicTrimesh = false;

	constructor(options?: ZylemActorOptions) {
		super();
		this.options = deepMergeValues(actorDefaults, options);
		this.prependUpdate(this.actorUpdate.bind(this) as UpdateFunction<this>);
		this.controlledRotation = true;
	}

	override create(): this {
		if (this._loadStatus === 'idle' && (this.options.models?.length ?? 0) > 0) {
			this.load();
		}
		return super.create();
	}

	load(): void {
		if (this._loadStatus === 'loading' || this._loadStatus === 'loaded') {
			return;
		}

		this._modelFileNames = [...(this.options.models || [])];
		if (this._modelFileNames.length === 0) {
			return;
		}

		this.disposeRuntimeState(true);
		this._loadStatus = 'loading';
		this._loadFailed = false;
		this._animationsPending = false;
		this.loadModelsDeferred(++this._loadGeneration);
	}

	/** Ready once the model is in and its animation clips have loaded or given up. */
	override getLoadState(): 'ready' | 'pending' | 'failed' {
		if (this._loadFailed) return 'failed';
		if (this._loadStatus === 'loading' || this._animationsPending) return 'pending';
		return 'ready';
	}

	data(): any {
		return {
			animations: this._animationDelegate?.animations,
			objectModel: this._object,
			collisionSource: this._collisionSource ?? this._object,
			collisionShape: this.options.collisionShape,
		};
	}

	needsDeferredModelCollision(): boolean {
		if (!this.requiresLoadedCollisionSource()) {
			return false;
		}

		return !this.getRuntimeCollisionSource();
	}

	synchronizeRuntimeCollider(): void {
		const resolvedShape = this.getResolvedCollisionShape();
		let colliderDesc: SimulationColliderDefinition;

		if (resolvedShape === 'bounds') {
			colliderDesc = createBoundsColliderFromModel(
				this._object,
				this.group ?? this._object,
				this.options,
			);
		} else if (resolvedShape === 'trimesh') {
			colliderDesc = createTrimeshColliderFromModel(
				this._object,
				this.group ?? this._object,
				this.options,
			);
		} else {
			const collisionSource = this.getRuntimeCollisionSource();
			colliderDesc = createCapsuleColliderFromModel(
				collisionSource,
				collisionSource,
				this._object,
				this._object,
				this.options,
			);
		}

		this.colliderDesc = colliderDesc;
		if (this.colliderDescs.length > 0) {
			this.colliderDescs[0] = colliderDesc;
		} else {
			this.colliderDescs.push(colliderDesc);
		}
	}

	actorUpdate(params: UpdateContext<ZylemActorOptions>): void {
		this._animationDelegate?.update(params.delta);
	}

	actorDestroy(): void {
		this._loadGeneration += 1;
		this._loadStatus = 'idle';
		this._loadFailed = false;
		this._animationsPending = false;
		this.disposeRuntimeState(true);
		this._modelFileNames = [];
	}

	override _unload(params: UnloadContext<this>): void {
		super._unload(params);
		this.actorDestroy();
	}

	playAnimation(animationOptions: AnimationOptions) {
		this._animationDelegate?.playAnimation(animationOptions);
	}

	get object(): Object3D | null {
		return this._object;
	}

	get collisionSource(): Object3D | null {
		return this._collisionSource ?? this._object;
	}

	getDebugInfo(): Record<string, any> {
		const debugInfo: Record<string, any> = {
			type: 'Actor',
			models: this._modelFileNames.length > 0 ? this._modelFileNames : 'none',
			modelLoaded: !!this._object,
			scale: (() => {
				const scale = normalizeVec3(this.options.scale, VEC3_ONE);
				return `${scale.x}, ${scale.y}, ${scale.z}`;
			})(),
			collisionShape: this.getResolvedCollisionShape(),
		};

		if (this._animationDelegate) {
			debugInfo.currentAnimation = this._animationDelegate.currentAnimationKey || 'none';
			debugInfo.animationsCount = this.options.animations?.length || 0;
		}

		if (this._object) {
			let meshCount = 0;
			let vertexCount = 0;
			this._object.traverse((child) => {
				if (!(child as SkinnedMesh).isMesh) {
					return;
				}
				meshCount++;
				const geometry = (child as SkinnedMesh).geometry;
				if (geometry?.attributes.position) {
					vertexCount += geometry.attributes.position.count;
				}
			});
			debugInfo.meshCount = meshCount;
			debugInfo.vertexCount = vertexCount;
		}

		return debugInfo;
	}

	private getResolvedCollisionShape(): ResolvedCollisionShape {
		return resolveCollisionShape(
			this.options.collisionShape,
			Boolean(this.options.collision?.static),
			() => warnDynamicTrimeshOnce(this),
		);
	}

	private requiresLoadedCollisionSource(): boolean {
		const resolvedShape = this.getResolvedCollisionShape();
		if (resolvedShape === 'bounds' || resolvedShape === 'trimesh') {
			return !hasExplicitCollisionSize(this.options);
		}
		if (resolvedShape === 'capsule') {
			return !hasExplicitCollisionSize(this.options)
				&& this.getCollisionSourceSelection().file !== null;
		}
		return false;
	}

	private getRuntimeCollisionSource(): Object3D | null {
		const resolvedShape = this.getResolvedCollisionShape();
		if (resolvedShape === 'bounds' || resolvedShape === 'trimesh') {
			return this._object;
		}
		return this._collisionSource ?? this._object;
	}

	private getCollisionSourceSelection(): CollisionSourceSelection {
		const modelFile = this.options.models?.[0] ?? null;
		const animationFile = this.options.animations?.[0]?.path ?? null;

		if (animationFile) {
			return {
				file: animationFile,
				reuseVisibleModel: animationFile === modelFile,
			};
		}

		return {
			file: modelFile,
			reuseVisibleModel: true,
		};
	}

	private disposeRuntimeState(clearGroup: boolean): void {
		if (this._animationDelegate) {
			this._animationDelegate.dispose();
			this._animationDelegate = null;
		}

		const collisionSource = this._collisionSource;
		disposeObjectResources(this._object);
		if (collisionSource && collisionSource !== this._object) {
			disposeObjectResources(collisionSource);
		}

		this._object = null;
		this._collisionSource = null;

		if (clearGroup && this.group) {
			this.group.clear();
			this.group = undefined;
		}
	}

	private loadModelsDeferred(loadGeneration: number): void {
		this.dispatch('entity:model:loading', {
			entityId: this.uuid,
			files: this._modelFileNames,
		});

		const collisionSourceSelection = this.getCollisionSourceSelection();
		const promises = this._modelFileNames.map((file) =>
			this._assetLoader.loadFile(file, { clone: true }),
		);
		const collisionSourcePromise = collisionSourceSelection.file && !collisionSourceSelection.reuseVisibleModel
			? this._assetLoader.loadFile(collisionSourceSelection.file, { clone: true })
			: Promise.resolve<AssetLoaderResult | null>(null);

		Promise.all([Promise.all(promises), collisionSourcePromise])
			.then(([results, collisionSourceResult]) => {
				if (loadGeneration !== this._loadGeneration) {
					results.forEach((result) => disposeObjectResources(result.object ?? null));
					if (collisionSourceResult?.object) {
						disposeObjectResources(collisionSourceResult.object);
					}
					return;
				}

				this._object = results[0]?.object ?? null;
				this._collisionSource = collisionSourceSelection.reuseVisibleModel
					? this._object
					: collisionSourceResult?.object ?? this._object;
				this._loadStatus = this._object ? 'loaded' : 'idle';
				this._loadFailed = !this._object;

				let meshCount = 0;
				if (this._object) {
					this._object.traverse((child) => {
						if ((child as SkinnedMesh).isMesh) {
							meshCount++;
						}
					});

					this.group = new Group();
					this.group.add(this._object);
					this.group.scale.copy(getActorScale(this.options));
					syncPendingPlacementVisibility(this);

					applyActorMaterialOverrides(this._object, this.options.material);

					this._animationDelegate = new AnimationDelegate(this._object);
					const animations = this.options.animations || [];
					const modelFile = this.options.models?.[0];
					const animationPaths = animations.map((animation) => animation.path);
					const stripRootMotionY = shouldStripRootMotionForActor(
						this.options,
						modelFile,
						animationPaths,
					);
					if (animations.length > 0) {
						this._animationsPending = true;
						this._animationDelegate.loadAnimations(
							animations,
							{
								stripRootMotionY,
								referenceAnimationPath: modelFile,
							},
						).then(() => {
							if (loadGeneration !== this._loadGeneration) {
								return;
							}
							this._animationsPending = false;
							this.alignVisualModelToGround();
							this.dispatch('entity:animation:loaded', {
								entityId: this.uuid,
								animationCount: animations.length,
							});
						}, (error) => {
							if (loadGeneration !== this._loadGeneration) {
								return;
							}
							// The model is in and usable without its clips, so
							// this settles the load rather than failing it.
							this._animationsPending = false;
							console.error('Failed to load actor animations', error);
							this.dispatch('entity:animation:loaded', {
								entityId: this.uuid,
								animationCount: 0,
								success: false,
								errorMessage: error instanceof Error ? error.message : String(error),
							});
						});
					} else {
						this.alignVisualModelToGround();
					}
				}

				this.dispatch('entity:model:loaded', {
					entityId: this.uuid,
					success: !!this._object,
					meshCount,
				});
			})
			.catch((error) => {
				if (loadGeneration !== this._loadGeneration) {
					return;
				}
				this._loadStatus = 'idle';
				this._loadFailed = true;
				console.error('Failed to load actor model', error);
				this.dispatch('entity:model:loaded', {
					entityId: this.uuid,
					success: false,
					meshCount: 0,
					errorMessage: error instanceof Error ? error.message : String(error),
				});
			});
	}

	/**
	 * Shift the visible model so its feet sit at the group origin (y = 0).
	 * The physics body / render slot stay at the feet anchor; only `_object`
	 * is offset so Mixamo-style hip calibration does not float the mesh.
	 */
	private alignVisualModelToGround(): void {
		if (!this._object || !this.group || isExclusiveGaussianSplatModel(this._object)) {
			return;
		}

		this._animationDelegate?.update(0);
		this._object.updateMatrixWorld(true);

		const gapWorld = computeVisualFeetGapWorld(this._object, this.group);
		if (gapWorld === null || Math.abs(gapWorld) < VISUAL_GROUND_EPSILON) {
			return;
		}

		const scaleY = this.group.scale.y || 1;
		this._object.position.y -= gapWorld / scaleY;
	}
}

type ActorOptions = BaseNode | ZylemActorOptions;

export function createActor(...args: Array<ActorOptions>): ZylemActor {
	return createEntity<ZylemActor, ZylemActorOptions>({
		args,
		defaultConfig: actorDefaults,
		EntityClass: ZylemActor,
		BuilderClass: ActorBuilder,
		CollisionBuilderClass: ActorCollisionBuilder,
		entityType: ZylemActor.type,
		cloneFactory: (options) => createActor(options ?? {}),
	});
}
