import { BufferGeometry, InstancedMesh, Material, Matrix4, Object3D, Vector3, Quaternion } from 'three';
import type { GameEntity, GameEntityOptions } from '../entities/entity';
import { shortHash, sortedStringify } from '../core/utility/strings';
import { getBodyRenderPose } from '../physics/physics-pose';

/**
 * Entities sharing the same geometry and material, drawn via one InstancedMesh.
 */
export interface PackGroup {
	/** Unique key identifying this pack */
	key: string;
	/** The instanced mesh for rendering */
	instancedMesh: InstancedMesh;
	/** Original geometry */
	geometry: BufferGeometry;
	/** Original material */
	material: Material;
	/** Map of entity UUID to instance index */
	entityMap: Map<string, number>;
	/** List of entities in this pack (by their index) */
	entities: (GameEntity<any> | null)[];
	/** Indices that have been freed and can be reused */
	freeIndices: number[];
	/** Active indices for fast iteration */
	activeIndices: number[];
	/** Dirty flags for transforms that need syncing */
	dirtyIndices: Set<number>;
	/** Maximum capacity */
	capacity: number;
}

/** Configuration for pack key generation */
export interface PackKeyConfig {
	geometryType: string;
	dimensions: Record<string, number>;
	materialPath?: string | null;
	shaderType?: 'standard' | 'custom';
	colorHex?: number;
}

/** Manages instanced mesh packs for `category: 'pack'` entities */
export class InstanceManager {
	private packs: Map<string, PackGroup> = new Map();
	private entityToPack: Map<string, string> = new Map();
	private scene: Object3D | null = null;

	/** Default initial capacity for new packs */
	static DEFAULT_CAPACITY = 128;
	/** Factor to grow a pack when full */
	static GROWTH_FACTOR = 2;

	setScene(scene: Object3D): void {
		this.scene = scene;
	}

	static generatePackKey(config: PackKeyConfig): string {
		const keyData = {
			geo: `${config.geometryType}:${sortedStringify(config.dimensions)}`,
			mat: config.materialPath || 'none',
			shader: config.shaderType || 'standard',
			color: config.colorHex ?? 0xffffff,
		};
		return shortHash(sortedStringify(keyData));
	}

	static generateEntityPackKey(
		entity: Pick<GameEntity<GameEntityOptions>, 'options' | 'materials'> & { constructor: any },
	): string {
		const options = entity.options as GameEntityOptions & {
			runtime?: { packKeyOverride?: string };
		};
		if (options.runtime?.packKeyOverride) {
			return options.runtime.packKeyOverride;
		}

		const entityType = entity.constructor?.type?.description || 'unknown';
		const size = (options.size as Record<string, number> | undefined) || { x: 1, y: 1, z: 1 };
		const matOptions = options.material || {};
		return InstanceManager.generatePackKey({
			geometryType: entityType,
			dimensions: { x: size.x, y: size.y, z: size.z },
			materialPath: matOptions.path || null,
			shaderType: matOptions.shader ? 'custom' : 'standard',
			colorHex: matOptions.color?.getHex?.() || options.color?.getHex?.() || 0xffffff,
		});
	}

	/**
	 * Register an entity with the instance manager.
	 * @returns The instance index, or -1 if registration failed
	 */
	register(
		entity: GameEntity<any>,
		geometry: BufferGeometry,
		material: Material,
		packKey: string,
	): number {
		let pack = this.packs.get(packKey);

		if (!pack) {
			pack = this.createPack(packKey, geometry, material);
		}

		let index: number;
		if (pack.freeIndices.length > 0) {
			index = pack.freeIndices.pop()!;
		} else {
			index = pack.entities.length;
			if (index >= pack.capacity) {
				this.growPack(pack);
			}
			pack.entities.push(null);
		}

		pack.entities[index] = entity;
		pack.entityMap.set(entity.uuid, index);
		this.entityToPack.set(entity.uuid, packKey);

		pack.instancedMesh.count = Math.max(pack.instancedMesh.count, index + 1);
		pack.activeIndices.push(index);
		pack.dirtyIndices.add(index);

		return index;
	}

	unregister(entity: GameEntity<any>): void {
		const packKey = this.entityToPack.get(entity.uuid);
		if (!packKey) return;

		const pack = this.packs.get(packKey);
		if (!pack) return;

		const index = pack.entityMap.get(entity.uuid);
		if (index === undefined) return;

		pack.entities[index] = null;
		pack.entityMap.delete(entity.uuid);
		this.entityToPack.delete(entity.uuid);
		pack.freeIndices.push(index);

		const idxInActive = pack.activeIndices.indexOf(index);
		if (idxInActive !== -1) {
			const last = pack.activeIndices.pop()!;
			if (idxInActive < pack.activeIndices.length) {
				pack.activeIndices[idxInActive] = last;
			}
		}
		pack.dirtyIndices.delete(index);

		const matrix = new Matrix4();
		matrix.makeScale(0, 0, 0);
		pack.instancedMesh.setMatrixAt(index, matrix);
		pack.instancedMesh.instanceMatrix.needsUpdate = true;
	}

	markDirty(entity: GameEntity<any>): void {
		const packKey = this.entityToPack.get(entity.uuid);
		if (!packKey) return;

		const pack = this.packs.get(packKey);
		if (!pack) return;

		const index = pack.entityMap.get(entity.uuid);
		if (index !== undefined) {
			pack.dirtyIndices.add(index);
		}
	}

