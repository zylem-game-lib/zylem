import { Static } from '@sinclair/typebox';
export declare const Vector2Schema: import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TNumber]>;
export declare const EntitySchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TString;
    position: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TNumber]>>;
    data: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>>;
}>;
export declare const StageSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    entities: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TString;
        position: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TTuple<[import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TNumber]>>;
        data: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>>;
    }>>;
    assets: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
}>;
export type EntityBlueprint = Static<typeof EntitySchema>;
export type StageBlueprint = Static<typeof StageSchema>;
//# sourceMappingURL=blueprints.d.ts.map