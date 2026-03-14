import { ActiveCollisionTypes, ColliderDesc } from '@dimforge/rapier3d-compat';
import {
	Box3,
	BufferAttribute,
	Object3D,
	SkinnedMesh,
	Mesh,
	MeshStandardMaterial,
	Group,
	Vector3,
	Material,
	Matrix4,
} from 'three';

import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { createEntity } from './create';
import {
	CleanupContext,
	UpdateContext,
	UpdateFunction,
} from '../core/base-node-life-cycle';
import { AssetLoaderResult, EntityAssetLoader } from '../core/entity-asset-loader';
import { EntityLoaderDelegate } from './delegates/loader';
import { Vec3 } from '../core/vector';
import { AnimationDelegate, AnimationOptions } from './delegates/animation';
import { MaterialOptions } from '../graphics/material';
import { DebugInfoProvider } from './delegates/debug';
import { EntityBuilder, EntityCollisionBuilder } from './builder';
import { commonDefaults } from './common';
import { standardShader } from '../graphics/shaders/standard.shader';

type AnimationObject = {
	key?: string;
	path: string;
};

export type CollisionShapeType = 'capsule' | 'bounds' | 'trimesh' | 'model';
type ResolvedCollisionShape = 'capsule' | 'bounds' | 'trimesh';

type ZylemActorOptions = GameEntityOptions & {
	static?: boolean;
	animations?: AnimationObject[];
	models?: string[];
	scale?: Vec3;
	material?: MaterialOptions;
	collisionShape?: CollisionShapeType;
};

type TransparentMaterial = Material & {
	opacity: number;
	transparent: boolean;
	needsUpdate: boolean;
};

type TrimeshMetadata = {
	shape: 'trimesh';
	vertices: number[];
	indices: number[];
};

type ModelBounds = {
	size: Vector3;
	center: Vector3;
};

type ModelTrimesh = {
	vertices: Float32Array;
	indices: Uint32Array;
	center: Vector3;
};

type CollisionSourceSelection = {
	file: string | null;
	reuseVisibleModel: boolean;
};

const actorDefaults: ZylemActorOptions = {
	...commonDefaults,
	material: {
		shader: standardShader,
	},
	animations: [],
	models: [],
	collisionShape: 'capsule',
};

function getActorScale(options: ZylemActorOptions): Vector3 {
	return new Vector3(
		options.scale?.x ?? 1,
		options.scale?.y ?? 1,
		options.scale?.z ?? 1,
	);
}

function getCollisionPosition(
	options: ZylemActorOptions,
): { x: number; y: number; z: number } | null {
	const position = options.collision?.position;
	if (!position) {
		return null;
	}
	return {
		x: position.x ?? 0,
		y: position.y ?? 0,
		z: position.z ?? 0,
	};
}

function hasExplicitCollisionSize(options: ZylemActorOptions): boolean {
	return Boolean(options.collision?.size);
}

function warnDynamicTrimeshOnce(actor: ZylemActor): void {
	if (actor.hasWarnedDynamicTrimesh) {
		return;
	}
	actor.hasWarnedDynamicTrimesh = true;
	console.warn(
		`Actor "${actor.name || actor.uuid}" requested collisionShape="trimesh" on a dynamic body; falling back to bounds.`,
	);
}

function resolveCollisionShape(
	shape: CollisionShapeType | undefined,
	isStatic: boolean,
	onDynamicTrimesh?: () => void,
): ResolvedCollisionShape {
	const normalized = shape === 'model' ? 'bounds' : (shape ?? 'capsule');
	if (normalized === 'trimesh' && !isStatic) {
		onDynamicTrimesh?.();
		return 'bounds';
	}
	return normalized;
}

function tagTrimeshCollider(
	colliderDesc: ColliderDesc,
	vertices: Float32Array,
	indices: Uint32Array,
): ColliderDesc {
	(colliderDesc as any).__zylemShapeData = {
		shape: 'trimesh',
		vertices: Array.from(vertices),
		indices: Array.from(indices),
	} as TrimeshMetadata;
	return colliderDesc;
}

function createCapsuleColliderFromDimensions(
	size: { x: number; y: number; z: number },
	translation: { x: number; y: number; z: number },
): ColliderDesc {
	const fullWidth = size.x || 0.5;
	const fullHeight = size.y || 1;
	const fullDepth = size.z || 0.5;
	const radius = Math.max(fullWidth, fullDepth) / 2;
	const halfTotalHeight = fullHeight / 2;
	const halfCylinder = Math.max(0, halfTotalHeight - radius);
	const colliderDesc = ColliderDesc.capsule(halfCylinder, radius);
	colliderDesc.setSensor(false);
	colliderDesc.setTranslation(translation.x, translation.y, translation.z);
	colliderDesc.activeCollisionTypes = ActiveCollisionTypes.DEFAULT;
	return colliderDesc;
}

