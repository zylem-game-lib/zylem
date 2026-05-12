/// <reference types="@zylem/assets" />

import { createActor } from '@zylem/game-lib/entity';

import { demoAsset } from '../../../assets/manifest';

const iguanoIdle = demoAsset('arena/models/iguano/iguano.fbx');
const iguanoRun = demoAsset('arena/models/iguano/iguano-run.fbx');
const iguanoFireball = demoAsset('arena/models/iguano/iguano-fireball.fbx');
const iguanoPunch = demoAsset('arena/models/iguano/iguano-punch.fbx');
const iguanoBite = demoAsset('arena/models/iguano/iguano-bite.fbx');
const iguanoPlanting = demoAsset('arena/models/iguano/iguano-planting.fbx');
const iguanoRunDestruct = demoAsset('arena/models/iguano/iguano-run-distruct.fbx');

/**
 * Imported arena humanoid-ish scale (~50× FBX native units → ~1 m character).
 */
const IGUANO_ENEMY_SCALE = { x: 0.022, y: 0.022, z: 0.022 };

/**
 * Fixed (static) rigid body: AI drives pose via `setTranslation` each tick.
 * A dynamic body with gravity sinks into the heightfield and fights the host.
 */
export const IGUANO_ENEMY_COLLISION = {
	size: { x: 1, y: 1, z: 0.55 },
	static: true,
};

/**
 * World-space lift applied to every spawn / per-tick anchor so the iguano's
 * visible feet sit on the heightfield instead of clipping through it.
 *
 * The iguano FBX has its origin at the rig's hip (Mixamo convention) rather
 * than the model's feet, so positioning the actor at the heightfield's Y
 * value puts roughly half the character below the ground. A lift of about
 * half the model's collision height brings the visible feet up to the
 * sampled ground; the small extra epsilon prevents the soles from
 * z-fighting the heightfield mesh.
 *
 * Tied to `IGUANO_ENEMY_COLLISION.size.y` so resizing the capsule keeps the
 * visual lined up automatically.
 */
export const IGUANO_VISUAL_FEET_OFFSET =
	IGUANO_ENEMY_COLLISION.size.y / 2 + 0.02;

/**
 * Build the networked hostile Iguano actor: skeletal clips from the arena
 * pack support locomotion plus ranged (`fireball`), melee (`punch` / `bite`),
 * mine planting (`planting`), and suicidal rush (`runDestruct`) clips.
 *
 * Idle / locomotion clips share keys with playable characters so callers can
 * reuse simple `idle` · `walking` toggles regardless of skeletal layout.
 *
 * `stripRootMotionY: true` is critical for the AI-driven host: every
 * locomotion clip ships with baked root-bone Y keyframes that would
 * otherwise yank the visible model up and down (and fight the AI's
 * `setTranslation` calls) once the mixer comes online. With the Y track
 * stripped, the host owns the iguano's vertical position outright.
 */
export function createIguanoEnemyActor(anchor: { x: number; y: number; z: number }) {
	const actor = createActor({
		name: 'arena-enemy-iguano',
		scale: IGUANO_ENEMY_SCALE,
		models: [iguanoIdle],
		animations: [
			{ key: 'idle', path: iguanoIdle },
			{ key: 'walking', path: iguanoRun },
			{ key: 'fireball', path: iguanoFireball },
			{ key: 'punch', path: iguanoPunch },
			{ key: 'bite', path: iguanoBite },
			{ key: 'planting', path: iguanoPlanting },
			{ key: 'runDestruct', path: iguanoRunDestruct },
		],
		stripRootMotionY: true,
		collisionShape: 'capsule',
		collision: IGUANO_ENEMY_COLLISION,
		position: anchor,
	});

	return actor;
}
