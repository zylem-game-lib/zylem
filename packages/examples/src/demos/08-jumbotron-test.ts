/// <reference types="@zylem/assets" />
import { Color, Vector3 } from 'three';
import {
  createGame,
  createStage,
  createCamera,
  createBox,
  Perspectives,
  setCameraFeed,
} from '@zylem/game-lib';
import { playgroundPlane, playgroundActor } from '../utils';

export default function createDemo() {
  // ─── Scene entities ──────────────────────────────────────────────────────

  const ground = playgroundPlane('grass');

  const boxes = [
    createBox({
      position: { x: -6, y: 1, z: 0 },
      size: { x: 2, y: 2, z: 2 },
      collision: { static: false },
      material: { color: new Color(Color.NAMES.tomato) },
    }),
    createBox({
      position: { x: 6, y: 1, z: 2 },
      size: { x: 2, y: 4, z: 2 },
      collision: { static: false },
      material: { color: new Color(Color.NAMES.royalblue) },
    }),
    createBox({
      position: { x: 0, y: 1, z: -5 },
      size: { x: 3, y: 3, z: 3 },
      collision: { static: false },
      material: { color: new Color(Color.NAMES.gold) },
    }),
  ];

  const actor = playgroundActor('mascot');

  // ─── Jumbotron screen (the mesh that shows the camera feed) ──────────────

  const screenWidth = 24;
  const screenHeight = screenWidth * (9 / 16);
  const screenDepth = 0.3;

  const jumbotronScreen = createBox({
    name: 'jumbotron',
    position: { x: 0, y: 12, z: -20 },
    size: { x: screenWidth, y: screenHeight, z: screenDepth },
    collision: { static: true },
    material: { color: new Color(0x111111) },
  });

  const jumbotronFrame = createBox({
    name: 'jumbotron-frame',
    position: { x: 0, y: 12, z: -20.3 },
    size: { x: screenWidth + 0.6, y: screenHeight + 0.6, z: screenDepth + 0.1 },
    collision: { static: true },
    material: { color: new Color(0x333333) },
  });

  const jumbotronPost = createBox({
    name: 'jumbotron-post',
    position: { x: 0, y: 2, z: -20.3 },
    size: { x: 1.5, y: 6, z: 1 },
    collision: { static: true },
    material: { color: new Color(0x555555) },
  });

  // ─── Cameras ─────────────────────────────────────────────────────────────

  const mainCamera = createCamera({
    position: { x: 0, y: 10, z: 30 },
    target: { x: 0, y: 0, z: 0 },
    perspective: Perspectives.ThirdPerson,
    name: 'main',
  });

  const jumbotronCamera = createCamera({
    position: { x: 30, y: 0, z: 30 },
    target: { x: 20, y: 20, z: 0 },
    perspective: Perspectives.ThirdPerson,
    name: 'jumbotron-cam',
    renderToTexture: { width: 1024, height: 576 },
  });

  // ─── Wire up the jumbotron feed ──────────────────────────────────────────

  jumbotronScreen.onSetup(({ me }: any) => {
    setCameraFeed(me, jumbotronCamera);
  });

  // Let the jumbotron camera follow the actor
  actor.onSetup(({ me }: any) => {
    jumbotronCamera.addTarget(me);
  });

  // ─── Stage ───────────────────────────────────────────────────────────────

  const stage = createStage(
    { gravity: { x: 0, y: -9.82, z: 0 } },
    mainCamera,
    jumbotronCamera,
  );

  stage.add(ground);
  stage.add(...boxes);
  stage.add(actor);
  stage.add(jumbotronScreen);
  stage.add(jumbotronFrame);
  stage.add(jumbotronPost);

  // ─── Game ────────────────────────────────────────────────────────────────

  const game = createGame({ id: 'jumbotron-test', debug: true }, stage);

  return game;
}
