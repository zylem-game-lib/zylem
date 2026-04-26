import type { IWorld } from 'bitecs';
import { Color, Quaternion, Vector3, type BufferGeometry, type Material } from 'three';

import { normalizeVec2, normalizeVec3, VEC2_ONE, VEC3_ONE, VEC3_ZERO } from '../core/vector';
import type { Inputs } from '../input/input';
import type { BehaviorRef } from '../behaviors/behavior-descriptor';
import {
	bindRuntimeDynamicCircleBody2DHandle,
	emitRuntimeRicochet,
	emitRuntimeTriggerRegionEnter,
	RUNTIME_BOUNDARY_2D_BEHAVIOR_KEY,
	RUNTIME_DYNAMIC_CIRCLE_BODY_2D_BEHAVIOR_KEY,
	RUNTIME_PLAYER_INPUT_2D_BEHAVIOR_KEY,
	RUNTIME_RICOCHET_2D_BEHAVIOR_KEY,
	RUNTIME_TRIGGER_REGION_2D_BEHAVIOR_KEY,
	type RuntimeBoundary2DOptions,
	type RuntimeDynamicCircleBody2DOptions,
	type RuntimePlayerInput2DOptions,
	type RuntimeRicochet2DOptions,
	type RuntimeTriggerRegion2DOptions,
} from '../behaviors/runtime-2d/runtime-2d.descriptors';
import type { GameEntity, RuntimeEntityColorMode, RuntimeEntityOptions } from '../entities/entity';
import { RuntimeInstanceManager } from '../graphics/runtime-instance-manager';
import { InstanceManager } from '../graphics/instance-manager';
import type { ZylemScene } from '../graphics/zylem-scene';
import type { ZylemCamera } from '../camera/zylem-camera';
import type { ZylemWorld } from '../collision/world';
import {
	createZylemRuntimeInstancedBatchSession,
	createZylemRuntimeGameplay2DSession,
	readZylemRuntimeEvents,
	readRenderSlot,
	setZylemRuntimeGameplay2DInputAxis,
	setZylemRuntimeGameplay2DSlotPosition,
	setZylemRuntimeGameplay2DSlotVelocity,
	ZylemRuntimeEventType,
	type ZylemRuntimeBufferViews,
	type ZylemRuntimeGameplay2DConfig,
	type ZylemRuntimeGameplay2DTriggerAabb,
	type ZylemRuntimeInstancedBatchConfig,
	type ZylemRuntimeStaticBoxCollider,
} from './zylem-wasm-runtime';

/**
 * Host-provided debug signals for wasm runtime adapters (no direct `debugState` import in adapters).
 */
export interface RuntimeDebugBinding {
	/** When true, show wasm-side diagnostics (e.g. instanced collision heat tint). */
	runtimeDiagnostics(): boolean;
}

export interface StageRuntimeContext {
	scene: ZylemScene;
	world: ZylemWorld;
	ecs: IWorld;
	camera: ZylemCamera;
	/** Optional; when set, adapters may enable extra runtime visualization. */
	debug?: RuntimeDebugBinding;
}

export interface StageRuntimeStepContext extends StageRuntimeContext {
	delta: number;
	inputs: Inputs;
}

export interface StageRuntimeAdapter {
	init(context: StageRuntimeContext): Promise<void> | void;
	step(context: StageRuntimeStepContext): void;
	destroy(context: StageRuntimeContext | null): void;
	ownsEntity(entity: GameEntity<any>): boolean;
	rendersEntity(entity: GameEntity<any>): boolean;
	registerEntity(entity: GameEntity<any>): void;
	unregisterEntity(entity: GameEntity<any>): void;
	/**
	 * Optional: when implemented, the stage debug delegate will draw the
	 * returned line segments alongside the TS Rapier debug overlay so wasm
	 * runtime adapters can visualize their own colliders. Returning `null`
	 * (or omitting the method entirely) disables the second pass.
	 */
	getDebugRender?(): { vertices: Float32Array; colors: Float32Array } | null;
}

interface RuntimeBatchState {
	key: string;
	entities: GameEntity<any>[];
	runtime: ZylemRuntimeBufferViews;
}