function createCapsuleCollider(options: ZylemActorOptions): ColliderDesc {
	const size = options.collision?.size ?? options.size ?? { x: 0.5, y: 1, z: 0.5 };
	const fullHeight = (size as any).y || 1;
	const collisionPosition = getCollisionPosition(options);

	return createCapsuleColliderFromDimensions(
		{
			x: (size as any).x || 0.5,
			y: fullHeight,
			z: (size as any).z || 0.5,
		},
		collisionPosition ?? { x: 0, y: fullHeight / 2, z: 0 },
	);
}

function createExplicitBoxCollider(options: ZylemActorOptions): ColliderDesc | null {
	const collisionSize = options.collision?.size;
	if (!collisionSize) {
		return null;
	}

	const halfWidth = (collisionSize as any).x / 2;
	const halfHeight = (collisionSize as any).y / 2;
	const halfDepth = (collisionSize as any).z / 2;
	const colliderDesc = ColliderDesc.cuboid(halfWidth, halfHeight, halfDepth);
	const collisionPosition = getCollisionPosition(options);

	colliderDesc.setSensor(false);
	colliderDesc.setTranslation(
		collisionPosition?.x ?? 0,
		collisionPosition?.y ?? halfHeight,
		collisionPosition?.z ?? 0,
	);
	colliderDesc.activeCollisionTypes = ActiveCollisionTypes.DEFAULT;
	return colliderDesc;
}

function computeActorSpaceMatrix(
	child: Object3D,
	actorRoot: Object3D,
	actorScale: Vector3,
): Matrix4 {
	const actorRootInverse = actorRoot.matrixWorld.clone().invert();
	const actorSpaceMatrix = actorRootInverse.multiply(child.matrixWorld);
	return new Matrix4()
		.makeScale(actorScale.x, actorScale.y, actorScale.z)
		.multiply(actorSpaceMatrix);
}

function computeModelBounds(
	modelRoot: Object3D,
	actorRoot: Object3D,
	actorScale: Vector3,
): ModelBounds | null {
	modelRoot.updateMatrixWorld(true);

	let foundMesh = false;
	const aggregated = new Box3();
	modelRoot.traverse((child) => {
		if (!(child as any).isMesh) {
			return;
		}

		const mesh = child as Mesh;
		const geometry = mesh.geometry;
		if (!geometry) {
			return;
		}

		let localBounds: Box3 | null = null;
		if (mesh instanceof SkinnedMesh) {
			mesh.computeBoundingBox();
			localBounds = mesh.boundingBox?.clone() ?? null;
		} else {
			geometry.computeBoundingBox();
			localBounds = geometry.boundingBox?.clone() ?? null;
		}

		if (!localBounds) {
			return;
		}

		const transformedBounds = localBounds
			.applyMatrix4(computeActorSpaceMatrix(mesh, actorRoot, actorScale));

		if (!foundMesh) {
			aggregated.copy(transformedBounds);
			foundMesh = true;
			return;
		}

		aggregated.union(transformedBounds);
	});

	if (!foundMesh || aggregated.isEmpty()) {
		return null;
	}

	const size = new Vector3();
	const center = new Vector3();
	aggregated.getSize(size);
	aggregated.getCenter(center);
	return { size, center };
}

function computeModelTrimesh(
	modelRoot: Object3D,
	actorRoot: Object3D,
	actorScale: Vector3,
): ModelTrimesh | null {
	modelRoot.updateMatrixWorld(true);

	const vertices: number[] = [];
	const indices: number[] = [];
	const bounds = new Box3();
	const point = new Vector3();
	let foundMesh = false;

	modelRoot.traverse((child) => {
		if (!(child as any).isMesh) {
			return;
		}

		const mesh = child as Mesh;
		const geometry = mesh.geometry;
		if (!geometry) {
			return;
		}

		const position = geometry.getAttribute('position');
		if (!(position instanceof BufferAttribute)) {
			return;
		}

		const transform = computeActorSpaceMatrix(mesh, actorRoot, actorScale);
		const vertexOffset = vertices.length / 3;

		for (let i = 0; i < position.count; i++) {
			point.set(position.getX(i), position.getY(i), position.getZ(i));
			point.applyMatrix4(transform);
			vertices.push(point.x, point.y, point.z);
			bounds.expandByPoint(point);
		}

		const index = geometry.getIndex();
		if (index) {
			for (let i = 0; i < index.count; i++) {
				indices.push(vertexOffset + index.getX(i));
			}
		} else {
			for (let i = 0; i < position.count; i++) {
				indices.push(vertexOffset + i);
			}
		}

		foundMesh = true;
	});

	if (!foundMesh || vertices.length === 0 || indices.length === 0) {
		return null;
	}

	const center = new Vector3();
	bounds.getCenter(center);

	return {
		vertices: new Float32Array(vertices),
		indices: new Uint32Array(indices),
		center,
	};
}

