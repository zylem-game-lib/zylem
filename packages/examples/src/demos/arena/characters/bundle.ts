import type { createActor } from '@zylem/game-lib/entity';

import type { LoadingIndicatorEntity } from './loading-indicator';

/**
 * Internal return shape of `createTankActor` / `createHealerActor` /
 * `createAssassinActor`. Pairs the freshly-built character actor with a
 * `ready` promise that resolves once the FBX model AND its PBR textures
 * are fully applied — at which point the loading indicator can fade out
 * and the actor can fade in.
 *
 * Per-class factories are pure builders; orchestration of the visible
 * fade is owned by the dispatcher in `index.ts` so all three classes
 * share the same lifecycle without duplicating glue.
 */
export interface CharacterActorBundle {
	actor: ReturnType<typeof createActor>;
	ready: Promise<void>;
}

/**
 * Public bundle returned by `createCharacterActor`: the character actor
 * plus a sibling loading-indicator entity. Both should be added to the
 * stage; both should be removed by uuid when the character is despawned
 * (e.g. on lobby class change or arena death). The indicator self-fades
 * once the actor is presentable, but the entity itself sticks around in
 * the entity manager until explicitly removed.
 */
export interface CharacterPresenter {
	actor: ReturnType<typeof createActor>;
	indicator: LoadingIndicatorEntity;
}