interface RuntimeGameplayState {
	runtime: ZylemRuntimeBufferViews;
	entities: GameEntity<any>[];
	slotToEntity: GameEntity<any>[];
	slotRefs: Array<{
		ball?: BehaviorRef<RuntimeDynamicCircleBody2DOptions>;
		ricochet?: BehaviorRef<RuntimeRicochet2DOptions>;
	}>;
}

export interface ZylemRuntimeStageAdapterSource {
	source: RequestInfo | URL | ArrayBuffer;
}

/**
 * Stage adapter for runtime-owned instanced box batches.
 * It groups runtime-enabled entities by batch key, spawns a wasm session per batch,
 * and syncs a companion RuntimeInstanceManager from the runtime render buffers.
 */
export class ZylemRuntimeStageAdapter implements StageRuntimeAdapter {
	private readonly runtimeEntities: GameEntity<any>[] = [];
	private readonly runtimeInstanceManager = new RuntimeInstanceManager();
	private readonly batches = new Map<string, RuntimeBatchState>();
	private gameplay: RuntimeGameplayState | null = null;
	private context: StageRuntimeContext | null = null;
	private rebuildPromise: Promise<void> | null = null;
	private dirty = true;
	private lastRuntimeDiagnostics = false;

	constructor(private readonly wasmSource: RequestInfo | URL | ArrayBuffer) {}

	ownsEntity(entity: GameEntity<any>): boolean {
		const runtime = entity.options?.runtime as RuntimeEntityOptions | undefined;
		return runtime?.simulation === 'runtime' || runtime?.body === 'static';
	}

	rendersEntity(entity: GameEntity<any>): boolean {
		const runtime = entity.options?.runtime as RuntimeEntityOptions | undefined;
		return runtime?.simulation === 'runtime' && runtime.render === 'instanced';
	}

	registerEntity(entity: GameEntity<any>): void {
		if (!this.ownsEntity(entity)) {
			return;
		}
		if (!this.runtimeEntities.includes(entity)) {
			this.runtimeEntities.push(entity);
		}
		entity.physicsAttached = false;
		if (this.rendersEntity(entity)) {
			entity.isInstanced = true;
		}
		if (this.rendersEntity(entity) && entity.mesh) {
			entity.mesh.visible = false;
		}
		this.dirty = true;
	}

	unregisterEntity(entity: GameEntity<any>): void {
		const index = this.runtimeEntities.indexOf(entity);
		if (index >= 0) {
			this.runtimeEntities.splice(index, 1);
		}
		entity.runtimeSlot = -1;
		this.dirty = true;
	}

	async init(context: StageRuntimeContext): Promise<void> {
		this.context = context;
		this.runtimeInstanceManager.setScene(context.scene.scene);
		await this.rebuildBatches();
	}

	step(context: StageRuntimeStepContext): void {
		this.context = context;
		const nextDiagnostics = this.peekRuntimeDiagnostics(context);
		if (this.lastRuntimeDiagnostics !== nextDiagnostics) {
			this.lastRuntimeDiagnostics = nextDiagnostics;
			this.dirty = true;
		}
		if (this.rebuildPromise) {
			return;
		}
		if (this.dirty) {
			this.rebuildPromise = this.rebuildBatches().finally(() => {
				this.rebuildPromise = null;
			});
			return;
		}

		for (const batch of this.batches.values()) {
			batch.runtime.exports.zylem_runtime_step(context.delta);
			batch.runtime.refreshViews();
			this.runtimeInstanceManager.updateBatch(batch.key, batch.runtime);
		}
		this.stepGameplay(context);
	}

	destroy(_context: StageRuntimeContext | null): void {
		this.runtimeInstanceManager.dispose();
		this.runtimeEntities.length = 0;
		this.batches.clear();
		this.gameplay = null;
		this.context = null;
		this.lastRuntimeDiagnostics = false;
		this.dirty = true;
	}

