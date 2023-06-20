import { ZylemDebug } from '@/game/ZylemDebug';
import { ZylemStage } from '@/stage/ZylemStage';
import { Entity } from './Entity';
import { PerspectiveType } from './Perspective';

export interface GameOptions {
	id: string;
	perspective: PerspectiveType;
	globals?: Record<string, any>;
	stage?: ZylemStage;
	// TODO: use stage interface
	stages?: Record<string, Entity<ZylemStage>>;
	debug?: ZylemDebug;
}
