/// <reference types="@zylem/assets" />

import { Euler, Vector3 } from 'three';
import {
  createGame,
  createStage,
  createCamera,
  createActor,
  gameConfig,
  Perspectives,
  useWASDForAxes,
  useMouseLook,
  FirstPersonShooterCoordinator,
  FirstPersonPerspective,
  FirstPersonController,
  Jumper3D,
} from '@zylem/game-lib';

import { createFloor, createArenaLevel } from './01-fps/level';

import skybox from '@zylem/assets/3d/skybox/default.png';
import pistolGlb from '../assets/space-age-pistol.glb';

export default function createDemo() {
  // --- Camera ---

  const fpsCamera = createCamera({
    perspective: Perspectives.FirstPerson,
    position: { x: 0, y: 2, z: 5 },
    target: { x: 0, y: 2, z: 0 },
    name: 'fps',
    damping: 0.15,
    skipDebugOrbit: true,
  });

  const fps = fpsCamera.getPerspective<FirstPersonPerspective>();

  // --- Player (invisible physics capsule) ---

  const player = createActor({
    name: 'player',
    collision: {
      static: false,
      size: { x: 0.6, y: 1.8, z: 0.6 },
    },
    position: { x: 0, y: 2, z: 5 },
  });

  // --- Pistol viewmodel (visual only, positioned by FPS controller) ---

  const pistol = createActor({
    name: 'pistol',
    models: [pistolGlb],
    scale: { x: 1, y: 1, z: 1 },
    collision: {
      static: true,
      size: { x: 0.1, y: 0.1, z: 0.1 },
    },
    position: { x: 0, y: 0, z: 0 },
  });

  // --- Behaviors ---

  const fpsController = player.use(FirstPersonController, {
    perspective: fps,
    walkSpeed: 8,
    runSpeed: 16,
    lookSensitivity: 2,
    viewmodel: {
      entity: pistol,
      offset: { x: -1.4, y: -0.85, z: -0.5 },
      rotation: new Euler(0, -1.8, -0.1),
    },
  });

  const jumper = player.use(Jumper3D, {
    jumpHeight: 2.5,
    gravity: 20,
    maxJumps: 2,
    coyoteTimeMs: 100,
    jumpBufferMs: 80,
    snapToGroundDistance: 0.15,
    variableJump: { enabled: true, cutGravityMultiplier: 3 },
    fall: { fallGravityMultiplier: 1.5 },
  });

  const fpsShooter = new FirstPersonShooterCoordinator(
    player,
    fpsController,
    jumper,
  );

  // --- Stage + input ---

  const stage = createStage(
    {
      gravity: { x: 0, y: -20, z: 0 },
      backgroundImage: skybox,
    },
    fpsCamera,
  );

  stage.setInputConfiguration(useWASDForAxes('p1'), useMouseLook('p1'), {
    p1: {
      key: {
        ' ': ['buttons.a'],
      },
    },
  });

  // --- Entities ---

  const floor = createFloor();
  const walls = createArenaLevel();

  // --- Game ---

  const myGameConfig = gameConfig({
    id: 'fps-demo',
    debug: true,
    bodyBackground: '#1a1a1a',
    resolution: {
      width: 800,
      height: 600,
    },
  });

  const game = createGame(
    myGameConfig,
    stage,
    floor,
    ...walls,
    player,
    pistol,
  ).onUpdate(({ inputs }) => {
    const { p1 } = inputs;
    fpsShooter.update({
      moveX: p1.axes.Horizontal.value,
      moveZ: p1.axes.Vertical.value,
      lookX: p1.axes.SecondaryHorizontal.value,
      lookY: p1.axes.SecondaryVertical.value,
      sprint: p1.shoulders.LTrigger.held > 0,
      jumpPressed: p1.buttons.A.pressed,
      jumpHeld: p1.buttons.A.held > 0,
      jumpReleased: p1.buttons.A.released,
    });
  });

  return game;
}
