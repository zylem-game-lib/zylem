import type { IWorld } from 'bitecs';
import {
	ActiveCollisionTypes,
	ColliderDesc,
} from '@dimforge/rapier3d-compat';
import {
	DestructibleMesh,
	FractureOptions as PinataFractureOptions,
} from '@dgreenheck/three-pinata';
import {
	Box3,
	BufferAttribute,
	Group,
	Matrix4,
	Vector2,
	Vector3,
	type Material,
	type Mesh,
	type Object3D,
} from 'three';

import { defineBehavior, type BehaviorRef } from '../behavior-descriptor';
import type { BehaviorEntityLink, BehaviorSystem } from '../behavior-system';
import type { GameEntity } from '../../entities/entity';

export type FractureOptionsInput =
	NonNullable<ConstructorParameters<typeof PinataFractureOptions>[0]>;

export type Destructible3DFragmentColliderShape =
	| 'convexHull'
	| 'cuboid'
	| 'trimesh';

export interface Destructible3DColliderOptions {
	shape?: Destructible3DFragmentColliderShape;
	sensor?: boolean;
	collisionGroups?: number;
	activeCollisionTypes?: number;
}

export interface Destructible3DBehaviorOptions {
	fractureOptions?: FractureOptionsInput | PinataFractureOptions;
	innerMaterial?: Material | null;
	collider?: Destructible3DColliderOptions;
}

export interface Destructible3DHandle {
	fracture(
		overrideOptions?: FractureOptionsInput | PinataFractureOptions,
	): readonly DestructibleMesh[];
	repair(): void;
	isFractured(): boolean;
	getFragments(): readonly DestructibleMesh[];
}

interface RuntimeState {
	fragmentContainer: Group | null;
	fragments: DestructibleMesh[];
	createdRootGroup: boolean;
	isFractured: boolean;
	originalMeshParent: Object3D | null;
	originalColliderDesc: ColliderDesc | undefined;
	originalColliderDescs: ColliderDesc[];
}

interface PhysicsSnapshot {
	translation: { x: number; y: number; z: number };
	rotation: { x: number; y: number; z: number; w: number };
	linearVelocity: { x: number; y: number; z: number };
	angularVelocity: { x: number; y: number; z: number };
}

const DESTRUCTIBLE_3D_BEHAVIOR_KEY = Symbol.for(
	'zylem:behavior:destructible-3d',
);

const DEFAULT_FRACTURE_OPTIONS: FractureOptionsInput = {
	fractureMethod: 'voronoi',
	fragmentCount: 12,
	voronoiOptions: {
		mode: '3D',
	},
	fracturePlanes: {
		x: true,
		y: true,
		z: true,
	},
	textureScale: new Vector2(1, 1),
	textureOffset: new Vector2(0, 0),
};

const defaultOptions: Destructible3DBehaviorOptions = {
	fractureOptions: DEFAULT_FRACTURE_OPTIONS,
	innerMaterial: null,
	collider: {
		shape: 'convexHull',
		sensor: false,
		activeCollisionTypes: ActiveCollisionTypes.DEFAULT,
	},
};

const runtimeStates = new WeakMap<
	BehaviorRef<Destructible3DBehaviorOptions>,
	RuntimeState
>();

function getRuntimeState(
	ref: BehaviorRef<Destructible3DBehaviorOptions>,
): RuntimeState {
	const existing = runtimeStates.get(ref);
	if (existing) {
		return existing;
	}

	const state: RuntimeState = {
		fragmentContainer: null,
		fragments: [],
		createdRootGroup: false,
		isFractured: false,
		originalMeshParent: null,
		originalColliderDesc: undefined,
		originalColliderDescs: [],
	};
	runtimeStates.set(ref, state);
	return state;
}

function requireEntity(
	ref: BehaviorRef<Destructible3DBehaviorOptions>,
): GameEntity<any> {
	const entity = (ref as any).__entity as GameEntity<any> | undefined;
	if (!entity) {
		throw new Error(
			'Destructible3DBehavior requires the entity to be registered on a stage before calling fracture() or repair().',
		);
	}

	return entity;
}

function getBehaviorWorld(
	ref: BehaviorRef<Destructible3DBehaviorOptions>,
): {
	destroyEntity(entity: GameEntity<any>): void;
	addEntity(entity: GameEntity<any>): void;
} | null {
	return ((ref as any).__world ?? null) as {
		destroyEntity(entity: GameEntity<any>): void;
		addEntity(entity: GameEntity<any>): void;
	} | null;
}

