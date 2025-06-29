/**
 * Lazy loading utilities for Zylem components
 * Use these functions to load parts of the library only when needed
 * 
 * Loading order follows dependency hierarchy:
 * 1. Foundation (core utilities, types)
 * 2. State, Input, Graphics, Physics (parallel)
 * 3. Camera (depends on graphics)
 * 4. Entities (depends on foundation, graphics, physics)
 * 5. Behaviors (depends on entities)
 * 6. Core game systems (depends on most others)
 * 7. Stage (depends on everything)
 */

// Foundation - always needed first
export const loadFoundation = async () => {
	const [baseNode, lifeCycle, utility, vector] = await Promise.all([
		import('./base-node'),
		import('./base-node-life-cycle'),
		import('./utility'),
		import('./vector')
	]);
	return { baseNode, lifeCycle, utility, vector };
};

// Level 2: Independent systems (can load in parallel)
export const loadState = async () => {
	const state = await import('../state/index');
	return state;
};

export const loadInput = async () => {
	const input = await import('../input/input-manager');
	return input;
};

export const loadGraphics = async () => {
	const [material, mesh] = await Promise.all([
		import('../graphics/material'),
		import('../graphics/mesh')
	]);
	return { material, mesh };
};

export const loadPhysics = async () => {
	const [physics, collision, collisionBuilder] = await Promise.all([
		import('../collision/physics'),
		import('../collision/collision'),
		import('../collision/collision-builder')
	]);
	return { physics, collision, collisionBuilder };
};

// Level 3: Camera (depends on graphics)
export const loadCamera = async () => {
	const [camera, perspectives] = await Promise.all([
		import('../camera/camera'),
		import('../camera/perspective')
	]);
	return { camera, perspectives };
};

// Level 4: Entities (depends on foundation, graphics, physics)
export const loadAllEntities = async () => {
	const entities = await import('../entities/entity');
	return entities;
};

export const loadEntity = async (entityType: 'box' | 'sphere' | 'sprite' | 'plane' | 'zone' | 'actor') => {
	switch (entityType) {
		case 'box':
			return await import('../entities/box');
		case 'sphere':
			return await import('../entities/sphere');
		case 'sprite':
			return await import('../entities/sprite');
		case 'plane':
			return await import('../entities/plane');
		case 'zone':
			return await import('../entities/zone');
		case 'actor':
			return await import('../entities/actor');
		default:
			throw new Error(`Unknown entity type: ${entityType}`);
	}
};

// Level 5: Behaviors (depends on entities)
export const loadBehaviors = async () => {
	const behaviors = await import('../behaviors/actions');
	return behaviors;
};

// Level 6: Core game systems (depends on most others)
export const loadGameCore = async () => {
	const [game, vessel] = await Promise.all([
		import('./game/game'),
		import('./vessel')
	]);
	return { game, vessel };
};

// Level 7: Stage system (depends on everything)
export const loadStage = async () => {
	const [stage, world, scene] = await Promise.all([
		import('./stage/stage'),
		import('../collision/world'),
		import('../graphics/zylem-scene')
	]);
	return { stage, world, scene };
};

// Optional systems (can be loaded on demand)
export const loadUI = async () => {
	const hud = await import('../ui/hud');
	return hud;
};

export const loadDebugTools = async () => {
	const debug = await import('../debug/Debug');
	return debug;
};

export const loadFullGame = async () => {
	const foundation = await loadFoundation();

	const [state, input, graphics, physics] = await Promise.all([
		loadState(),
		loadInput(),
		loadGraphics(),
		loadPhysics()
	]);

	const camera = await loadCamera();
	const entities = await loadAllEntities();
	const behaviors = await loadBehaviors();
	const gameCore = await loadGameCore();
	const stage = await loadStage();

	return {
		foundation, state, input, graphics, physics,
		camera, entities, behaviors, gameCore, stage
	};
};
