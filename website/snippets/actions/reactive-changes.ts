import { createGame } from '@zylem/game-lib/core';
import { createSphere, createText } from '@zylem/game-lib/entity';
import { setGlobal, globalChange, globalChanges } from '@zylem/game-lib/globals';

const scoreLabel = createText({ text: 'Score: 0' });
const marker = createSphere();

marker.onUpdate(
	globalChange<number>('score', (value) => {
		scoreLabel.updateText(`Score: ${value ?? 0}`);
	}),
	globalChanges<number>(['score', 'highScore'], ([score, highScore]) => {
		if (score !== undefined && score === highScore) {
			marker.setPositionY(0.5);
		} else {
			marker.setPositionY(0);
		}
	}),
);

marker.onSetup(() => {
	setGlobal('score', 0);
	setGlobal('highScore', 0);
});

createGame(scoreLabel, marker).start();
