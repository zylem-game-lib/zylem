import { createGame } from '@zylem/game-lib/core';
import { createBox } from '@zylem/game-lib/entity';

const crate = createBox({
	name: 'crate',
	size: { x: 1, y: 1, z: 1 },
	position: { x: 0, y: 0.5, z: 0 },
});

crate.onSetup(({ me }) => {
	me.reveal();
});

crate.onUpdate(({ me, delta }) => {
	me.rotateY(delta * 0.5);
});

crate.onDestroy(({ me }) => {
	console.log('crate removed', me.options.name);
});

createGame(crate).start();
