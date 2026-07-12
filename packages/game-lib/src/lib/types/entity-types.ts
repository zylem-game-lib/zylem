import { Group } from 'three';
import type { SimulationBody } from '../collision/simulation-body';

/**
 * Base entity interface - shared across modules to prevent circular dependencies
 */
export interface BaseEntityInterface {
	uuid: string;
	name: string;
	group: Group | null | undefined;
	body: SimulationBody | null | undefined;
}

/**
 * Game entity interface - minimal interface to break circular dependencies
 */
export interface GameEntityInterface extends BaseEntityInterface {
	type: string;
	isStatic: boolean;
	setPosition(x: number, y: number, z: number): void;
	setRotation(x: number, y: number, z: number): void;
	setScale(x: number, y: number, z: number): void;
}

/**
 * Stage entity interface - for entities that can be part of a stage
 */
interface StageEntityInterface extends GameEntityInterface {
	stageId?: string;
	isActive: boolean;
}

/**
 * Entity with collision capabilities
 */
interface CollisionEntityInterface extends GameEntityInterface {
	onCollision?: (other: GameEntityInterface) => void;
	onEnter?: (other: GameEntityInterface) => void;
	onExit?: (other: GameEntityInterface) => void;
}
