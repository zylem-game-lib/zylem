import { BufferGeometry, InstancedMesh, Material, Matrix4, Object3D, Vector3, Quaternion } from 'three';
import type { GameEntity, GameEntityOptions } from '../entities/entity';
import { shortHash, sortedStringify } from '../core/utility/strings';

/**
 * Represents a batch of entities sharing the same geometry and material
 */
export interface BatchGroup {
	/** Unique key identifying this batch */
	key: string;
	/** The instanced mesh for rendering */
	instancedMesh: InstancedMesh;
	/** Original geometry */
	geometry: BufferGeometry;
	/** Original material */
	material: Material;
	/** Map of entity UUID to instance index */
	entityMap: Map<string, number>;
	/** List of entities in this batch (by their index) */
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

/**
 * Configuration for batch key generation
 */
export interface BatchKeyConfig {
	geometryType: string;
	dimensions: Record<string, number>;
	materialPath?: string | null;
	shaderType?: 'standard' | 'custom';
	colorHex?: number;
}

/**
 * Manages instanced mesh batching for entities
 */
export class InstanceManager {
	private batches: Map<string, BatchGroup> = new Map();
	private entityToBatch: Map<string, string> = new Map(); // entity UUID -> batch key
	private scene: Object3D | null = null;

	/** Default initial capacity for new batches */
	static DEFAULT_CAPACITY = 128;
	/** Factor to grow batch when full */
	static GROWTH_FACTOR = 2;

	/**
	 * Set the scene to add instanced meshes to
	 */
	setScene(scene: Object3D): void {
		this.scene = scene;
	}

	/**
	 * Generate a batch key from configuration
	 */
	static generateBatchKey(config: BatchKeyConfig): string {
		const keyData = {
			geo: `${config.geometryType}:${sortedStringify(config.dimensions)}`,
			mat: config.materialPath || 'none',
			shader: config.shaderType || 'standard',
			color: config.colorHex ?? 0xffffff,
		};
		return shortHash(sortedStringify(keyData));
	}

	/**
	 * Register an entity with the instance manager
	 * @returns The instance index, or -1 if registration failed
	 */
	register(
		entity: GameEntity<any>,
		geometry: BufferGeometry,
		material: Material,
		batchKey: string
	): number {
		let batch = this.batches.get(batchKey);

		if (!batch) {
			batch = this.createBatch(batchKey, geometry, material);
		}

		// Get an index for this entity
		let index: number;
		if (batch.freeIndices.length > 0) {
			index = batch.freeIndices.pop()!;
		} else {
			index = batch.entities.length;
			if (index >= batch.capacity) {
				this.growBatch(batch);
			}
			batch.entities.push(null);
		}

		// Store entity reference
		batch.entities[index] = entity;
		batch.entityMap.set(entity.uuid, index);
		this.entityToBatch.set(entity.uuid, batchKey);

		// Update visible instance count
		batch.instancedMesh.count = Math.max(batch.instancedMesh.count, index + 1);

		// Add to active list
		batch.activeIndices.push(index);

		// Mark dirty for initial transform sync
		batch.dirtyIndices.add(index);

		return index;
	}

	/**
	 * Unregister an entity from the instance manager
	 */
	unregister(entity: GameEntity<any>): void {
		const batchKey = this.entityToBatch.get(entity.uuid);
		if (!batchKey) return;

		const batch = this.batches.get(batchKey);
		if (!batch) return;

		const index = batch.entityMap.get(entity.uuid);
		if (index === undefined) return;

		// Clear the entity slot
		batch.entities[index] = null;
		batch.entityMap.delete(entity.uuid);
		this.entityToBatch.delete(entity.uuid);
		batch.freeIndices.push(index);
		// Remove from active list (swap and pop for O(1))
		const idxInActive = batch.activeIndices.indexOf(index);
		if (idxInActive !== -1) {
			const last = batch.activeIndices.pop()!;
			if (idxInActive < batch.activeIndices.length) {
				batch.activeIndices[idxInActive] = last;
			}
		}
		batch.dirtyIndices.delete(index);

		// Hide the instance by scaling to zero
		const matrix = new Matrix4();
		matrix.makeScale(0, 0, 0);
		batch.instancedMesh.setMatrixAt(index, matrix);
		batch.instancedMesh.instanceMatrix.needsUpdate = true;
	}

	/**
	 * Mark an entity's transform as dirty (needs syncing)
	 */
	markDirty(entity: GameEntity<any>): void {
		const batchKey = this.entityToBatch.get(entity.uuid);
		if (!batchKey) return;

		const batch = this.batches.get(batchKey);
		if (!batch) return;

		const index = batch.entityMap.get(entity.uuid);
		if (index !== undefined) {
			batch.dirtyIndices.add(index);
		}
	}

