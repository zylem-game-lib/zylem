export { S as StageOptions, c as createStage } from './stage-BdyqquDY.js';
export { e as entitySpawner } from './entity-spawner-BS9zl8E_.js';
import * as _sinclair_typebox from '@sinclair/typebox';
import { Static } from '@sinclair/typebox';
import './entity-ByNgyo1y.js';
import 'three';
import '@dimforge/rapier3d-compat';
import 'bitecs';
import './camera-BLcG7KL-.js';
import 'three/addons/controls/OrbitControls.js';
import 'three/examples/jsm/postprocessing/EffectComposer.js';

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

export type { StageBlueprint };
