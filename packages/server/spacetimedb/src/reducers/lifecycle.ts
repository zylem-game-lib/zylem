import type { Identity } from 'spacetimedb';
import { spacetime } from '../schema';
import { AI_HOST_SINGLETON_ID } from './ai_host';

/**
 * On client disconnect: vacate the AI host slot if held, then remove the
 * caller's player + transform rows so peers stop rendering a ghost.
 */
export const client_disconnected = spacetime.clientDisconnected((ctx) => {
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
