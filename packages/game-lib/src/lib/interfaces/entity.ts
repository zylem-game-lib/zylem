import { Group, Mesh } from "three";
import type { SimulationBody } from "../collision/simulation-body";

export type LifecycleFunction<T> = (params?: any) => void;

type CollisionOption = (entity: any, other: any, globals?: Global) => void;

export interface Entity<T = any> {
	setup: (entity: T) => void;
	destroy: () => void;
	update: LifecycleFunction<T>;
	type: string;
	_collision?: (entity: any, other: any, globals?: any) => void;
	_destroy?: (globals?: any) => void;
	name?: string;
	tag?: Set<string>;
}

export interface StageEntity extends Entity {
	uuid: string;
	body: SimulationBody;
	group: Group;
	mesh: Mesh;
	instanceId: number;
	isInstanced?: boolean;
	isBundled?: boolean;
	controlledRotation: boolean;
	name: string;
	markedForRemoval: boolean;
}

type OptionalVector = { x?: number, y?: number, z?: number };
