import type { SimulationColliderDefinition } from '@zylem/behaviors/core';
import {
	Box3,
	BufferAttribute,
	Matrix4,
	Mesh,
	Object3D,
	SkinnedMesh,
	Vector3,
} from 'three';
import {
	geometryForBounds,
	isGaussianSplatNode,
} from '../../core/loaders/gaussian-model';
import {
	VEC3_ZERO,
	normalizeVec3,
} from '../../core/vector';
import { EntityCollisionBuilder } from '../builder';
import {
	getActorScale,
	type CollisionShapeType,
	type ResolvedCollisionShape,
	type ZylemActorOptions,
} from './types';

type ModelBounds = {
	size: Vector3;
	center: Vector3;
};

type ModelTrimesh = {
	vertices: Float32Array;
	indices: Uint32Array;
	center: Vector3;
};

export type DynamicTrimeshWarner = {
	hasWarnedDynamicTrimesh: boolean;
	name?: string;
	uuid: string;
};

function getCollisionPosition(
	options: ZylemActorOptions,
): { x: number; y: number; z: number } | null {
	const position = options.collision?.position;
	if (!position) {
		return null;
	}
	return normalizeVec3(position, VEC3_ZERO);
}

export function hasExplicitCollisionSize(options: ZylemActorOptions): boolean {
	return Boolean(options.collision?.size);
}

export function warnDynamicTrimeshOnce(actor: DynamicTrimeshWarner): void {
	if (actor.hasWarnedDynamicTrimesh) {
		return;
	}
	actor.hasWarnedDynamicTrimesh = true;
	console.warn(
		`Actor "${actor.name || actor.uuid}" requested collisionShape="trimesh" on a dynamic body; falling back to bounds.`,
	);
}

export function resolveCollisionShape(
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

function createCapsuleColliderFromDimensions(
	size: { x: number; y: number; z: number },
	translation: { x: number; y: number; z: number },
): SimulationColliderDefinition {
	const fullWidth = size.x || 0.5;
	const fullHeight = size.y || 1;
	const fullDepth = size.z || 0.5;
	const radius = Math.max(fullWidth, fullDepth) / 2;
	const halfTotalHeight = fullHeight / 2;
	const halfCylinder = Math.max(0, halfTotalHeight - radius);
	return {
		shape: { type: 'capsule', halfHeight: halfCylinder, radius },
		offset: [translation.x, translation.y, translation.z],
		sensor: false,
	};
}

function createCapsuleCollider(options: ZylemActorOptions): SimulationColliderDefinition {
	const size = normalizeVec3(options.collision?.size ?? options.size, {
		x: 0.5,
		y: 1,
		z: 0.5,
	});
	const fullHeight = size.y || 1;
	const collisionPosition = getCollisionPosition(options);

	return createCapsuleColliderFromDimensions(
		{
			x: size.x || 0.5,
			y: fullHeight,
			z: size.z || 0.5,
		},
		collisionPosition ?? { x: 0, y: fullHeight / 2, z: 0 },
	);
}

function createExplicitBoxCollider(options: ZylemActorOptions): SimulationColliderDefinition | null {
	const collisionSize = options.collision?.size;
	if (!collisionSize) {
		return null;
	}

	const normalizedSize = normalizeVec3(collisionSize, VEC3_ZERO);
	const halfWidth = normalizedSize.x / 2;
	const halfHeight = normalizedSize.y / 2;
	const halfDepth = normalizedSize.z / 2;
	const collisionPosition = getCollisionPosition(options);

	return {
		shape: { type: 'box', halfExtents: [halfWidth, halfHeight, halfDepth] },
		offset: [
			collisionPosition?.x ?? 0,
			collisionPosition?.y ?? halfHeight,
			collisionPosition?.z ?? 0,
		],
		sensor: Boolean(options.collision?.sensor),
	};
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
		if (!(child as Mesh).isMesh) {
			return;
		}

		const mesh = child as Mesh;
		const geometry = geometryForBounds(mesh);
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
		if (!(child as Mesh).isMesh || isGaussianSplatNode(child)) {
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

export function createBoundsColliderFromModel(
	modelRoot: Object3D | null,
	actorRoot: Object3D | null,
	options: ZylemActorOptions,
): SimulationColliderDefinition {
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

	const collisionPosition = getCollisionPosition(options);
	return {
		shape: {
			type: 'box',
			halfExtents: [bounds.size.x / 2, bounds.size.y / 2, bounds.size.z / 2],
		},
		offset: [
			collisionPosition?.x ?? bounds.center.x,
			collisionPosition?.y ?? bounds.center.y,
			collisionPosition?.z ?? bounds.center.z,
		],
		sensor: false,
	};
}

export function createCapsuleColliderFromModel(
	sizingRoot: Object3D | null,
	sizingActorRoot: Object3D | null,
	alignmentRoot: Object3D | null,
	alignmentActorRoot: Object3D | null,
	options: ZylemActorOptions,
): SimulationColliderDefinition {
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

export function createTrimeshColliderFromModel(
	modelRoot: Object3D | null,
	actorRoot: Object3D | null,
	options: ZylemActorOptions,
): SimulationColliderDefinition {
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

	const collisionPosition = getCollisionPosition(options);
	return {
		shape: { type: 'trimesh', vertices: trimesh.vertices, indices: trimesh.indices },
		offset: collisionPosition
			? [
				collisionPosition.x - trimesh.center.x,
				collisionPosition.y - trimesh.center.y,
				collisionPosition.z - trimesh.center.z,
			]
			: [0, 0, 0],
		sensor: false,
	};
}

export class ActorCollisionBuilder extends EntityCollisionBuilder {
	private objectModel: Object3D | null = null;
	private collisionSource: Object3D | null = null;
	private collisionShape: CollisionShapeType = 'capsule';

	constructor(data: any) {
		super();
		this.objectModel = data.objectModel;
		this.collisionSource = data.collisionSource ?? data.objectModel ?? null;
		this.collisionShape = data.collisionShape ?? 'capsule';
	}

	collider(options: ZylemActorOptions): SimulationColliderDefinition {
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