	/**
	 * Update all active instance transforms.
	 * Call once per frame after the simulation step and render-buffer sync.
	 */
	update(interpolationAlpha = 0): void {
		const matrix = new Matrix4();
		const pos = new Vector3();
		const quat = new Quaternion();
		const scale = new Vector3(1, 1, 1);

		for (const pack of this.packs.values()) {
			if (pack.activeIndices.length === 0) continue;

			let needsUpdate = false;
			for (const index of pack.activeIndices) {
				const entity = pack.entities[index];
				if (!entity) continue;

				const isDirty = pack.dirtyIndices.has(index);
				const hasBody = !!entity.body;
				if (!isDirty && !hasBody) {
					continue;
				}
				// Sleeping dynamics don't move — skip matrix writes unless
				// explicitly dirtied (spawn / unregister).
				if (!isDirty && hasBody) {
					const sleepBody = entity.body as { isRenderSleeping?: () => boolean };
					if (
						typeof sleepBody.isRenderSleeping === 'function' &&
						sleepBody.isRenderSleeping()
					) {
						continue;
					}
				}

				this.updateInstanceMatrix(pack, index, matrix, pos, quat, scale, interpolationAlpha);
				needsUpdate = true;
			}

			pack.dirtyIndices.clear();

			if (needsUpdate) {
				pack.instancedMesh.instanceMatrix.needsUpdate = true;
			}
		}
	}

	private updateInstanceMatrix(
		pack: PackGroup,
		index: number,
		matrix: Matrix4,
		pos: Vector3,
		quat: Quaternion,
		scale: Vector3,
		interpolationAlpha: number,
	) {
		const entity = pack.entities[index];
		if (!entity) return;

		if (entity.body) {
			const body = entity.body as {
				writeRenderPose?: (
					alpha: number,
					outPosition: Vector3,
					outRotation: Quaternion,
				) => void;
			};
			if (typeof body.writeRenderPose === 'function') {
				// Zero-alloc fast path: interpolate straight from the shared
				// wasm render buffer into the preallocated temporaries.
				body.writeRenderPose(interpolationAlpha, pos, quat);
			} else {
				const renderPose = getBodyRenderPose(entity.body, interpolationAlpha);
				pos.set(renderPose.position.x, renderPose.position.y, renderPose.position.z);
				quat.set(
					renderPose.rotation.x,
					renderPose.rotation.y,
					renderPose.rotation.z,
					renderPose.rotation.w,
				);
			}
			matrix.compose(pos, quat, scale);
		} else if (entity.mesh) {
			entity.mesh.updateMatrix();
			matrix.copy(entity.mesh.matrix);
		} else if (entity.group) {
			entity.group.updateMatrix();
			matrix.copy(entity.group.matrix);
		}

		pack.instancedMesh.setMatrixAt(index, matrix);
	}

	getPackInfo(entity: GameEntity<any>): { packKey: string; instanceId: number } | null {
		const packKey = this.entityToPack.get(entity.uuid);
		if (!packKey) return null;

		const pack = this.packs.get(packKey);
		if (!pack) return null;

		const instanceId = pack.entityMap.get(entity.uuid);
		if (instanceId === undefined) return null;

		return { packKey, instanceId };
	}

	getStats(): {
		packCount: number;
		totalInstances: number;
		packs: { key: string; count: number; capacity: number }[];
	} {
		let totalInstances = 0;
		const packs: { key: string; count: number; capacity: number }[] = [];

		for (const [key, pack] of this.packs) {
			const count = pack.entityMap.size;
			totalInstances += count;
			packs.push({ key, count, capacity: pack.capacity });
		}

		return { packCount: this.packs.size, totalInstances, packs };
	}

	dispose(): void {
		for (const pack of this.packs.values()) {
			if (this.scene) {
				this.scene.remove(pack.instancedMesh);
			}
			pack.instancedMesh.dispose();
			pack.geometry.dispose();
		}
		this.packs.clear();
		this.entityToPack.clear();
	}

	private createPack(key: string, geometry: BufferGeometry, material: Material): PackGroup {
		const capacity = InstanceManager.DEFAULT_CAPACITY;
		const instancedMesh = new InstancedMesh(geometry, material, capacity);
		instancedMesh.count = 0;
		instancedMesh.frustumCulled = false;

		const hiddenMatrix = new Matrix4().makeScale(0, 0, 0);
		for (let i = 0; i < capacity; i++) {
			instancedMesh.setMatrixAt(i, hiddenMatrix);
		}
		instancedMesh.instanceMatrix.needsUpdate = true;

		const pack: PackGroup = {
			key,
			instancedMesh,
			geometry,
			material,
			entityMap: new Map(),
			entities: [],
			freeIndices: [],
			activeIndices: [],
			dirtyIndices: new Set(),
			capacity,
		};

		this.packs.set(key, pack);

		if (this.scene) {
			this.scene.add(instancedMesh);
		}

		return pack;
	}

	private growPack(pack: PackGroup): void {
		const newCapacity = pack.capacity * InstanceManager.GROWTH_FACTOR;

		const newInstancedMesh = new InstancedMesh(pack.geometry, pack.material, newCapacity);
		newInstancedMesh.count = pack.instancedMesh.count;
		newInstancedMesh.frustumCulled = false;

		const matrix = new Matrix4();
		for (let i = 0; i < pack.capacity; i++) {
			pack.instancedMesh.getMatrixAt(i, matrix);
			newInstancedMesh.setMatrixAt(i, matrix);
		}

		const hiddenMatrix = new Matrix4().makeScale(0, 0, 0);
		for (let i = pack.capacity; i < newCapacity; i++) {
			newInstancedMesh.setMatrixAt(i, hiddenMatrix);
		}
		newInstancedMesh.instanceMatrix.needsUpdate = true;

		if (this.scene) {
			this.scene.remove(pack.instancedMesh);
			this.scene.add(newInstancedMesh);
		}
		pack.instancedMesh.dispose();
		pack.instancedMesh = newInstancedMesh;
		pack.capacity = newCapacity;
	}
}
