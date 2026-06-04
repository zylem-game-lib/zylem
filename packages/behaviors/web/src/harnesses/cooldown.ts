import {
	fireCooldown,
	getCooldownStore,
	registerCooldown,
	resetCooldown,
	tickCooldowns,
	type CooldownEntry,
} from '@behaviors/behaviors/cooldown/cooldown-store';
import type { BehaviorHarness, FieldSchema, HarnessAction } from './types';

interface CooldownDef {
	name: string;
	duration: number;
	immediate: boolean;
}

interface Config {
	cooldowns: CooldownDef[];
}

type Input = Record<string, never>;

interface Output {
	/**
	 * Snapshot of just the cooldowns this harness registered, not the global
	 * store, so switching harnesses doesn't bleed entries between views.
	 */
	cooldowns: Record<string, CooldownEntry>;
}

const configSchema: FieldSchema<Config> = [
	{
		key: 'cooldowns',
		label: 'cooldowns (json)',
		kind: { type: 'json' },
		default: [
			{ name: 'attack', duration: 5, immediate: true },
			{ name: 'dash', duration: 2, immediate: false },
		],
		help: 'Array of { name, duration, immediate }. Re-Apply to overwrite the registered cooldowns.',
	},
];

const inputSchema: FieldSchema<Input> = [];

export const cooldownHarness: BehaviorHarness<Config, Input, Output> = {
	id: 'cooldown',
	name: 'Cooldown',
	subtitle: 'cooldown/store',
	description:
		'Reactive cooldown registry. Configure named cooldowns, then tick to advance them. Use the per-cooldown Fire / Reset buttons in the Actions panel to trigger transitions.',
	category: 'store',
	configSchema,
	inputSchema,
	defaultDelta: 1 / 60,
	create(config) {
		const ownedNames = new Set<string>();

		const registerAll = (): void => {
			ownedNames.clear();
			for (const cd of config.cooldowns ?? []) {
				if (!cd?.name) continue;
				registerCooldown(cd.name, cd.duration, cd.immediate);
				ownedNames.add(cd.name);
			}
		};

		registerAll();

		const actions: HarnessAction<Input, Output>[] = [];
		for (const cd of config.cooldowns ?? []) {
			if (!cd?.name) continue;
			actions.push({
				id: `fire:${cd.name}`,
				label: `fire ${cd.name}`,
				run: () => fireCooldown(cd.name),
			});
			actions.push({
				id: `reset:${cd.name}`,
				label: `reset ${cd.name}`,
				run: () => resetCooldown(cd.name),
			});
		}

		return {
			actions,
			tick(delta) {
				tickCooldowns(delta);
			},
			snapshot(): Output {
				const store = getCooldownStore();
				const filtered: Record<string, CooldownEntry> = {};
				for (const name of ownedNames) {
					const entry = store[name];
					if (entry) filtered[name] = { ...entry };
				}
				return { cooldowns: filtered };
			},
			reset() {
				registerAll();
			},
		};
	},
};