	private async rebuildBatches(): Promise<void> {
		this.runtimeInstanceManager.clear();
		this.batches.clear();
		this.gameplay = null;

		if (!this.context || this.runtimeEntities.length === 0) {
			this.lastRuntimeDiagnostics = this.peekRuntimeDiagnostics();
			this.dirty = false;
			return;
		}

		const grouped = new Map<string, GameEntity<any>[]>();
		const staticColliders: ZylemRuntimeStaticBoxCollider[] = [];
		const gameplayEntities: GameEntity<any>[] = [];
		for (const entity of this.runtimeEntities) {
			if (this.rendersEntity(entity)) {
				if (!entity.mesh?.geometry || !entity.materials?.length) {
					continue;
				}
				const key = InstanceManager.generateEntityBatchKey(entity);
				const group = grouped.get(key) ?? [];
				group.push(entity);
				grouped.set(key, group);
			} else {
				gameplayEntities.push(entity);
			}
			if (usesRuntimeStaticCollider(entity)) {
				staticColliders.push({
					center: normalizePosition(entity),
					halfExtents: normalizeHalfExtents(entity),
					friction: 0.95,
					restitution: 0.05,
				});
			}
		}

		for (const [key, entities] of grouped) {
			const first = entities[0]!;
			const geometry = first.mesh!.geometry as BufferGeometry;
			const material = first.materials![0] as Material;
			const runtimeOptions = first.options.runtime;
			const halfExtents = normalizeHalfExtents(first);
			const positions = entities.map((entity) => {
				return normalizePosition(entity);
			});
			const config: ZylemRuntimeInstancedBatchConfig = {
				positions,
				halfExtents,
				staticColliders,
			};

			const runtime = await createZylemRuntimeInstancedBatchSession(this.wasmSource, config);
			const diagnosticsOn = this.peekRuntimeDiagnostics();
			const colorMode = resolveRuntimeInstancedColorMode(runtimeOptions?.colorMode, diagnosticsOn);
			this.runtimeInstanceManager.registerBatch({
				key,
				geometry,
				material,
				count: entities.length,
				baseColor: first.options.material?.color ?? first.options.color ?? new Color(0xffffff),
				colorMode,
			});
			this.runtimeInstanceManager.updateBatch(key, runtime);

			entities.forEach((entity, index) => {
				entity.batchKey = key;
				entity.instanceId = index;
				entity.runtimeSlot = index;
				entity.isInstanced = true;
				if (entity.mesh) {
					entity.mesh.visible = false;
				}
			});

			this.batches.set(key, {
				key,
				entities,
				runtime,
			});
		}

		if (gameplayEntities.length > 0) {
			this.gameplay = await this.createGameplayState(gameplayEntities);
			this.syncGameplayEntities(this.gameplay);
		}

		this.dirty = false;
		this.lastRuntimeDiagnostics = this.peekRuntimeDiagnostics();
	}

	private peekRuntimeDiagnostics(context?: StageRuntimeContext | StageRuntimeStepContext): boolean {
		const ctx = context ?? this.context;
		return ctx?.debug?.runtimeDiagnostics() ?? false;
	}

