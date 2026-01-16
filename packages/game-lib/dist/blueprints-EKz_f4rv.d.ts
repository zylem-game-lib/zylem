import { Vector2 } from 'three';
import { G as GameEntity } from './entity-9AMNjC28.js';
import { b as Stage } from './stage-types-CINd1RRm.js';
import * as _sinclair_typebox from '@sinclair/typebox';
import { Static } from '@sinclair/typebox';

interface EntitySpawner {
    spawn: (stage: Stage, x: number, y: number) => Promise<GameEntity<any>>;
    spawnRelative: (source: any, stage: Stage, offset?: Vector2) => Promise<any | void>;
}
declare function entitySpawner(factory: (x: number, y: number) => Promise<any> | GameEntity<any>): EntitySpawner;

declare const StageSchema: _sinclair_typebox.TObject<{
    id: _sinclair_typebox.TString;
    name: _sinclair_typebox.TOptional<_sinclair_typebox.TString>;
    entities: _sinclair_typebox.TArray<_sinclair_typebox.TObject<{
        id: _sinclair_typebox.TString;
        type: _sinclair_typebox.TString;
        position: _sinclair_typebox.TOptional<_sinclair_typebox.TTuple<[_sinclair_typebox.TNumber, _sinclair_typebox.TNumber]>>;
        data: _sinclair_typebox.TOptional<_sinclair_typebox.TRecord<_sinclair_typebox.TString, _sinclair_typebox.TAny>>;
    }>>;
    assets: _sinclair_typebox.TOptional<_sinclair_typebox.TArray<_sinclair_typebox.TString>>;
}>;
type StageBlueprint = Static<typeof StageSchema>;

export { type StageBlueprint as S, entitySpawner as e };