function cloneFractureOptionsInput(
	value?: FractureOptionsInput | PinataFractureOptions,
): FractureOptionsInput {
	if (!value) {
		return {};
	}

	if (value instanceof PinataFractureOptions) {
		return {
			fractureMethod: value.fractureMethod,
			fragmentCount: value.fragmentCount,
			voronoiOptions: value.voronoiOptions
				? {
					mode: value.voronoiOptions.mode,
					seedPoints: value.voronoiOptions.seedPoints?.map((point) =>
						point.clone()),
					impactPoint: value.voronoiOptions.impactPoint?.clone(),
					impactRadius: value.voronoiOptions.impactRadius,
					projectionAxis: value.voronoiOptions.projectionAxis,
					projectionNormal: value.voronoiOptions.projectionNormal?.clone(),
					useApproximation: value.voronoiOptions.useApproximation,
					approximationNeighborCount:
						value.voronoiOptions.approximationNeighborCount,
				}
				: undefined,
			fracturePlanes: value.fracturePlanes
				? { ...value.fracturePlanes }
				: undefined,
			textureScale: value.textureScale?.clone(),
			textureOffset: value.textureOffset?.clone(),
			seed: value.seed,
		};
	}

	return {
		...value,
		voronoiOptions: value.voronoiOptions
			? {
				...value.voronoiOptions,
				seedPoints: value.voronoiOptions.seedPoints?.map((point) =>
					point.clone()),
				impactPoint: value.voronoiOptions.impactPoint?.clone(),
				projectionNormal: value.voronoiOptions.projectionNormal?.clone(),
			}
			: undefined,
		fracturePlanes: value.fracturePlanes
			? { ...value.fracturePlanes }
			: undefined,
		textureScale: value.textureScale?.clone(),
		textureOffset: value.textureOffset?.clone(),
	};
}

function resolveFractureOptions(
	baseValue?: FractureOptionsInput | PinataFractureOptions,
	overrideValue?: FractureOptionsInput | PinataFractureOptions,
): PinataFractureOptions {
	const base = cloneFractureOptionsInput(baseValue);
	const override = cloneFractureOptionsInput(overrideValue);

	const fractureMethod =
		override.fractureMethod
		?? base.fractureMethod
		?? DEFAULT_FRACTURE_OPTIONS.fractureMethod
		?? 'voronoi';

	const voronoiOptions = fractureMethod === 'voronoi'
		? {
			mode:
				override.voronoiOptions?.mode
				?? base.voronoiOptions?.mode
				?? DEFAULT_FRACTURE_OPTIONS.voronoiOptions?.mode
				?? '3D',
			seedPoints:
				override.voronoiOptions?.seedPoints
				?? base.voronoiOptions?.seedPoints,
			impactPoint:
				override.voronoiOptions?.impactPoint
				?? base.voronoiOptions?.impactPoint,
			impactRadius:
				override.voronoiOptions?.impactRadius
				?? base.voronoiOptions?.impactRadius,
			projectionAxis:
				override.voronoiOptions?.projectionAxis
				?? base.voronoiOptions?.projectionAxis,
			projectionNormal:
				override.voronoiOptions?.projectionNormal
				?? base.voronoiOptions?.projectionNormal,
			useApproximation:
				override.voronoiOptions?.useApproximation
				?? base.voronoiOptions?.useApproximation,
			approximationNeighborCount:
				override.voronoiOptions?.approximationNeighborCount
				?? base.voronoiOptions?.approximationNeighborCount,
		}
		: undefined;

	return new PinataFractureOptions({
		fractureMethod,
		fragmentCount:
			override.fragmentCount
			?? base.fragmentCount
			?? DEFAULT_FRACTURE_OPTIONS.fragmentCount
			?? 12,
		voronoiOptions,
		fracturePlanes: {
			x:
				override.fracturePlanes?.x
				?? base.fracturePlanes?.x
				?? DEFAULT_FRACTURE_OPTIONS.fracturePlanes?.x
				?? true,
			y:
				override.fracturePlanes?.y
				?? base.fracturePlanes?.y
				?? DEFAULT_FRACTURE_OPTIONS.fracturePlanes?.y
				?? true,
			z:
				override.fracturePlanes?.z
				?? base.fracturePlanes?.z
				?? DEFAULT_FRACTURE_OPTIONS.fracturePlanes?.z
				?? true,
		},
		textureScale:
			override.textureScale?.clone()
			?? base.textureScale?.clone()
			?? DEFAULT_FRACTURE_OPTIONS.textureScale?.clone()
			?? new Vector2(1, 1),
		textureOffset:
			override.textureOffset?.clone()
			?? base.textureOffset?.clone()
			?? DEFAULT_FRACTURE_OPTIONS.textureOffset?.clone()
			?? new Vector2(0, 0),
		seed: override.seed ?? base.seed,
	});
}

