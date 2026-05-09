/**
 * SpacetimeDB module entry. The CLI bundles this file and the schema's
 * `[moduleHooks](exports)` registers every named export below as a reducer
 * (or lifecycle hook). All reducers are defined in the `./reducers/`
 * subfolder against the single shared `spacetime` instance from `./schema`.
 *
 * NOTE: `[moduleHooks]` rejects any named export that is not a SpacetimeDB
 * `ModuleExport`, so this file MUST re-export reducers/lifecycle hooks
 * only — never helper constants or functions. Helpers stay scoped to
 * their reducer files (and are imported directly between reducer files
 * when needed).
 */

export { default } from './schema';

export { claim_ai_host } from './reducers/ai_host';
export {
  damage_enemy,
  despawn_enemy,
  set_enemy_transform,
  spawn_enemy,
} from './reducers/enemies';
export { client_disconnected } from './reducers/lifecycle';
export {
  damage_player,
  register_player,
  respawn_player,
  set_entity_transform,
  set_player_character_class,
} from './reducers/players';
