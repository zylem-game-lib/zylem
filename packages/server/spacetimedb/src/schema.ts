import { type InferSchema, schema, table, t } from 'spacetimedb/server';

/**
 * Authoritative world pose for a replicated entity (Zylem transform snapshot).
 * Used for both player avatars and AI-host-driven enemy ships.
 */
export const entity_transform = table(
  { name: 'entity_transform', public: true },
  {
    entity_id: t.u64().primaryKey().autoInc(),
    pos_x: t.f32(),
    pos_y: t.f32(),
    pos_z: t.f32(),
    rot_x: t.f32(),
    rot_y: t.f32(),
    rot_z: t.f32(),
    rot_w: t.f32(),
    scale_x: t.f32().default(1),
    scale_y: t.f32().default(1),
    scale_z: t.f32().default(1),
    anim_key: t.string().default('idle'),
    anim_pause_at_end: t.bool().default(false),
  },
);

/**
 * One row per browser device_id (localStorage). Links to entity_transform
 * for pose + nametag data, and carries per-player combat stats (HP and
 * chosen character class) so every peer can render nameplates and avatars
 * without additional client hand-shakes.
 */
export const player = table(
  { name: 'player', public: true },
  {
    device_id: t.string().primaryKey(),
    display_name: t.string(),
    color_u32: t.u32(),
    entity_id: t.u64().unique(),
    owner_identity: t.identity().unique(),
    character_class: t.string().default('tank'),
    hp: t.u32().default(100),
    max_hp: t.u32().default(100),
    spawn_x: t.f32().default(0),
    spawn_y: t.f32().default(0),
    spawn_z: t.f32().default(0),
  },
);

/**
 * One row per AI-controlled enemy in the arena. Pose lives on
 * `entity_transform` (same table used for players), so clients can mirror
 * enemies through the existing transform subscription.
 */
export const enemy = table(
  { name: 'enemy', public: true },
  {
    enemy_id: t.u64().primaryKey().autoInc(),
    entity_id: t.u64().unique(),
    kind: t.string(),
    hp: t.u32(),
    max_hp: t.u32(),
    alive: t.bool().default(true),
    anchor_x: t.f32(),
    anchor_y: t.f32(),
    anchor_z: t.f32(),
  },
);

/**
 * Singleton row identifying which connected client currently owns the
 * enemy AI tick. `id` is always 0. A missing row means no host is
 * currently claimed; the next client to call `claim_ai_host` takes over.
 */
export const ai_host = table(
  { name: 'ai_host', public: true },
  {
    id: t.u8().primaryKey(),
    identity: t.identity(),
  },
);

/**
 * The single shared SpacetimeDB schema instance. All reducer files import
 * this to register handlers; only one `schema(...)` call is allowed per
 * module.
 */
export const spacetime = schema({
  entity_transform,
  player,
  enemy,
  ai_host,
});

export type SpaceTimeSchema = InferSchema<typeof spacetime>;

export default spacetime;