function createBoundsColliderFromModel(
	modelRoot: Object3D | null,
	actorRoot: Object3D | null,
	options: ZylemActorOptions,
): ColliderDesc {
	const explicitCollider = createExplicitBoxCollider(options);
	if (explicitCollider) {
		return explicitCollider;
	}

	if (!modelRoot || !actorRoot) {
		return createCapsuleCollider(options);
	}

	const bounds = computeModelBounds(modelRoot, actorRoot, getActorScale(options));
	if (!bounds) {
		return createCapsuleCollider(options);
	}

	const colliderDesc = ColliderDesc.cuboid(
		bounds.size.x / 2,
		bounds.size.y / 2,
		bounds.size.z / 2,
	);
	const collisionPosition = getCollisionPosition(options);
	colliderDesc.setSensor(false);
	colliderDesc.setTranslation(
		collisionPosition?.x ?? bounds.center.x,
		collisionPosition?.y ?? bounds.center.y,
		collisionPosition?.z ?? bounds.center.z,
	);
	colliderDesc.activeCollisionTypes = ActiveCollisionTypes.DEFAULT;
	return colliderDesc;
}

function createCapsuleColliderFromModel(
	sizingRoot: Object3D | null,
	sizingActorRoot: Object3D | null,
	alignmentRoot: Object3D | null,
	alignmentActorRoot: Object3D | null,
	options: ZylemActorOptions,
): ColliderDesc {
	if (hasExplicitCollisionSize(options)) {
		return createCapsuleCollider(options);
	}

	if (!sizingRoot || !sizingActorRoot) {
		return createCapsuleCollider(options);
	}

	const sizingBounds = computeModelBounds(
		sizingRoot,
		sizingActorRoot,
		getActorScale(options),
	);
	if (!sizingBounds) {
		return createCapsuleCollider(options);
	}

	const collisionPosition = getCollisionPosition(options);
	let translation = collisionPosition;
	if (!translation) {
		const alignmentBounds = alignmentRoot && alignmentActorRoot
			? computeModelBounds(alignmentRoot, alignmentActorRoot, getActorScale(options))
			: null;
		translation = alignmentBounds
			? {
				x: alignmentBounds.center.x,
				y: alignmentBounds.center.y,
				z: alignmentBounds.center.z,
			}
			: {
				x: sizingBounds.center.x,
				y: sizingBounds.center.y,
				z: sizingBounds.center.z,
			};
	}

	return createCapsuleColliderFromDimensions(
		{
			x: sizingBounds.size.x,
			y: sizingBounds.size.y,
			z: sizingBounds.size.z,
		},
		translation,
	);
}

function createTrimeshColliderFromModel(
	modelRoot: Object3D | null,
	actorRoot: Object3D | null,
	options: ZylemActorOptions,
): ColliderDesc {
	const explicitCollider = createExplicitBoxCollider(options);
	if (explicitCollider) {
		return explicitCollider;
	}

	if (!modelRoot || !actorRoot) {
		return createCapsuleCollider(options);
	}

	const trimesh = computeModelTrimesh(modelRoot, actorRoot, getActorScale(options));
	if (!trimesh) {
		return createCapsuleCollider(options);
	}

	const colliderDesc = tagTrimeshCollider(
		ColliderDesc.trimesh(trimesh.vertices, trimesh.indices),
		trimesh.vertices,
		trimesh.indices,
	);
	const collisionPosition = getCollisionPosition(options);
	if (collisionPosition) {
		colliderDesc.setTranslation(
			collisionPosition.x - trimesh.center.x,
			collisionPosition.y - trimesh.center.y,
			collisionPosition.z - trimesh.center.z,
		);
	}
	colliderDesc.setSensor(false);
	colliderDesc.activeCollisionTypes = ActiveCollisionTypes.DEFAULT;
	return colliderDesc;
}

