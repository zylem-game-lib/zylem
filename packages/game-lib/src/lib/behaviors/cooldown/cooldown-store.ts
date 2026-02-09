import { proxy } from 'valtio';

/**
 * A single cooldown entry in the global store.
 */
export interface CooldownEntry {
	/** Identifier for this cooldown */
	name: string;
	/** Total cooldown time in seconds */
	duration: number;
	/** Time accumulated since last fire */
	elapsed: number;
	/** Whether the cooldown is ready (elapsed >= duration) */
	ready: boolean;
	/** Normalized progress 0..1 (0 = just fired, 1 = ready) */
	progress: number;
	/** Whether this cooldown is currently counting down */
	active: boolean;
}

/**
 * Global reactive cooldown registry (valtio proxy).
 * Accessible from entities, behaviors, and UI components.
 */
const cooldownStore = proxy<Record<string, CooldownEntry>>({});

/**
 * Register a named cooldown in the global store.
 * If a cooldown with the same name already exists, it is overwritten.
 *
 * @param name Unique cooldown identifier
 * @param duration Cooldown duration in seconds
 * @param immediate If true, the cooldown starts ready (default: true)
 */
export function registerCooldown(
	name: string,
	duration: number,
	immediate: boolean = true,
): void {
	cooldownStore[name] = {
		name,
		duration,
		elapsed: immediate ? duration : 0,
		ready: immediate,
		progress: immediate ? 1 : 0,
		active: !immediate,
	};
}

/**
 * Get a cooldown entry by name.
 * Returns undefined if the cooldown has not been registered.
 */
export function getCooldown(name: string): CooldownEntry | undefined {
	return cooldownStore[name];
}

/**
 * Fire (trigger) a cooldown, resetting its timer.
 * Sets the cooldown to not-ready and starts the countdown.
 */
export function fireCooldown(name: string): void {
	const entry = cooldownStore[name];
	if (!entry) return;
	entry.elapsed = 0;
	entry.ready = false;
	entry.progress = 0;
	entry.active = true;
}

/**
 * Force a cooldown to ready immediately.
 */
export function resetCooldown(name: string): void {
	const entry = cooldownStore[name];
	if (!entry) return;
	entry.elapsed = entry.duration;
	entry.ready = true;
	entry.progress = 1;
	entry.active = false;
}

/**
 * Advance all active cooldowns by delta seconds.
 * Called once per frame by the CooldownBehavior system.
 */
export function tickCooldowns(delta: number): void {
	for (const name in cooldownStore) {
		const entry = cooldownStore[name];
		if (!entry.active) continue;

		entry.elapsed += delta;
		if (entry.elapsed >= entry.duration) {
			entry.elapsed = entry.duration;
			entry.ready = true;
			entry.progress = 1;
			entry.active = false;
		} else {
			entry.progress = entry.duration > 0 ? entry.elapsed / entry.duration : 1;
		}
	}
}

/**
 * Get the raw cooldown store (for advanced/debugging use).
 */
export function getCooldownStore(): Record<string, CooldownEntry> {
	return cooldownStore;
}
