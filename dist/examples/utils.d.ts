import { ZylemBox } from "../src/lib/entities/box";
import { ZylemSphere } from "../src/lib/entities/sphere";
import { Vector2 } from "three";
export type PlaygroundPlaneType = 'grass' | 'dirt' | 'wood' | 'mars' | 'steel';
export declare const playgroundPlane: (type: PlaygroundPlaneType, size?: Vector2) => Promise<import("../src/lib/entities").ZylemPlane>;
export type PlaygroundActorType = 'player' | 'mascot';
export declare const playgroundActor: (type: PlaygroundActorType) => Promise<import("../src/lib/entities").ZylemActor>;
export declare const playgroundPlatforms: () => Promise<ZylemBox[]>;
export declare const createSpheres: (count: number) => Promise<ZylemSphere[]>;
//# sourceMappingURL=utils.d.ts.map