	private async createGameplayState(entities: GameEntity<any>[]): Promise<RuntimeGameplayState> {
		const bounds = resolveRuntimeBounds(entities);
		const balls = [];
		const paddles = [];
		const triggerAabbs: ZylemRuntimeGameplay2DTriggerAabb[] = [];
		const slotRefs: RuntimeGameplayState['slotRefs'] = [];

		for (const [slot, entity] of entities.entries()) {
			const refs = getRuntimeRefs(entity);
			slotRefs[slot] = {
				ball: refs.ballRef,
				ricochet: refs.ricochetRef,
			};

			if (refs.ballRef) {
				balls.push({
					slot,
					position: normalizePosition(entity),
					radius: resolveRuntimeRadius(entity),
					initialVelocity: refs.ballRef.options.initialVelocity,
					minSpeed: refs.ricochetRef?.options.minSpeed ?? 2,
					maxSpeed: refs.ricochetRef?.options.maxSpeed ?? 20,
					speedMultiplier: refs.ricochetRef?.options.speedMultiplier ?? 1.05,
					maxAngleDeg: refs.ricochetRef?.options.maxAngleDeg ?? 60,
					reflectionMode: refs.ricochetRef?.options.reflectionMode ?? 'angled',
					usesBoundary2d: entityHasBehaviorKey(entity, RUNTIME_BOUNDARY_2D_BEHAVIOR_KEY),
					usesRicochet2d: !!refs.ricochetRef,
				});
			}

			if (refs.paddleRef) {
				paddles.push({
					slot,
					position: normalizePosition(entity),
					playerIndex: refs.paddleRef.options.player === 'p1' ? 0 : 1,
					speed: refs.paddleRef.options.speed,
					halfExtents: resolveHalfExtents2D(entity),
				});
			}

			const triggerRef = entity
				.getBehaviorRefs()
				.find((ref) => ref.descriptor.key === RUNTIME_TRIGGER_REGION_2D_BEHAVIOR_KEY) as
				| BehaviorRef<RuntimeTriggerRegion2DOptions>
				| undefined;
			if (triggerRef) {
				triggerAabbs.push({
					triggerId: triggerRef.options.triggerId,
					position: normalizePosition(entity),
					halfExtents: triggerRef.options.halfExtents,
				});
			}

		}

		const runtime = await createZylemRuntimeGameplay2DSession(
			this.wasmSource,
			entities.length,
			{
				bounds,
				dynamicCircles: balls,
				kinematicAabbs: paddles,
				...(triggerAabbs.length > 0 ? { triggerAabbs } : {}),
			} satisfies ZylemRuntimeGameplay2DConfig,
		);

		for (const [slot, entity] of entities.entries()) {
			entity.runtimeSlot = slot;
			const ballRef = slotRefs[slot]?.ball;
			if (ballRef) {
				bindRuntimeDynamicCircleBody2DHandle(ballRef, {
					setPosition: (x: number, y: number, z: number) => setZylemRuntimeGameplay2DSlotPosition(runtime, slot, x, y, z),
					setVelocity: (x: number, y: number) => setZylemRuntimeGameplay2DSlotVelocity(runtime, slot, x, y),
					getPosition: () => {
						const target = entity.group ?? entity.mesh;
						if (!target) {
							return null;
						}
						return { x: target.position.x, y: target.position.y, z: target.position.z };
					},
				});
			}
		}

		return {
			runtime,
			entities,
			slotToEntity: [...entities],
			slotRefs,
		};
	}

	private syncGameplayEntities(gameplay: RuntimeGameplayState): void {
		for (const [slot, entity] of gameplay.slotToEntity.entries()) {
			const renderSlot = readRenderSlot(gameplay.runtime.renderView, gameplay.runtime.renderStride, slot);
			const target = entity.group ?? entity.mesh;
			if (target) {
				target.position.set(
					renderSlot.position[0],
					renderSlot.position[1],
					renderSlot.position[2],
				);
				target.quaternion.set(
					renderSlot.rotation[0],
					renderSlot.rotation[1],
					renderSlot.rotation[2],
					renderSlot.rotation[3],
				);
			}
		}
	}

	private stepGameplay(context: StageRuntimeStepContext): void {
		if (!this.gameplay) {
			return;
		}

		setZylemRuntimeGameplay2DInputAxis(this.gameplay.runtime, 0, resolvePlayerVertical(context.inputs, 'p1'));
		setZylemRuntimeGameplay2DInputAxis(this.gameplay.runtime, 1, resolvePlayerVertical(context.inputs, 'p2'));
		this.gameplay.runtime.exports.zylem_runtime_step(context.delta);
		this.gameplay.runtime.refreshViews();
		this.syncGameplayEntities(this.gameplay);

		for (const event of readZylemRuntimeEvents(this.gameplay.runtime)) {
			switch (event.type) {
				case ZylemRuntimeEventType.BoundaryBounce: {
					const refs = this.gameplay.slotRefs[event.primarySlot];
					if (refs?.ricochet) {
						emitRuntimeRicochet(refs.ricochet, { kind: 'wall' });
					}
					break;
				}
				case ZylemRuntimeEventType.ColliderBounce: {
					const refs = this.gameplay.slotRefs[event.primarySlot];
					if (refs?.ricochet) {
						emitRuntimeRicochet(refs.ricochet, { kind: 'paddle' });
					}
					break;
				}
				case ZylemRuntimeEventType.RegionEntered: {
					const triggerId = event.secondarySlot;
					for (const entity of this.gameplay.entities) {
						const ref = entity
							.getBehaviorRefs()
							.find((r) => r.descriptor.key === RUNTIME_TRIGGER_REGION_2D_BEHAVIOR_KEY) as
							| BehaviorRef<RuntimeTriggerRegion2DOptions>
							| undefined;
						if (ref && ref.options.triggerId === triggerId) {
							emitRuntimeTriggerRegionEnter(ref, { triggerId });
						}
					}
					break;
				}
			}
		}
	}
}

