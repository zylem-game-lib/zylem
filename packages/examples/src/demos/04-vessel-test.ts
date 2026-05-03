import {
  createGame,
  vessel,
  createStage,
  createText,
  createGlobal,
  getGlobal,
  setGlobal,
} from '@zylem/game-lib';
import { demoAsset } from '../assets/manifest';
import { Vector2 } from 'three';

const marsSurfacePath = demoAsset('general/texture-mars-surface.jpg');

export default function createDemo() {
  createGlobal('vesselCounter', 0);

  const testVessel = vessel()
    .onSetup((params: any) => {
      const vesselCounter = getGlobal('vesselCounter') as number;
      vesselTextSetup.updateText(
        `Vessel was setup ${Math.ceil(vesselCounter)}`,
      );
    })
    .onUpdate((params: any) => {
      let vesselCounter = getGlobal('vesselCounter') as number;
      vesselCounter += params.delta;
      setGlobal('vesselCounter', vesselCounter);
      vesselTextUpdate.updateText(
        `Vessel was updated ${Math.ceil(vesselCounter)}`,
      );
    });

  const vesselTextSetup = createText({
    text: '',
    stickToViewport: true,
    screenPosition: { x: 0.5, y: 0.25 },
  });

  const vesselText = createText({
    text: 'Hello World',
    stickToViewport: true,
    screenPosition: { x: 0.5, y: 0.5 },
  });

  const vesselTextUpdate = createText({
    text: '',
    stickToViewport: true,
    screenPosition: { x: 0.5, y: 0.75 },
  });

  const stage1 = createStage({ backgroundImage: marsSurfacePath });
  const testGame = createGame(
    { id: 'zylem', debug: true, globals: { vesselCounter: 0 } },
    stage1,
    testVessel,
    vesselText,
    vesselTextSetup,
    vesselTextUpdate,
  );

  return testGame;
}
