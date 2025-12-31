import { createGame, gameConfig } from '@zylem/game-lib';
import { StageBlueprint } from '@zylem/game-lib';
import { StageManager } from '@zylem/game-lib';

// Define a stage blueprint
const myStageBlueprint: StageBlueprint = {
  id: 'arch-test-stage',
  name: 'Architecture Test',
  entities: [
    {
      id: 'hello-text',
      type: 'text',
      position: [20, 20],
      data: {
        text: 'Hello Data-Driven World!',
        fontSize: 40,
        fontColor: '#00FF00'
      }
    },
    {
      id: 'test-sprite',
      type: 'sprite',
      position: [0.5, 0.5],
      data: {
        size: { x: 1, y: 1, z: 1 },
        material: { color: '#FF0000' }
      }
    }
  ]
};

// This will have to move into the the game Class
// Register the stage
StageManager.registerStaticStage(myStageBlueprint.id, myStageBlueprint);

const myGameConfig = gameConfig({
  id: 'arch-test',
  debug: true,
});

const game = createGame(myGameConfig);
game.start();

setTimeout(() => {
    // Load the stage using the new ID-based method
	game.loadStageFromId('arch-test-stage');
}, 1000);
