import type { Identity } from 'spacetimedb';
import { schema, table, t } from 'spacetimedb/server';

/**
 * Authoritative world pose for a replicated entity (Zylem transform snapshot).
 * Used for both player avatars and AI-host-driven enemy ships.
 */
const entity_transform = table(
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
const player = table(
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
const enemy = table(
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
const ai_host = table(
  { name: 'ai_host', public: true },
  {
    id: t.u8().primaryKey(),
    identity: t.identity(),
  },
);

const spacetime = schema({
  entity_transform,
  player,
  enemy,
  ai_host,
});

export default spacetime;

function spawnIndex(ctx: { db: { player: { iter: () => IterableIterator<unknown> } } }): number {
  let n = 0;
  for (const _ of ctx.db.player.iter()) {
    n += 1;
  }
  return n;
}

function spawnPosition(index: number): { x: number; y: number; z: number } {
  const radius = 3 + index * 1.5;
  const angle = index * 2.39996322972865332;
  return {
    x: Math.cos(angle) * radius,
    y: 0,
    z: Math.sin(angle) * radius,
  };
}

const DEFAULT_MAX_HP = 100;
const AI_HOST_SINGLETON_ID = 0;

/** Register or refresh a player: creates transform + player row, or updates identity/name/color on reconnect. */
export const register_player = spacetime.reducer(
  {
    device_id: t.string(),
    display_name: t.string(),
    color_u32: t.u32(),
  },
  (ctx, { device_id, display_name, color_u32 }) => {
    const sender = ctx.sender as Identity;
    const existing = ctx.db.player.device_id.find(device_id);
    if (existing !== null) {
      ctx.db.player.device_id.update({
        device_id,
        display_name,
        color_u32,
        entity_id: existing.entity_id,
        owner_identity: sender,
        character_class: existing.character_class,
        hp: existing.max_hp,
        max_hp: existing.max_hp,
        spawn_x: existing.spawn_x,
        spawn_y: existing.spawn_y,
        spawn_z: existing.spawn_z,
      });
      return;
    }

    const idx = spawnIndex(ctx);
    const pos = spawnPosition(idx);
    const inserted = ctx.db.entity_transform.insert({
      entity_id: 0n,
      pos_x: pos.x,
      pos_y: pos.y,
      pos_z: pos.z,
      rot_x: 0,
      rot_y: 0,
      rot_z: 0,
      rot_w: 1,
      scale_x: 1,
      scale_y: 1,
      scale_z: 1,
      anim_key: 'idle',
      anim_pause_at_end: false,
    });

    ctx.db.player.insert({
      device_id,
      display_name,
      color_u32,
      entity_id: inserted.entity_id,
      owner_identity: sender,
      character_class: 'tank',
      hp: DEFAULT_MAX_HP,
      max_hp: DEFAULT_MAX_HP,
      spawn_x: pos.x,
      spawn_y: pos.y,
      spawn_z: pos.z,
    });
  },
);

/** Client-authoritative MVP: only the owning identity may move their entity. */
export const set_entity_transform = spacetime.reducer(
  {
    device_id: t.string(),
    entity_id: t.u64(),
    pos_x: t.f32(),
    pos_y: t.f32(),
    pos_z: t.f32(),
    rot_x: t.f32(),
    rot_y: t.f32(),
    rot_z: t.f32(),
    rot_w: t.f32(),
    scale_x: t.f32(),
    scale_y: t.f32(),
    scale_z: t.f32(),
    anim_key: t.string(),
    anim_pause_at_end: t.bool(),
  },
  (ctx, p) => {
    const row = ctx.db.player.device_id.find(p.device_id);
    if (row === null || row.entity_id !== p.entity_id) {
      return;
    }
    if (!row.owner_identity.equals(ctx.sender as Identity)) {
      return;
    }
    const cur = ctx.db.entity_transform.entity_id.find(p.entity_id);
    if (cur === null) {
      return;
    }
    ctx.db.entity_transform.entity_id.update({
      entity_id: p.entity_id,
      pos_x: p.pos_x,
      pos_y: p.pos_y,
      pos_z: p.pos_z,
      rot_x: p.rot_x,
      rot_y: p.rot_y,
      rot_z: p.rot_z,
      rot_w: p.rot_w,
      scale_x: p.scale_x,
      scale_y: p.scale_y,
      scale_z: p.scale_z,
      anim_key: p.anim_key,
      anim_pause_at_end: p.anim_pause_at_end,
    });
  },
);

/** Persist the caller's chosen character class so remote peers can render the right model. */
export const set_player_character_class = spacetime.reducer(
  {
    device_id: t.string(),
    character_class: t.string(),
  },
  (ctx, { device_id, character_class }) => {
    const row = ctx.db.player.device_id.find(device_id);
    if (row === null) {
      return;
    }
    if (!row.owner_identity.equals(ctx.sender as Identity)) {
      return;
    }
    ctx.db.player.device_id.update({
      ...row,
      character_class,
    });
  },
);

/**
 * Apply damage to a player. Any client may call this — e.g. the AI host
 * when an enemy bullet lands, or a peer when they land a melee hit. HP
 * is clamped to 0 to keep `u32` valid.
 */
export const damage_player = spacetime.reducer(
  {
    device_id: t.string(),
    amount: t.u32(),
  },
  (ctx, { device_id, amount }) => {
    const row = ctx.db.player.device_id.find(device_id);
    if (row === null) {
      return;
    }
    const nextHp = row.hp > amount ? row.hp - amount : 0;
    ctx.db.player.device_id.update({
      ...row,
      hp: nextHp,
    });
  },
);

/**
 * Reset a player to full HP at a given spawn position. Owner-checked so
 * only the player themselves can trigger their respawn.
 */
export const respawn_player = spacetime.reducer(
  {
    device_id: t.string(),
    pos_x: t.f32(),
    pos_y: t.f32(),
    pos_z: t.f32(),
  },
  (ctx, { device_id, pos_x, pos_y, pos_z }) => {
    const row = ctx.db.player.device_id.find(device_id);
    if (row === null) {
      return;
    }
    if (!row.owner_identity.equals(ctx.sender as Identity)) {
      return;
    }
    ctx.db.player.device_id.update({
      ...row,
      hp: row.max_hp,
    });
    const tr = ctx.db.entity_transform.entity_id.find(row.entity_id);
    if (tr !== null) {
      ctx.db.entity_transform.entity_id.update({
        ...tr,
        pos_x,
        pos_y,
        pos_z,
        rot_x: 0,
        rot_y: 0,
        rot_z: 0,
        rot_w: 1,
        anim_key: 'idle',
        anim_pause_at_end: false,
      });
    }
  },
);

/**
 * AI-host-only: insert a new enemy row + backing transform at the
 * supplied anchor position.
 */
export const spawn_enemy = spacetime.reducer(
  {
    kind: t.string(),
    max_hp: t.u32(),
    anchor_x: t.f32(),
    anchor_y: t.f32(),
    anchor_z: t.f32(),
  },
  (ctx, p) => {
    if (!isAiHost(ctx)) {
      return;
    }
    const inserted = ctx.db.entity_transform.insert({
      entity_id: 0n,
      pos_x: p.anchor_x,
      pos_y: p.anchor_y,
      pos_z: p.anchor_z,
      rot_x: 0,
      rot_y: 0,
      rot_z: 0,
      rot_w: 1,
      scale_x: 1,
      scale_y: 1,
      scale_z: 1,
      anim_key: 'idle',
      anim_pause_at_end: false,
    });
    ctx.db.enemy.insert({
      enemy_id: 0n,
      entity_id: inserted.entity_id,
      kind: p.kind,
      hp: p.max_hp,
      max_hp: p.max_hp,
      alive: true,
      anchor_x: p.anchor_x,
      anchor_y: p.anchor_y,
      anchor_z: p.anchor_z,
    });
  },
);

/** AI-host-only: update an enemy's world pose from the host client's sim. */
export const set_enemy_transform = spacetime.reducer(
  {
    entity_id: t.u64(),
    pos_x: t.f32(),
    pos_y: t.f32(),
    pos_z: t.f32(),
    rot_x: t.f32(),
    rot_y: t.f32(),
    rot_z: t.f32(),
    rot_w: t.f32(),
  },
  (ctx, p) => {
    if (!isAiHost(ctx)) {
      return;
    }
    const cur = ctx.db.entity_transform.entity_id.find(p.entity_id);
    if (cur === null) {
      return;
    }
    ctx.db.entity_transform.entity_id.update({
      ...cur,
      pos_x: p.pos_x,
      pos_y: p.pos_y,
      pos_z: p.pos_z,
      rot_x: p.rot_x,
      rot_y: p.rot_y,
      rot_z: p.rot_z,
      rot_w: p.rot_w,
    });
  },
);

/** Any client may call this; the AI host will despawn the enemy once its tick observes `alive = false`. */
export const damage_enemy = spacetime.reducer(
  {
    enemy_id: t.u64(),
    amount: t.u32(),
  },
  (ctx, { enemy_id, amount }) => {
    const row = ctx.db.enemy.enemy_id.find(enemy_id);
    if (row === null || !row.alive) {
      return;
    }
    const nextHp = row.hp > amount ? row.hp - amount : 0;
    ctx.db.enemy.enemy_id.update({
      ...row,
      hp: nextHp,
      alive: nextHp > 0,
    });
  },
);

/**
 * AI-host-only cleanup: remove an enemy row and its backing transform.
 * Called after fracture/death VFX finishes on the host.
 */
export const despawn_enemy = spacetime.reducer(
  {
    enemy_id: t.u64(),
  },
  (ctx, { enemy_id }) => {
    if (!isAiHost(ctx)) {
      return;
    }
    const row = ctx.db.enemy.enemy_id.find(enemy_id);
    if (row === null) {
      return;
    }
    const tr = ctx.db.entity_transform.entity_id.find(row.entity_id);
    if (tr !== null) {
      ctx.db.entity_transform.delete(tr);
    }
    ctx.db.enemy.delete(row);
  },
);

/**
 * Claim the AI host slot if nobody currently owns it. First-come-first-
 * served; other clients will observe the row insert and defer.
 */
export const claim_ai_host = spacetime.reducer({}, (ctx) => {
  const sender = ctx.sender as Identity;
  const existing = ctx.db.ai_host.id.find(AI_HOST_SINGLETON_ID);
  if (existing !== null) {
    return;
  }
  ctx.db.ai_host.insert({
    id: AI_HOST_SINGLETON_ID,
    identity: sender,
  });
});

function isAiHost(ctx: {
  sender: unknown;
  db: { ai_host: { id: { find: (id: number) => { identity: Identity } | null } } };
}): boolean {
  const sender = ctx.sender as Identity;
  const row = ctx.db.ai_host.id.find(AI_HOST_SINGLETON_ID);
  return row !== null && row.identity.equals(sender);
}

export const client_disconnected = spacetime.clientDisconnected(ctx => {
  const id = ctx.sender as Identity;

  const host = ctx.db.ai_host.id.find(AI_HOST_SINGLETON_ID);
  if (host !== null && host.identity.equals(id)) {
    ctx.db.ai_host.delete(host);
  }

  const found = ctx.db.player.owner_identity.find(id);
  if (found === null) {
    return;
  }
  const trow = ctx.db.entity_transform.entity_id.find(found.entity_id);
  if (trow !== null) {
    ctx.db.entity_transform.delete(trow);
  }
  ctx.db.player.delete(found);
});
