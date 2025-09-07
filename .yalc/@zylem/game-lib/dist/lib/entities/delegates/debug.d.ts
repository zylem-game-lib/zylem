import { GameEntity, GameEntityOptions } from '../entity';
/**
 * Interface for entities that provide custom debug information
 */
export interface DebugInfoProvider {
    getDebugInfo(): Record<string, any>;
}
/**
 * Helper to check if an object implements DebugInfoProvider
 */
export declare function hasDebugInfo(obj: any): obj is DebugInfoProvider;
/**
 * Debug delegate that provides debug information for entities
 */
export declare class DebugDelegate {
    private entity;
    constructor(entity: GameEntity<any>);
    /**
     * Get formatted position string
     */
    private getPositionString;
    /**
     * Get formatted rotation string (in degrees)
     */
    private getRotationString;
    /**
     * Get material information
     */
    private getMaterialInfo;
    private getPhysicsInfo;
    buildDebugInfo(): Record<string, any>;
}
export declare class EnhancedDebugInfoBuilder {
    private customBuilder?;
    constructor(customBuilder?: (options: GameEntityOptions) => Record<string, any>);
    buildInfo(options: GameEntityOptions, entity?: GameEntity<any>): Record<string, any>;
}
