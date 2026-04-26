import type { CooldownHandle, Inputs } from '@zylem/game-lib';
import {
	spawnParticleBurst,
	type ParticleBurstSpec,
} from '../characters/attack-effects';
import type {
	CharacterActionEntry,
	CharacterMoveset,
	SpecialSlotId,
} from '../characters/movesets';
import type { NetworkAnimationState, PlayerEntity } from './main-stage';

/**
 * Shared helper: the string-key name used to register a special slot's
 * cooldown on the global CooldownStore. Centralising this mapping keeps
 * the combat controller and the cooldown HUD in sync without having to
 * plumb a full lookup table through `spawnAvatar`.
 */
export function cooldownNameForSlot(slot: SpecialSlotId): string {
	return `arena-special-${slot}`;
}

/**
 * Fraction of an attack's duration after which a follow-up A press can
 * cancel into the next combo tier. Plan calls for "late ~40%" — i.e.
 * presses after 60% are welcome.
 */
const ATTACK_CANCEL_WINDOW = 0.6;

/**
 * Fraction of the attack duration at which the hit sphere is tested.
 * Landing the hit at 50% gives the animation time to wind up before the
 * damage frame registers, matching the feel of the Tripo-pack swings.
 */
const ATTACK_HIT_FRACTION = 0.5;

/**
 * World-space radius of the attack hit sphere, anchored ~1.5 units in
 * front of the actor's facing direction.
 */
const ATTACK_HIT_RADIUS = 1.8;

/** Distance ahead of the actor where the attack hit sphere is centred. */
const ATTACK_HIT_REACH = 1.5;

/**
 * Time (seconds) since the last attack ended during which a fresh A
 * press continues the combo from where it left off. Past this window the
 * next press resets to the light tier.
 */
const COMBO_RESET_SECONDS = 0.6;

/**
 * Forward hit test callback emitted by the combat controller when an
 * attack's "active frames" hit (see `ATTACK_HIT_FRACTION`). Main stage
 * resolves overlaps against enemies and fires `damageEnemy` reducers.
 */
export type ReportAttackHit = (info: {
	/** World-space centre of the hit sphere. */
	position: { x: number; y: number; z: number };
	/** Attack tier (0=light, 1=medium, 2=heavy). */
	tier: number;
	/** Damage authored on the moveset entry; undefined if not set. */
	damage: number | undefined;
}) => void;

export interface CombatControllerOptions {
	actor: PlayerEntity;
	/**
	 * Anywhere we can `.add(particleEntity)` — in practice the fluent
	 * stage handle returned by `createStage`. Narrowing the type here
	 * keeps the controller decoupled from the full `StageHandle` surface.
	 */
	stage: { add: (...entities: any[]) => void };
	moveset: CharacterMoveset;
	/**
	 * Optional cooldown handle from `actor.use(CooldownBehavior, ...)`.
	 * When present, special slots with an authored `cooldown` are gated
	 * by `cd.isReady(cooldownNameForSlot(slot))` and fired via `cd.fire`.
	 */
	cooldowns?: CooldownHandle | null;
	/**
	 * Optional sink for attack-hit events. Called once per attack at the
	 * active-frames fraction (see {@link ATTACK_HIT_FRACTION}).
	 */
	onAttackHit?: ReportAttackHit;
}

export interface CombatControllerTickInput {
	delta: number;
	inputs: Inputs;
}

/**
 * Resolved per-frame movement intent emitted by {@link CombatController.tick}.
 * The caller is responsible for forwarding these values to whatever
 * platformer is driving the actor (TS-side `$platformer.moveX/moveZ/jump`,
 * or the wasm runtime adapter via `adapter.pushInput`).
 *
 * While an attack or special is locked in, `moveX/moveZ/jump` are forced
 * to zero so the character holds still for the animation; rotation is
 * left to the caller (the arena re-uses the last non-zero axis input).
 */
export interface CombatTickResult {
	moveX: number;
	moveZ: number;
	jump: boolean;
}

export interface CombatController {
	tick(input: CombatControllerTickInput): CombatTickResult;
	/**
	 * Animation to play this frame, or `null` if the platformer FSM
	 * should own the animation slot.
	 */
	currentAnimation(): NetworkAnimationState | null;
	/** True while an attack or special is locked in. */
	isBusy(): boolean;
}

type ActiveAction = {
	kind: 'attack' | 'special';
	tier: number;
	startedAt: number;
	entry: CharacterActionEntry;
	/** Whether {@link ReportAttackHit} has already fired for this action. */
	hitEmitted: boolean;
};

/**
 * Create a per-actor combat controller. The controller owns combo state
 * and particle spawning; the caller is responsible for consulting
 * {@link CombatController.currentAnimation} before falling back to the
 * platformer FSM and for forwarding the resulting animation across the
 * network.
 */
