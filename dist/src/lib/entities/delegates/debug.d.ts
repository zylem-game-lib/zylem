import { GameEntity } from '../entity';
/**
 * Interface for entities that provide custom debug information
 */
export interface DebugInfoProvider {
    getDebugInfo(): Record<string, any>;
}
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
//# sourceMappingURL=debug.d.ts.map