function disposeObjectResources(object: Object3D | null): void {
	if (!object) {
		return;
	}

	object.traverse((child) => {
		if (!(child as any).isMesh) {
			return;
		}

		const mesh = child as SkinnedMesh;
		mesh.geometry?.dispose();
		if (Array.isArray(mesh.material)) {
			mesh.material.forEach((material) => material.dispose());
		} else {
			mesh.material?.dispose();
		}
	});
}

class ActorCollisionBuilder extends EntityCollisionBuilder {
	private objectModel: Object3D | null = null;
	private collisionSource: Object3D | null = null;
	private collisionShape: CollisionShapeType = 'capsule';

	constructor(data: any) {
		super();
		this.objectModel = data.objectModel;
		this.collisionSource = data.collisionSource ?? data.objectModel ?? null;
		this.collisionShape = data.collisionShape ?? 'capsule';
	}

	collider(options: ZylemActorOptions): ColliderDesc {
		const resolvedShape = resolveCollisionShape(
			this.collisionShape,
			Boolean(options.collision?.static),
		);

		if (resolvedShape === 'bounds') {
			return createBoundsColliderFromModel(this.objectModel, this.objectModel, options);
		}

		if (resolvedShape === 'trimesh') {
			return createTrimeshColliderFromModel(this.objectModel, this.objectModel, options);
		}

		return createCapsuleColliderFromModel(
			this.collisionSource,
			this.collisionSource,
			this.objectModel,
			this.objectModel,
			options,
		);
	}
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

	controlledRotation: boolean = false;
	hasWarnedDynamicTrimesh = false;

	constructor(options?: ZylemActorOptions) {
		super();
		this.options = { ...actorDefaults, ...options };
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
		this.loadModelsDeferred(++this._loadGeneration);
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
		let colliderDesc: ColliderDesc;

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
		this.disposeRuntimeState(true);
		this._modelFileNames = [];
	}

	override _cleanup(params: CleanupContext<this>): void {
		super._cleanup(params);
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
			scale: this.options.scale
				? `${this.options.scale.x}, ${this.options.scale.y}, ${this.options.scale.z}`
				: '1, 1, 1',
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
				if (!(child as any).isMesh) {
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

				let meshCount = 0;
				if (this._object) {
					this._object.traverse((child) => {
						if ((child as any).isMesh) {
							meshCount++;
						}
					});

					this.group = new Group();
					this.group.add(this._object);
					this.group.scale.copy(getActorScale(this.options));

					this.applyMaterialOverrides();

					this._animationDelegate = new AnimationDelegate(this._object);
					void this._animationDelegate.loadAnimations(this.options.animations || []).then(() => {
						if (loadGeneration !== this._loadGeneration) {
							return;
						}
						this.dispatch('entity:animation:loaded', {
							entityId: this.uuid,
							animationCount: this.options.animations?.length || 0,
						});
					});
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
				console.error('Failed to load actor model', error);
				this.dispatch('entity:model:loaded', {
					entityId: this.uuid,
					success: false,
					meshCount: 0,
				});
			});
	}

	private applyMaterialOverrides(): void {
		const materialOptions = this.options.material;
		if (
			!materialOptions
			|| (!materialOptions.color && !materialOptions.path && materialOptions.opacity === undefined)
		) {
			return;
		}

		if (!this._object) {
			return;
		}

		this._object.traverse((child) => {
			if (!(child as any).isMesh) {
				return;
			}

			const mesh = child as Mesh;
			if (materialOptions.color) {
				const newMaterial = new MeshStandardMaterial({
					color: materialOptions.color,
					emissiveIntensity: 0.5,
					lightMapIntensity: 0.5,
					fog: true,
					opacity: materialOptions.opacity ?? 1,
					transparent: materialOptions.opacity !== undefined && materialOptions.opacity < 1,
				});
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				mesh.material = newMaterial;
				return;
			}

			if (materialOptions.opacity === undefined) {
				return;
			}

			const applyOpacity = (material: Material): Material => {
				const clonedMaterial = material.clone();
				if ('opacity' in clonedMaterial && 'transparent' in clonedMaterial) {
					const transparentMaterial = clonedMaterial as TransparentMaterial;
					transparentMaterial.opacity = materialOptions.opacity!;
					transparentMaterial.transparent = materialOptions.opacity! < 1;
					transparentMaterial.needsUpdate = true;
				}
				return clonedMaterial;
			};

			mesh.material = Array.isArray(mesh.material)
				? mesh.material.map(applyOpacity)
				: applyOpacity(mesh.material);
		});
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
