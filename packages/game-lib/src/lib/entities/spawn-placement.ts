import type { Group, Mesh } from 'three';
import type { BehaviorRuntime } from '@zylem/behaviors/core';
import type { SimulationBody } from '../collision/simulation-body';
import type { GameEntityOptions } from './entity';
import { BaseNode } from '../core/base-node';
import { VEC3_ZERO, normalizeVec3 } from '../core/vector';

/** Internal marker on merged options when the author passed `position`. */
export const EXPLICIT_SPAWN_POSITION = Symbol('explicitSpawnPosition');

/**
 * Minimal structural type for spawn-placement helpers.
 * Intentionally avoids extending {@link GameEntity} so subclasses like
 * `ZylemActor` (with contravariant collision callbacks) can be passed as `this`.
 */
export interface SpawnPlacementEntity {
	options: Pick<GameEntityOptions, 'position' | 'hideUntilPositioned' | 'visible'>;
	group?: Group;
	mesh?: Mesh;
	physicsAttached?: boolean;
	body?: SimulationBody | null;
	wasmStageRef?: BehaviorRuntime | null;
	runtimeHandle?: number;
	_spawnPlacementPending?: boolean;
	_spawnPositionExplicit?: boolean;
	_spawnPlacementReady?: boolean;
	_spawnInProgress?: boolean;
}

export function hasExplicitPositionInArgs(
	args: Array<BaseNode | Partial<GameEntityOptions>>,
): boolean {
	return args
		.filter((arg): arg is Partial<GameEntityOptions> => !(arg instanceof BaseNode))
		.some((arg) => arg != null && typeof arg === 'object' && 'position' in arg);
}

export function markExplicitSpawnPosition(options: GameEntityOptions): void {
	(options as GameEntityOptions & { [EXPLICIT_SPAWN_POSITION]?: boolean })[
		EXPLICIT_SPAWN_POSITION
	] = true;
}

function readExplicitSpawnPosition(entity: SpawnPlacementEntity): boolean {
	if (entity._spawnPositionExplicit) {
		return true;
	}
	return (
		(entity.options as GameEntityOptions & { [EXPLICIT_SPAWN_POSITION]?: boolean })[
			EXPLICIT_SPAWN_POSITION
		] === true
	);
}

export function shouldHideUntilPositioned(entity: SpawnPlacementEntity): boolean {
	return entity.options.hideUntilPositioned !== false;
}

export function isSpawnPlacementPending(entity: SpawnPlacementEntity): boolean {
	return entity._spawnPlacementPending === true;
}

export function isSpawnPlacementReady(entity: SpawnPlacementEntity): boolean {
	return (
		entity._spawnPositionExplicit === true ||
		entity._spawnPlacementReady === true
	);
}

/** Copy physics / options pose onto the Three.js group or mesh immediately. */
export function syncRenderPositionFromBody(entity: SpawnPlacementEntity): void {
	const target = entity.group ?? entity.mesh;
	if (!target) {
		return;
	}

	if (entity.physicsAttached && entity.body) {
		try {
			const translation = entity.body.translation();
			target.position.set(translation.x, translation.y, translation.z);
			return;
		} catch {
			// Fall through to options / wasm pose.
		}
	}

	if (entity.wasmStageRef && (entity.runtimeHandle ?? -1) >= 0) {
		const pose = entity.wasmStageRef.getPose(entity.runtimeHandle!);
		if (pose) {
			target.position.set(pose.position[0], pose.position[1], pose.position[2]);
			return;
		}
	}

	if (entity.options.position) {
		const position = normalizeVec3(entity.options.position, VEC3_ZERO);
		target.position.set(position.x, position.y, position.z);
	}
}

export function applyRenderVisibility(entity: SpawnPlacementEntity, visible: boolean): void {
	if (entity.group) {
		entity.group.visible = visible;
	}
	if (entity.mesh) {
		entity.mesh.visible = visible;
	}
}

export function beginSpawnPlacement(entity: SpawnPlacementEntity): void {
	entity._spawnInProgress = true;
	entity._spawnPlacementReady = false;

	if (!shouldHideUntilPositioned(entity)) {
		entity._spawnPlacementPending = false;
		return;
	}

	entity._spawnPositionExplicit = readExplicitSpawnPosition(entity);
	entity._spawnPlacementPending = true;
	applyRenderVisibility(entity, false);
}

export function endSpawnPlacement(entity: SpawnPlacementEntity): void {
	entity._spawnInProgress = false;
}

export function markSpawnPlacementReady(entity: SpawnPlacementEntity): void {
	entity._spawnPlacementReady = true;
}

export function confirmSpawnPlacement(entity: SpawnPlacementEntity): void {
	if (!entity._spawnPlacementPending) {
		return;
	}

	syncRenderPositionFromBody(entity);
	entity._spawnPlacementPending = false;

	if (entity.options.visible === false) {
		applyRenderVisibility(entity, false);
		return;
	}

	applyRenderVisibility(entity, true);
}

/**
 * Apply scene placement, sync the render transform, then reveal.
 *
 * By default every entity is revealed here — if no position was ever
 * assigned, spawning at the default pose is intentional (lines, text, UI,
 * ground planes). Only an explicit `hideUntilPositioned: true` keeps an
 * unpositioned entity hidden until its first `setPosition`/`setPose`
 * (spawner patterns that place entities frames after spawn).
 */
export function finalizeSpawnPlacement(entity: SpawnPlacementEntity): void {
	if (!isSpawnPlacementPending(entity)) {
		return;
	}

	const strict = entity.options.hideUntilPositioned === true;
	if (strict && !isSpawnPlacementReady(entity)) {
		return;
	}

	confirmSpawnPlacement(entity);
}

/** Force the render target visible, clearing placement-pending state. */
export function revealSpawnPlacement(entity: SpawnPlacementEntity): void {
	syncRenderPositionFromBody(entity);
	entity._spawnPlacementPending = false;
	applyRenderVisibility(entity, true);
}

export function syncPendingPlacementVisibility(entity: SpawnPlacementEntity): void {
	if (!isSpawnPlacementPending(entity)) {
		return;
	}
	applyRenderVisibility(entity, false);
}

/** @deprecated Use {@link beginSpawnPlacement}. */
export function beginAwaitingPlacement(entity: SpawnPlacementEntity): void {
	beginSpawnPlacement(entity);
}
