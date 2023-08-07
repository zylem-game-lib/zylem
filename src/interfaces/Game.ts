import { ZylemDebug } from '@/game/ZylemDebug';
import { ZylemStage } from '@/stage/ZylemStage';
import { Entity } from './Entity';
import { PerspectiveType } from './Perspective';
import { Color } from 'three';

export interface GameOptions {
	id: string;
	perspective: PerspectiveType;
	globals?: Record<string, any>;
	stage: StageOptions;
	// TODO: use stage interface
	stages?: Record<string, Entity<ZylemStage>>;
	debug?: ZylemDebug;
}

export interface StageOptions {
	backgroundColor: number;
	children: () => any[];
}