function resolveColliderOptions(
	input?: Destructible3DColliderOptions,
): Required<
	Pick<Destructible3DColliderOptions, 'shape' | 'sensor' | 'activeCollisionTypes'>
> & Omit<Destructible3DColliderOptions, 'shape' | 'sensor' | 'activeCollisionTypes'> {
	return {
		shape: input?.shape ?? defaultOptions.collider?.shape ?? 'convexHull',
		sensor: input?.sensor ?? defaultOptions.collider?.sensor ?? false,
		collisionGroups: input?.collisionGroups,
		activeCollisionTypes:
			input?.activeCollisionTypes
			?? defaultOptions.collider?.activeCollisionTypes
			?? ActiveCollisionTypes.DEFAULT,
	};
}

function getPrimaryMaterial(mesh: Mesh): Material {
	if (Array.isArray(mesh.material)) {
		const material = mesh.material[0];
		if (material) {
			return material;
		}
	} else if (mesh.material) {
		return mesh.material;
	}

	throw new Error(
		'Destructible3DBehavior requires the entity mesh to have a material.',
	);
}

function ensureRootGroup(
	entity: GameEntity<any>,
	state: RuntimeState,
): Group {
	if (entity.group) {
		state.createdRootGroup = false;
		return entity.group;
	}

	if (!entity.mesh) {
		throw new Error(
			'Destructible3DBehavior requires the entity to have a primary mesh.',
		);
	}

	const originalMesh = entity.mesh;
	const parent = originalMesh.parent;
	const root = new Group();
	root.name = `${entity.name ?? entity.uuid}-destructible-root`;
	root.position.copy(originalMesh.position);
	root.quaternion.copy(originalMesh.quaternion);
	root.scale.copy(originalMesh.scale);

	originalMesh.position.set(0, 0, 0);
	originalMesh.quaternion.identity();
	originalMesh.scale.set(1, 1, 1);

	if (parent) {
		parent.remove(originalMesh);
		parent.add(root);
	}

	root.add(originalMesh);
	entity.group = root;
	state.createdRootGroup = true;
	return root;
}

function createFractureSourceMesh(
	mesh: Mesh,
	root: Group,
	innerMaterial: Material | null | undefined,
): DestructibleMesh {
	const geometry = mesh.geometry.clone();
	root.updateMatrixWorld(true);
	mesh.updateMatrixWorld(true);

	const relativeMatrix = new Matrix4()
		.copy(root.matrixWorld)
		.invert()
		.multiply(mesh.matrixWorld);

	geometry.applyMatrix4(relativeMatrix);
	geometry.computeBoundingBox();
	geometry.computeBoundingSphere();

	const outerMaterial = getPrimaryMaterial(mesh);
	return new DestructibleMesh(
		geometry,
		outerMaterial,
		innerMaterial ?? outerMaterial,
	);
}

function tagConvexHullCollider(
	colliderDesc: ColliderDesc,
	vertices: Float32Array,
): ColliderDesc {
	(colliderDesc as any).__zylemShapeData = {
		shape: 'convexHull',
		vertices: Array.from(vertices),
	};
	return colliderDesc;
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
	};
	return colliderDesc;
}

function getFragmentVertices(fragment: DestructibleMesh): Float32Array {
	const position = fragment.geometry.getAttribute('position');
	if (!(position instanceof BufferAttribute)) {
		throw new Error('Fragment geometry is missing a position attribute.');
	}

	return new Float32Array(position.array as ArrayLike<number>);
}

function getFragmentIndices(fragment: DestructibleMesh): Uint32Array {
	const geometryIndex = fragment.geometry.getIndex();
	if (geometryIndex) {
		return new Uint32Array(geometryIndex.array as ArrayLike<number>);
	}

	const position = fragment.geometry.getAttribute('position');
	if (!(position instanceof BufferAttribute)) {
		return new Uint32Array();
	}

	return Uint32Array.from({ length: position.count }, (_value, index) => index);
}

function createCuboidCollider(fragment: DestructibleMesh): ColliderDesc {
	const bounds = fragment.geometry.boundingBox ?? new Box3();
	if (!fragment.geometry.boundingBox) {
		fragment.geometry.computeBoundingBox();
	}
	bounds.copy(fragment.geometry.boundingBox ?? bounds);
	const size = bounds.getSize(new Vector3());
	return ColliderDesc.cuboid(
		Math.max(size.x / 2, 0.001),
		Math.max(size.y / 2, 0.001),
		Math.max(size.z / 2, 0.001),
	);
}

