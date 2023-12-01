import { ZylemDebug } from '@/game/ZylemDebug';
import { ZylemStage } from '@/stage/ZylemStage';
import { Entity } from './Entity';
import { PerspectiveType } from './Perspective';
import ZylemGame from '@/game/ZylemGame';
import { ZylemScene } from '@/scene/ZylemScene';
import { ZylemHUD } from '@/game/ZylemHUD';
export interface GameOptions {
    id: string;
    perspective: PerspectiveType;
    globals: Record<string, any>;
    stage: StageOptions;
    stages?: Record<string, Entity<ZylemStage>>;
    debug?: ZylemDebug;
}
type Concrete<Type> = {
    [Property in keyof Type]-?: Type[Property];
};
export type Conditions<T> = (globals: Concrete<T>, game: ZylemGame, HUD?: ZylemHUD) => void;
export interface StageOptions {
    backgroundColor: number;
    setup: (scene: ZylemScene, HUD: ZylemHUD) => void;
    children: (globals?: any) => any[];
    conditions: Array<Conditions<GameOptions["globals"]>>;
}
export {};
