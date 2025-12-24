/**
 * Shared types for the editor store.
 * These mirror types from game-lib to avoid direct dependencies.
 */

export interface Vector3Like {
	x: number;
	y: number;
	z: number;
}

export interface BaseEntityInterface {
	uuid: string;
	name: string;
	type?: string;
	position?: Vector3Like;
	rotation?: Vector3Like;
	scale?: Vector3Like;
}

export interface StageStateInterface {
	backgroundColor: any; // Color type from three.js, kept as any for flexibility
	backgroundImage: string | null;
	inputs: Record<string, string[]>;
	variables: Record<string, any>;
	gravity: Vector3Like;
	entities: Partial<BaseEntityInterface>[];
}