function createFragmentColliderDesc(
	fragment: DestructibleMesh,
	options: Destructible3DColliderOptions | undefined,
): ColliderDesc {
	const resolved = resolveColliderOptions(options);
	const vertices = getFragmentVertices(fragment);

	let colliderDesc: ColliderDesc | null = null;

	if (resolved.shape === 'convexHull') {
		colliderDesc = ColliderDesc.convexHull(vertices);
		if (colliderDesc) {
			colliderDesc = tagConvexHullCollider(colliderDesc, vertices);
		}
	}

	if (!colliderDesc && resolved.shape === 'trimesh') {
		const indices = getFragmentIndices(fragment);
		colliderDesc = tagTrimeshCollider(
			ColliderDesc.trimesh(vertices, indices),
			vertices,
			indices,
		);
	}

	if (!colliderDesc) {
		colliderDesc = createCuboidCollider(fragment);
	}

	colliderDesc.setTranslation(
		fragment.position.x,
		fragment.position.y,
		fragment.position.z,
	);
	colliderDesc.setSensor(resolved.sensor);
	if (resolved.collisionGroups !== undefined) {
		colliderDesc.setCollisionGroups(resolved.collisionGroups);
	}
	colliderDesc.activeCollisionTypes = resolved.activeCollisionTypes;
	return colliderDesc;
}

function snapshotBody(entity: GameEntity<any>): PhysicsSnapshot | null {
	if (!entity.body) {
		return null;
	}

	return {
		translation: entity.body.translation(),
		rotation: entity.body.rotation(),
		linearVelocity: entity.body.linvel(),
		angularVelocity: entity.body.angvel(),
	};
}

function restoreBodySnapshot(
	entity: GameEntity<any>,
	snapshot: PhysicsSnapshot | null,
): void {
	if (!snapshot || !entity.body) {
		return;
	}

	entity.body.setTranslation(snapshot.translation, true);
	entity.body.setRotation(snapshot.rotation, true);
	entity.body.setLinvel(snapshot.linearVelocity, true);
	entity.body.setAngvel(snapshot.angularVelocity, true);
}

function refreshEntityPhysics(
	ref: BehaviorRef<Destructible3DBehaviorOptions>,
	entity: GameEntity<any>,
): void {
	const world = getBehaviorWorld(ref);
	if (!world || !entity.physicsAttached) {
		return;
	}

	const snapshot = snapshotBody(entity);
	world.destroyEntity(entity);
	world.addEntity(entity);
	restoreBodySnapshot(entity, snapshot);
}

function disposeFragments(fragments: readonly DestructibleMesh[]): void {
	for (const fragment of fragments) {
		fragment.removeFromParent();
		fragment.geometry.dispose();
	}
}

function restoreOriginalMesh(
	entity: GameEntity<any>,
	state: RuntimeState,
): void {
	if (!entity.mesh) {
		return;
	}

	if (state.createdRootGroup && entity.group) {
		const root = entity.group;
		const parent = root.parent;
		entity.mesh.position.copy(root.position);
		entity.mesh.quaternion.copy(root.quaternion);
		entity.mesh.scale.copy(root.scale);
		entity.mesh.removeFromParent();

		if (parent) {
			parent.remove(root);
			parent.add(entity.mesh);
		}

		entity.group = undefined;
		return;
	}

	const parent = state.originalMeshParent ?? entity.group;
	if (parent && entity.mesh.parent !== parent) {
		parent.add(entity.mesh);
	}
}

function restoreRuntimeState(
	ref: BehaviorRef<Destructible3DBehaviorOptions>,
	refreshPhysics: boolean,
): void {
	const state = getRuntimeState(ref);
	if (!state.isFractured) {
		return;
	}

	const entity = requireEntity(ref);
	state.fragmentContainer?.removeFromParent();
	state.fragmentContainer?.clear();
	state.fragmentContainer = null;
	disposeFragments(state.fragments);
	state.fragments = [];

	restoreOriginalMesh(entity, state);

	entity.colliderDesc = state.originalColliderDesc;
	entity.colliderDescs = [...state.originalColliderDescs];
	if (!entity.colliderDesc && entity.colliderDescs.length > 0) {
		entity.colliderDesc = entity.colliderDescs[0];
	}

	state.createdRootGroup = false;
	state.originalMeshParent = null;
	state.originalColliderDesc = undefined;
	state.originalColliderDescs = [];
	state.isFractured = false;

	if (refreshPhysics) {
		refreshEntityPhysics(ref, entity);
	}
}

