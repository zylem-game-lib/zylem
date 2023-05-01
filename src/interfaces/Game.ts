import { Entity } from './Entity';
import { PerspectiveType } from './Perspective';

export interface GameOptions {
	id: string;
	perspective: PerspectiveType;
	stage: any;
	// TODO: use stage interface
	stages: Record<string, Entity>;
}
