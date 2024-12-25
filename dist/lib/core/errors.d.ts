import { GameEntity } from './game-entity';
declare const EntityErrors_base: import('ts-mixer/dist/types/types').Class<any[], GameEntity<unknown>, new (options: import('../interfaces/entity').GameEntityOptions<{
    collision?: import('../interfaces/entity').CollisionOption<unknown> | undefined;
}, unknown>) => GameEntity<unknown>>;
export declare class EntityErrors extends EntityErrors_base {
	errorEntityBody(): string;
	errorIncompatibleFileType(extension?: string): string;
}
export {};
