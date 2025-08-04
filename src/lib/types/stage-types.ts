import { Color, Vector3 } from 'three';
import { BaseEntityInterface } from './entity-types';

/**
 * Stage state interface - minimal to prevent circular dependencies
 */
export interface StageStateInterface {
	backgroundColor: Color;
	backgroundImage: string | null;
	inputs: {
		p1: string[];
		p2: string[];
	};
	variables: Record<string, any>;
	gravity: Vector3;
	entities: Partial<BaseEntityInterface>[];
	stageRef?: any; // Keep as any to avoid circular dependency
}

/**
 * Stage configuration interface
 */
export interface StageConfigInterface {
	id?: string;
	backgroundColor?: Color;
	backgroundImage?: string;
	gravity?: Vector3;
}

/**
 * Minimal stage interface to break circular dependencies
 */
export interface StageInterface {
	uuid: string;
	children: any[];
	state: StageStateInterface;
} 