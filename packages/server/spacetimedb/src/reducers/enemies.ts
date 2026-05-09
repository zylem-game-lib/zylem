import { t } from 'spacetimedb/server';
import { spacetime } from '../schema';
import { isAiHost } from './ai_host';

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
