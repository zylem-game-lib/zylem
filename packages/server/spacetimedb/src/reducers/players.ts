import type { Identity } from 'spacetimedb';
import { t } from 'spacetimedb/server';
import { spacetime } from '../schema';

/** Default starting / max HP applied to a freshly registered player. */
export const DEFAULT_MAX_HP = 100;

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
