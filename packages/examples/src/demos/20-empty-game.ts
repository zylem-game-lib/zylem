import { createGame } from '@zylem/game-lib';
import { createZylemRuntimeWorld } from '../runtime/zylem-runtime';

async function runRuntimeDemo(): Promise<void> {
  const runtime = await createZylemRuntimeWorld();

  try {
    const entity = runtime.spawn();

    runtime.setPosition(entity, { x: 1, y: 2, z: 3 });
    runtime.setVelocity(entity, { x: 4, y: -2, z: 0.5 });
    runtime.step(0.5);

    console.log('zylem-runtime wasm demo', {
      entity,
      stats: runtime.stats(),
      position: runtime.getPosition(entity),
      velocity: runtime.getVelocity(entity),
    });
  } finally {
    runtime.destroy();
  }
}

export default function createDemo() {
  const game = createGame();

  void runRuntimeDemo().catch((error) => {
    console.error('Failed to load zylem-runtime wasm demo', error);
  });

  game.onLoading((event) => {
    console.log('my loading event: ', event);
  });

  return game;
}