export function createCombatController(
	opts: CombatControllerOptions,
): CombatController {
	const { actor, stage, moveset, cooldowns, onAttackHit } = opts;

	let now = 0;
	let action: ActiveAction | null = null;
	let comboTier = 0;
	let lastAttackEndedAt = Number.NEGATIVE_INFINITY;

	function actorWorldPosition(): { x: number; y: number; z: number } {
		const tr = actor.body?.translation?.();
		if (tr) {
			return { x: tr.x, y: tr.y, z: tr.z };
		}
		const g = actor.group;
		if (g) {
			return { x: g.position.x, y: g.position.y, z: g.position.z };
		}
		return { x: 0, y: 0, z: 0 };
	}

	/**
	 * World-space facing direction on the xz plane. Reads from the
	 * actor's root quaternion; falls back to +Z if the actor hasn't
	 * received a rotation yet.
	 */
	function actorForward(): { x: number; z: number } {
		const g = actor.group;
		if (!g) return { x: 0, z: 1 };
		const q = g.quaternion;
		const x = 2 * (q.x * q.z + q.w * q.y);
		const z = 1 - 2 * (q.x * q.x + q.y * q.y);
		const len = Math.hypot(x, z) || 1;
		return { x: x / len, z: z / len };
	}

	function spawnParticles(spec: ParticleBurstSpec | undefined): void {
		if (!spec) return;
		spawnParticleBurst(stage, actorWorldPosition(), spec);
	}

	function startAction(kind: 'attack' | 'special', tier: number, entry: CharacterActionEntry): void {
		action = { kind, tier, startedAt: now, entry, hitEmitted: false };
		if (kind === 'attack') {
			comboTier = tier;
		}
		spawnParticles(entry.particles);
	}

	function maybeEmitHit(): void {
		if (!action || action.hitEmitted) return;
		if (!onAttackHit) return;
		const elapsed = now - action.startedAt;
		if (elapsed < action.entry.duration * ATTACK_HIT_FRACTION) return;
		const pos = actorWorldPosition();
		const fwd = actorForward();
		onAttackHit({
			position: {
				x: pos.x + fwd.x * ATTACK_HIT_REACH,
				y: pos.y + 1,
				z: pos.z + fwd.z * ATTACK_HIT_REACH,
			},
			tier: action.tier,
			damage: action.entry.damage,
		});
		action.hitEmitted = true;
	}

	function completeActionIfDone(): void {
		if (!action) return;
		if (now - action.startedAt < action.entry.duration) return;
		const wasAttack = action.kind === 'attack';
		action = null;
		if (wasAttack) {
			lastAttackEndedAt = now;
		}
	}

	function handleAttackInput(pressed: boolean): void {
		if (!pressed) return;
		const attacks = moveset.attacks;
		if (attacks.length === 0) return;

		if (action?.kind === 'attack') {
			const elapsed = now - action.startedAt;
			const inCancelWindow =
				elapsed >= ATTACK_CANCEL_WINDOW * action.entry.duration;
			if (!inCancelWindow) return;
			const nextTier = Math.min(action.tier + 1, attacks.length - 1);
			if (nextTier === action.tier) return;
			startAction('attack', nextTier, attacks[nextTier]!);
			return;
		}

		if (action?.kind === 'special') {
			return;
		}

		const sinceLastAttack = now - lastAttackEndedAt;
		let tier = 0;
		if (sinceLastAttack <= COMBO_RESET_SECONDS) {
			tier = Math.min(comboTier + 1, attacks.length - 1);
		}
		startAction('attack', tier, attacks[tier]!);
	}

	function handleSpecialInput(slot: SpecialSlotId, pressed: boolean): void {
		if (!pressed) return;
		if (action) return;
		const entry = moveset.specials[slot];
		if (!entry) return;
		if (entry.cooldown !== undefined) {
			if (!cooldowns) return;
			const cdName = cooldownNameForSlot(slot);
			if (!cooldowns.isReady(cdName)) return;
			cooldowns.fire(cdName);
		}
		startAction('special', 0, entry);
	}

	return {
		tick({ delta, inputs }) {
			now += delta;
			if (action?.kind === 'attack') maybeEmitHit();
			completeActionIfDone();

			const p1 = inputs.p1;
			const horizontal = p1.axes.Horizontal.value;
			const vertical = p1.axes.Vertical.value;

			handleAttackInput(p1.buttons.A.pressed);
			handleSpecialInput('X', p1.buttons.X.pressed);
			handleSpecialInput('Y', p1.buttons.Y.pressed);
			handleSpecialInput('L', p1.buttons.L.pressed);
			handleSpecialInput('R', p1.buttons.R.pressed);

			if (action) {
				// Lock movement while an action is locked in so the attack
				// animation reads cleanly. Rotation is still applied by
				// `installLocalMovement` from the last axis input.
				return { moveX: 0, moveZ: 0, jump: false };
			}
			return {
				moveX: horizontal,
				moveZ: vertical,
				jump: p1.buttons.B.held > 0,
			};
		},
		currentAnimation() {
			if (!action) return null;
			return { key: action.entry.key, pauseAtEnd: false };
		},
		isBusy() {
			return action !== null;
		},
	};
}