function fractureEntity(
	ref: BehaviorRef<Destructible3DBehaviorOptions>,
	overrideOptions?: FractureOptionsInput | PinataFractureOptions,
): readonly DestructibleMesh[] {
	const entity = requireEntity(ref);
	if (entity.isInstanced) {
		throw new Error(
			'Destructible3DBehavior does not support entities using instanced rendering.',
		);
	}

	if (!entity.mesh?.geometry) {
		throw new Error(
			'Destructible3DBehavior requires the entity to have a primary mesh geometry.',
		);
	}

	if (getRuntimeState(ref).isFractured) {
		restoreRuntimeState(ref, false);
	}

	const state = getRuntimeState(ref);
	const root = ensureRootGroup(entity, state);
	state.originalMeshParent = entity.mesh.parent;
	state.originalColliderDesc = entity.colliderDesc;
	state.originalColliderDescs = entity.colliderDescs.length > 0
		? [...entity.colliderDescs]
		: entity.colliderDesc
			? [entity.colliderDesc]
			: [];

	const source = createFractureSourceMesh(
		entity.mesh,
		root,
		ref.options.innerMaterial,
	);

	try {
		const fractureOptions = resolveFractureOptions(
			ref.options.fractureOptions,
			overrideOptions,
		);
		const fragments = source.fracture(fractureOptions);
		const fragmentContainer = new Group();
		fragmentContainer.name = `${entity.name ?? entity.uuid}-fracture-fragments`;
		for (const fragment of fragments) {
			fragmentContainer.add(fragment);
		}

		entity.mesh.removeFromParent();
		root.add(fragmentContainer);

		state.fragmentContainer = fragmentContainer;
		state.fragments = fragments;
		state.isFractured = true;

		const colliderDescs = fragments.map((fragment) =>
			createFragmentColliderDesc(fragment, ref.options.collider));
		if (colliderDescs.length > 0) {
			entity.colliderDescs = colliderDescs;
			entity.colliderDesc = colliderDescs[0];
			refreshEntityPhysics(ref, entity);
		}

		return fragments;
	} catch (error) {
		restoreOriginalMesh(entity, state);
		throw error;
	} finally {
		source.geometry.dispose();
	}
}

function createDestructible3DHandle(
	ref: BehaviorRef<Destructible3DBehaviorOptions>,
): Destructible3DHandle {
	return {
		fracture: (overrideOptions) => fractureEntity(ref, overrideOptions),
		repair: () => restoreRuntimeState(ref, true),
		isFractured: () => getRuntimeState(ref).isFractured,
		getFragments: () => getRuntimeState(ref).fragments,
	};
}

class Destructible3DSystem implements BehaviorSystem {
	constructor(
		private world: unknown,
		private scene: unknown,
		private getBehaviorLinks?: (key: symbol) => Iterable<BehaviorEntityLink>,
	) {
		this.primeLinks();
	}

	update(_ecs: IWorld, _delta: number): void {
		this.primeLinks();
	}

	destroy(_ecs: IWorld): void {
		const links = this.getBehaviorLinks?.(DESTRUCTIBLE_3D_BEHAVIOR_KEY);
		if (!links) {
			return;
		}

		for (const link of links) {
			restoreRuntimeState(
				link.ref as BehaviorRef<Destructible3DBehaviorOptions>,
				false,
			);
		}
	}

	private primeLinks(): void {
		const links = this.getBehaviorLinks?.(DESTRUCTIBLE_3D_BEHAVIOR_KEY);
		if (!links) {
			return;
		}

		for (const link of links) {
			const ref = link.ref as BehaviorRef<Destructible3DBehaviorOptions> & {
				__cleanupRegistered?: boolean;
			};
			const entity = link.entity as GameEntity<any>;
			(ref as any).__entity = entity;
			(ref as any).__world = this.world;
			(ref as any).__scene = this.scene;

			if (!ref.__cleanupRegistered) {
				entity.onCleanup(() => {
					restoreRuntimeState(ref, false);
				});
				ref.__cleanupRegistered = true;
			}
		}
	}
}

export const Destructible3DBehavior = defineBehavior<
	Destructible3DBehaviorOptions,
	Destructible3DHandle
>({
	name: 'destructible-3d',
	defaultOptions,
	systemFactory: (ctx) =>
		new Destructible3DSystem(
			ctx.world,
			ctx.scene,
			ctx.getBehaviorLinks,
		),
	createHandle: createDestructible3DHandle,
});
