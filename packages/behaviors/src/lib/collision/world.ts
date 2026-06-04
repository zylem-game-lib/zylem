import type { GameEntity } from '../entities/entity';

export interface ZylemWorld {
	collisionMap?: Map<string, GameEntity<any>>;
}

