export {
	CooldownBehavior,
	type CooldownOptions,
	type CooldownConfig,
	type CooldownHandle,
} from './cooldown-behavior';

export {
	registerCooldown,
	getCooldown,
	fireCooldown,
	resetCooldown,
	tickCooldowns,
	getCooldownStore,
	type CooldownEntry,
} from './cooldown-store';
