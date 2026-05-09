import type { Identity } from 'spacetimedb';
import { spacetime } from '../schema';

/** Primary key of the singleton row in the `ai_host` table. */
export const AI_HOST_SINGLETON_ID = 0;

/**
 * Returns `true` when the reducer caller currently owns the AI host slot.
 * Used by enemy-lifecycle reducers to gate host-only mutations.
 */
export function isAiHost(ctx: {
  sender: unknown;
  db: { ai_host: { id: { find: (id: number) => { identity: Identity } | null } } };
}): boolean {
  const sender = ctx.sender as Identity;
  const row = ctx.db.ai_host.id.find(AI_HOST_SINGLETON_ID);
  return row !== null && row.identity.equals(sender);
}

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
