import { defineBehavior } from '@zylem/game-lib/behavior';
import { createSphere } from '@zylem/game-lib/entity';

const PingBehavior = defineBehavior({
	name: 'ping',
	defaultOptions: { intervalMs: 1000 },
	systemFactory: () => ({
		attach() {},
		detach() {},
		update(_world: unknown, _delta: number) {},
	}),
	createHandle: (ref) => ({
		getIntervalMs: () => ref.options.intervalMs,
	}),
});

const entity = createSphere();
const ping = entity.use(PingBehavior, { intervalMs: 500 });
void ping.getIntervalMs();