	/**
	 * Update all dirty instance transforms
	 * Call this once per frame
	 */
	/**
	 * Update all active instance transforms
	 * Call this once per frame
	 */
	update(): void {
		const matrix = new Matrix4();
		const pos = new Vector3();
		const quat = new Quaternion();
		const scale = new Vector3(1, 1, 1);

		for (const batch of this.batches.values()) {
			if (batch.activeIndices.length === 0) continue;

			let needsUpdate = false;
			// Check if we have explicit dirty updates
			if (batch.dirtyIndices.size > 0) {
				for (const index of batch.dirtyIndices) {
					this.updateInstanceMatrix(batch, index, matrix, pos, quat, scale);
				}
				batch.dirtyIndices.clear();
				needsUpdate = true;
			}

			// Also update all active dynamic entities (assumed dynamic if they have a body)
			for (const index of batch.activeIndices) {
				const entity = batch.entities[index];
				// Optimization: Only update if it has a physics body (dynamic)
				if (entity && entity.body) {
					this.updateInstanceMatrix(batch, index, matrix, pos, quat, scale);
					needsUpdate = true;
				}
			}

			if (needsUpdate) {
				batch.instancedMesh.instanceMatrix.needsUpdate = true;
			}
		}
	}

	private updateInstanceMatrix(batch: BatchGroup, index: number, matrix: Matrix4, pos: Vector3, quat: Quaternion, scale: Vector3) {
		const entity = batch.entities[index];
		if (!entity) return;

		if (entity.body) {
			const translation = entity.body.translation();
			const rotation = entity.body.rotation();
			pos.set(translation.x, translation.y, translation.z);
			quat.set(rotation.x, rotation.y, rotation.z, rotation.w);
			matrix.compose(pos, quat, scale);
		} else if (entity.mesh) {
			entity.mesh.updateMatrix();
			matrix.copy(entity.mesh.matrix);
		} else if (entity.group) {
			entity.group.updateMatrix();
			matrix.copy(entity.group.matrix);
		}

		batch.instancedMesh.setMatrixAt(index, matrix);
	}

	/**
	 * Get batch info for an entity
	 */
	getBatchInfo(entity: GameEntity<any>): { batchKey: string; instanceId: number } | null {
		const batchKey = this.entityToBatch.get(entity.uuid);
		if (!batchKey) return null;

		const batch = this.batches.get(batchKey);
		if (!batch) return null;

		const instanceId = batch.entityMap.get(entity.uuid);
		if (instanceId === undefined) return null;

		return { batchKey, instanceId };
	}

	/**
	 * Get statistics about current batching
	 */
	getStats(): { batchCount: number; totalInstances: number; batches: { key: string; count: number; capacity: number }[] } {
		let totalInstances = 0;
		const batches: { key: string; count: number; capacity: number }[] = [];

		for (const [key, batch] of this.batches) {
			const count = batch.entityMap.size;
			totalInstances += count;
			batches.push({ key, count, capacity: batch.capacity });
		}

		return { batchCount: this.batches.size, totalInstances, batches };
	}

	/**
	 * Dispose all batches and release resources
	 */
	dispose(): void {
		for (const batch of this.batches.values()) {
			if (this.scene) {
				this.scene.remove(batch.instancedMesh);
			}
			batch.instancedMesh.dispose();
			batch.geometry.dispose();
		}
		this.batches.clear();
		this.entityToBatch.clear();
	}

	/**
	 * Create a new batch group
	 */
	private createBatch(key: string, geometry: BufferGeometry, material: Material): BatchGroup {
		const capacity = InstanceManager.DEFAULT_CAPACITY;
		const instancedMesh = new InstancedMesh(geometry, material, capacity);
		instancedMesh.count = 0; // Start with zero visible instances
		instancedMesh.frustumCulled = false; // Let individual instances handle culling

		// Initialize all matrices to hidden (zero scale)
		const hiddenMatrix = new Matrix4().makeScale(0, 0, 0);
		for (let i = 0; i < capacity; i++) {
			instancedMesh.setMatrixAt(i, hiddenMatrix);
		}
		instancedMesh.instanceMatrix.needsUpdate = true;

		const batch: BatchGroup = {
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

		this.batches.set(key, batch);

		if (this.scene) {
			this.scene.add(instancedMesh);
		}

		return batch;
	}

	/**
	 * Grow a batch's capacity
	 */
	private growBatch(batch: BatchGroup): void {
		const newCapacity = batch.capacity * InstanceManager.GROWTH_FACTOR;

		// Create new instanced mesh with larger capacity
		const newInstancedMesh = new InstancedMesh(batch.geometry, batch.material, newCapacity);
		newInstancedMesh.count = batch.instancedMesh.count;
		newInstancedMesh.frustumCulled = false;

		// Copy existing matrices
		const matrix = new Matrix4();
		for (let i = 0; i < batch.capacity; i++) {
			batch.instancedMesh.getMatrixAt(i, matrix);
			newInstancedMesh.setMatrixAt(i, matrix);
		}

		// Initialize new slots as hidden
		const hiddenMatrix = new Matrix4().makeScale(0, 0, 0);
		for (let i = batch.capacity; i < newCapacity; i++) {
			newInstancedMesh.setMatrixAt(i, hiddenMatrix);
		}
		newInstancedMesh.instanceMatrix.needsUpdate = true;

		// Swap meshes
		if (this.scene) {
			this.scene.remove(batch.instancedMesh);
			this.scene.add(newInstancedMesh);
		}
		batch.instancedMesh.dispose();
		batch.instancedMesh = newInstancedMesh;
		batch.capacity = newCapacity;
	}
}
