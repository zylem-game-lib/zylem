/**
 * Lazy loading utilities for Zylem components
 * Use these functions to load parts of the library only when needed
 *
 * Loading order follows dependency hierarchy:
 * 1. Foundation (core utilities, types)
 * 2. State, Input, Graphics, Physics (parallel)
 * 3. Camera (depends on graphics)
 * 4. Entities (depends on foundation, graphics, physics)
 * 5. Behaviors (depends on entities)
 * 6. Core game systems (depends on most others)
 * 7. Stage (depends on everything)
 */
export declare const loadFoundation: () => Promise<{
    baseNode: typeof import("./base-node");
    lifeCycle: typeof import("./base-node-life-cycle");
    utility: typeof import("./utility/vector");
    vector: typeof import("./vector");
}>;
export declare const loadState: () => Promise<typeof import("../game/game-state")>;
export declare const loadInput: () => Promise<typeof import("../input/input-manager")>;
export declare const loadGraphics: () => Promise<{
    material: typeof import("../graphics/material");
    mesh: typeof import("../graphics/mesh");
}>;
export declare const loadPhysics: () => Promise<{
    collision: typeof import("../collision/collision");
    collisionBuilder: typeof import("../collision/collision-builder");
}>;
export declare const loadCamera: () => Promise<{
    camera: typeof import("../camera/camera");
    perspectives: typeof import("../camera/perspective");
}>;
export declare const loadAllEntities: () => Promise<typeof import("../entities/entity")>;
export declare const loadEntity: (entityType: "box" | "sphere" | "sprite" | "plane" | "zone" | "actor") => Promise<typeof import("../entities/box") | typeof import("../entities/sphere") | typeof import("../entities/sprite") | typeof import("../entities/plane") | typeof import("../entities/zone") | typeof import("../entities/actor")>;
export declare const loadBehaviors: () => Promise<typeof import("../actions/behaviors/actions")>;
export declare const loadGameCore: () => Promise<{
    game: typeof import("../game/game");
    vessel: typeof import("./vessel");
}>;
export declare const loadStage: () => Promise<{
    stage: typeof import("../stage/stage");
    world: typeof import("../collision/world");
    scene: typeof import("../graphics/zylem-scene");
}>;
export declare const loadDebugTools: () => Promise<typeof import("../ui/Debug")>;
export declare const loadFullGame: () => Promise<{
    foundation: {
        baseNode: typeof import("./base-node");
        lifeCycle: typeof import("./base-node-life-cycle");
        utility: typeof import("./utility/vector");
        vector: typeof import("./vector");
    };
    state: typeof import("../game/game-state");
    input: typeof import("../input/input-manager");
    graphics: {
        material: typeof import("../graphics/material");
        mesh: typeof import("../graphics/mesh");
    };
    physics: {
        collision: typeof import("../collision/collision");
        collisionBuilder: typeof import("../collision/collision-builder");
    };
    camera: {
        camera: typeof import("../camera/camera");
        perspectives: typeof import("../camera/perspective");
    };
    entities: typeof import("../entities/entity");
    behaviors: typeof import("../actions/behaviors/actions");
    gameCore: {
        game: typeof import("../game/game");
        vessel: typeof import("./vessel");
    };
    stage: {
        stage: typeof import("../stage/stage");
        world: typeof import("../collision/world");
        scene: typeof import("../graphics/zylem-scene");
    };
}>;
//# sourceMappingURL=lazy-loader.d.ts.map