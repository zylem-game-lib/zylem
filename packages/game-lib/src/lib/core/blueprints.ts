import { Type, Static } from '@sinclair/typebox';

export const Vector2Schema = Type.Tuple([Type.Number(), Type.Number()]);

export const EntitySchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  position: Type.Optional(Vector2Schema),
  data: Type.Optional(Type.Record(Type.String(), Type.Any()))
});

export const StageSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String()),
  entities: Type.Array(EntitySchema),
  assets: Type.Optional(Type.Array(Type.String()))
});

export type EntityBlueprint = Static<typeof EntitySchema>;
export type StageBlueprint = Static<typeof StageSchema>;