export function createZylemRuntimeStageAdapter(
	options: ZylemRuntimeStageAdapterSource,
): StageRuntimeAdapter {
	return new ZylemRuntimeStageAdapter(options.source);
}

function resolveRuntimeInstancedColorMode(
	explicit: RuntimeEntityColorMode | undefined,
	diagnosticsOn: boolean,
): RuntimeEntityColorMode {
	if (explicit === 'heatTint') {
		return 'heatTint';
	}
	return diagnosticsOn ? 'heatTint' : (explicit ?? 'base');
}

function normalizeHalfExtents(entity: GameEntity<any>): [number, number, number] {
	const tile = (entity.options as { tile?: unknown })?.tile;
	if (tile) {
		const tileVec = normalizeVec2(tile, VEC2_ONE);
		const thickness = Math.max((entity.options?.size as any)?.z ?? 1, 0.01);
		return [
			Math.max(tileVec.x / 2, 0.01),
			Math.max(thickness / 2, 0.01),
			Math.max(tileVec.y / 2, 0.01),
		];
	}
	const size = normalizeVec3(entity.options?.size, VEC3_ONE);
	return [
		Math.max(size.x / 2, 0.01),
		Math.max(size.y / 2, 0.01),
		Math.max(size.z / 2, 0.01),
	];
}

function normalizePosition(entity: GameEntity<any>): [number, number, number] {
	const position = normalizeVec3(entity.options?.position, VEC3_ZERO);
	const tile = (entity.options as { tile?: unknown })?.tile;
	if (tile) {
		const halfExtents = normalizeHalfExtents(entity);
		return [position.x, position.y - halfExtents[1], position.z];
	}
	return [position.x, position.y, position.z];
}

function usesRuntimeStaticCollider(entity: GameEntity<any>): boolean {
	return entity.options?.runtime?.body === 'static';
}

function resolveHalfExtents2D(entity: GameEntity<any>): [number, number] {
	const size = normalizeVec3(entity.options?.size, VEC3_ONE);
	return [Math.max(size.x / 2, 0.01), Math.max(size.y / 2, 0.01)];
}

function resolveRuntimeRadius(entity: GameEntity<any>): number {
	return Math.max((entity.options as { radius?: number }).radius ?? 0.5, 0.01);
}

function resolvePlayerVertical(inputs: Inputs, player: 'p1' | 'p2'): number {
	const directions = inputs[player]?.directions;
	const axis = inputs[player]?.axes?.Vertical;
	return ((directions?.Up?.held ? 1 : 0) - (directions?.Down?.held ? 1 : 0)) || -(axis?.value ?? 0);
}

function resolveRuntimeBounds(entities: GameEntity<any>[]): RuntimeBoundary2DOptions['boundaries'] {
	for (const entity of entities) {
		const ref = entity
			.getBehaviorRefs()
			.find((behaviorRef) => behaviorRef.descriptor.key === RUNTIME_BOUNDARY_2D_BEHAVIOR_KEY) as
			| BehaviorRef<RuntimeBoundary2DOptions>
			| undefined;
		if (ref) {
			return ref.options.boundaries;
		}
	}
	return { left: -15, right: 15, bottom: -5, top: 5 };
}

function getRuntimeRefs(entity: GameEntity<any>) {
	const refs = entity.getBehaviorRefs();
	return {
		ballRef: refs.find((ref) => ref.descriptor.key === RUNTIME_DYNAMIC_CIRCLE_BODY_2D_BEHAVIOR_KEY) as BehaviorRef<RuntimeDynamicCircleBody2DOptions> | undefined,
		paddleRef: refs.find((ref) => ref.descriptor.key === RUNTIME_PLAYER_INPUT_2D_BEHAVIOR_KEY) as BehaviorRef<RuntimePlayerInput2DOptions> | undefined,
		ricochetRef: refs.find((ref) => ref.descriptor.key === RUNTIME_RICOCHET_2D_BEHAVIOR_KEY) as BehaviorRef<RuntimeRicochet2DOptions> | undefined,
	};
}

function entityHasBehaviorKey(entity: GameEntity<any>, key: symbol): boolean {
	return entity.getBehaviorRefs().some((ref) => ref.descriptor.key === key);
}
