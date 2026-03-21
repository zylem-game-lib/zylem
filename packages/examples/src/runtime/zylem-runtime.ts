import runtimeWasmUrl from '../../../zylem-runtime/target/wasm32-unknown-unknown/release/zylem_runtime.wasm?url';

export interface RuntimeVector3 {
	x: number;
	y: number;
	z: number;
}

export interface RuntimeSnapshot {
	liveEntities: number;
	allocatedEntities: number;
	tickCount: number;
}

type RuntimeExports = {
	memory: WebAssembly.Memory;
	zylem_runtime_world_new(): number;
	zylem_runtime_world_free(world: number): void;
	zylem_runtime_world_spawn(world: number): number;
	zylem_runtime_world_despawn(world: number, entity: number): number;
	zylem_runtime_world_step(world: number, deltaSeconds: number): void;
	zylem_runtime_world_set_position(
		world: number,
		entity: number,
		x: number,
		y: number,
		z: number,
	): number;
	zylem_runtime_world_set_velocity(
		world: number,
		entity: number,
		x: number,
		y: number,
		z: number,
	): number;
	zylem_runtime_world_position_x(world: number, entity: number): number;
	zylem_runtime_world_position_y(world: number, entity: number): number;
	zylem_runtime_world_position_z(world: number, entity: number): number;
	zylem_runtime_world_velocity_x(world: number, entity: number): number;
	zylem_runtime_world_velocity_y(world: number, entity: number): number;
	zylem_runtime_world_velocity_z(world: number, entity: number): number;
	zylem_runtime_world_live_entities(world: number): number;
	zylem_runtime_world_allocated_entities(world: number): number;
	zylem_runtime_world_tick_count(world: number): number;
};

export interface ZylemRuntimeWorld {
	readonly memory: WebAssembly.Memory;
	readonly world: number;
	spawn(): number;
	despawn(entity: number): boolean;
	step(deltaSeconds: number): void;
	setPosition(entity: number, value: RuntimeVector3): boolean;
	setVelocity(entity: number, value: RuntimeVector3): boolean;
	getPosition(entity: number): RuntimeVector3;
	getVelocity(entity: number): RuntimeVector3;
	stats(): RuntimeSnapshot;
	destroy(): void;
}

let runtimeExportsPromise: Promise<RuntimeExports> | null = null;

async function loadRuntimeExports(): Promise<RuntimeExports> {
	if (!runtimeExportsPromise) {
		runtimeExportsPromise = instantiateRuntime();
	}

	return runtimeExportsPromise;
}

async function instantiateRuntime(): Promise<RuntimeExports> {
	const response = await fetch(runtimeWasmUrl);
	const imports = {};

	try {
		const { instance } = await WebAssembly.instantiateStreaming(response, imports);
		return instance.exports as unknown as RuntimeExports;
	} catch {
		const bytes = await response.arrayBuffer();
		const { instance } = await WebAssembly.instantiate(bytes, imports);
		return instance.exports as unknown as RuntimeExports;
	}
}

function readVector3(
	readX: () => number,
	readY: () => number,
	readZ: () => number,
): RuntimeVector3 {
	return {
		x: readX(),
		y: readY(),
		z: readZ(),
	};
}

export async function createZylemRuntimeWorld(): Promise<ZylemRuntimeWorld> {
	const exports = await loadRuntimeExports();
	const world = exports.zylem_runtime_world_new();

	return {
		memory: exports.memory,
		world,
		spawn: () => exports.zylem_runtime_world_spawn(world),
		despawn: (entity) => exports.zylem_runtime_world_despawn(world, entity) === 1,
		step: (deltaSeconds) => exports.zylem_runtime_world_step(world, deltaSeconds),
		setPosition: (entity, value) =>
			exports.zylem_runtime_world_set_position(world, entity, value.x, value.y, value.z) === 1,
		setVelocity: (entity, value) =>
			exports.zylem_runtime_world_set_velocity(world, entity, value.x, value.y, value.z) === 1,
		getPosition: (entity) =>
			readVector3(
				() => exports.zylem_runtime_world_position_x(world, entity),
				() => exports.zylem_runtime_world_position_y(world, entity),
				() => exports.zylem_runtime_world_position_z(world, entity),
			),
		getVelocity: (entity) =>
			readVector3(
				() => exports.zylem_runtime_world_velocity_x(world, entity),
				() => exports.zylem_runtime_world_velocity_y(world, entity),
				() => exports.zylem_runtime_world_velocity_z(world, entity),
			),
		stats: () => ({
			liveEntities: exports.zylem_runtime_world_live_entities(world),
			allocatedEntities: exports.zylem_runtime_world_allocated_entities(world),
			tickCount: exports.zylem_runtime_world_tick_count(world),
		}),
		destroy: () => exports.zylem_runtime_world_free(world),
	};
}
