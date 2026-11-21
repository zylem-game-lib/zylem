import {
	defineBehavior,
	SlotBehaviorSystem,
	type BehaviorEntityLink,
} from '@zylem/game-lib/behavior';
import { createSphere } from '@zylem/game-lib/entity';

interface PulseOptions {
	/** Pulses per second. */
	rate: number;
}

/** State the behavior keeps on the entity. Built once, then reused. */
interface PulseComponent {
	elapsed: number;
	value: number;
}

class PulseSystem extends SlotBehaviorSystem<PulseOptions> {
	/** Runs when the behavior starts on an entity: at spawn and at every enable(). */
	protected prepare(link: BehaviorEntityLink): void {
		link.entity.pulse ??= { elapsed: 0, value: 0 } satisfies PulseComponent;
	}

	/** Runs when the behavior stops: at disable(), unuse(), and when the entity leaves the stage. */
	protected release(link: BehaviorEntityLink): void {
		const pulse = link.entity.pulse as PulseComponent;
		pulse.elapsed = 0;
		pulse.value = 0;
	}

	/** Start the behavior in the runtime for this slot. Nothing to do for a pure TypeScript behavior. */
	protected attachRuntime(_slot: number, _options: PulseOptions): void {}

	/** Stop the behavior in the runtime for this slot. */
	protected detachRuntime(_slot: number): void {}

	/** Runs every frame for every entity whose behavior is on. */
	protected writeInputs(link: BehaviorEntityLink, _slot: number, delta: number): void {
		const pulse = link.entity.pulse as PulseComponent;
		const { rate } = link.ref.options as PulseOptions;
		pulse.elapsed += delta;
		pulse.value = Math.sin(pulse.elapsed * rate * Math.PI * 2);
	}
}

const PulseBehavior = defineBehavior({
	name: 'pulse',
	defaultOptions: { rate: 1 } as PulseOptions,
	systemFactory: (ctx) => new PulseSystem(ctx.wasmStage ?? null),
});

const orb = createSphere();
const pulse = orb.use(PulseBehavior, { rate: 2 });

// The base class makes the behavior switchable during play.
pulse.disable();
pulse.enable();
