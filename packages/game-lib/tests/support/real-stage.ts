import { ZylemWorld } from '../../src/lib/collision/world';
import { StageEntityDelegate } from '../../src/lib/stage/stage-entity-delegate';
import { StageEntityModelDelegate } from '../../src/lib/stage/stage-entity-model-delegate';
import { StageLoadingDelegate } from '../../src/lib/stage/stage-loading-delegate';

/** Frame length used by {@link RealStage.step}. */
export const FRAME_SECONDS = 1 / 60;

/**
 * The part of a stage that runs behaviors, on the real wasm runtime and with
 * no renderer: a world, the entity delegate that hosts behaviors, and a frame
 * step in the same order the stage uses.
 */
export interface RealStage {
	world: ZylemWorld;
	delegate: StageEntityDelegate;
	/** Run `frames` frames: behavior systems, the wasm step, then post-physics systems. */
	step(frames?: number): void;
	/** Free the wasm world. */
	destroy(): void;
}

/**
 * Create a headless stage on the real wasm runtime.
 *
 * @param gravityY Vertical gravity; zero by default so bodies stay put unless a behavior moves them.
 */
export async function createRealStage(gravityY = 0): Promise<RealStage> {
	const world = await ZylemWorld.create({ x: 0, y: gravityY, z: 0 }, 60);
	const delegate = new StageEntityDelegate(
		new StageLoadingDelegate(),
		new StageEntityModelDelegate(),
	);
	delegate.attach({
		scene: { addEntityGroup() {}, scene: { remove() {} } } as any,
		world,
		renderStrategy: null,
		camera: {} as any,
	});
	const frame = { delta: FRAME_SECONDS } as any;

	return {
		world,
		delegate,
		step(frames = 1) {
			const systems = delegate.behaviorSystems;
			for (let n = 0; n < frames; n++) {
				for (let i = 0; i < systems.length; i++) {
					systems[i]!.update(undefined, FRAME_SECONDS);
				}
				world.update(frame);
				for (let i = 0; i < systems.length; i++) {
					(systems[i] as any).postUpdate?.(undefined, FRAME_SECONDS);
				}
			}
		},
		destroy() {
			world.destroy();
		},
	};
}
