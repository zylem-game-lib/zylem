import { Color, Vector3 } from 'three';
import {
  createBox,
  createCamera,
  createGame,
  createSprite,
  createStage,
  Jumper2D,
  mergeInputConfigs,
  Perspectives,
  useArrowsForAxes,
  useWASDForAxes,
} from '@zylem/game-lib';
import zylemManSprite from '../assets/zylem-man-2d-sprite.png';

export default function createDemo() {
  const floor = createBox({
    name: 'floor',
    size: new Vector3(22, 1, 1),
    position: new Vector3(0, -5, 0),
    collision: { static: true },
    material: { color: new Color('#4c956c') },
  });

  const platforms = [
    createBox({
      name: 'platform-left',
      size: new Vector3(4, 0.75, 1),
      position: new Vector3(-5, -1.5, 0),
      collision: { static: true },
      material: { color: new Color('#f4a259') },
    }),
    createBox({
      name: 'platform-right',
      size: new Vector3(4, 0.75, 1),
      position: new Vector3(4.5, 1.25, 0),
      collision: { static: true },
      material: { color: new Color('#f4a259') },
    }),
  ] as const;

  const player = createSprite({
    name: 'zylem-man-jumper',
    position: new Vector3(-8, -3, 0),
    size: new Vector3(2, 2, 1),
    images: [{ name: 'zylem-man', file: zylemManSprite }],
  });

  player.onSetup(({ me }) => {
    me.body?.lockRotations(true, true);
  });

  player.use(Jumper2D, {
    jumpHeight: 3.5,
    gravity: 18,
    maxJumps: 2,
    coyoteTimeMs: 120,
    jumpBufferMs: 100,
    maxFallSpeed: 14,
    variableJump: {
      enabled: true,
      cutGravityMultiplier: 2.2,
    },
    groundRayLength: 1,
    snapToGroundDistance: 0.15,
  });

  player.onUpdate(({ me, inputs }) => {
    const { p1 } = inputs;
    const jumperInput = (me as any).$jumper2d;
    if (!jumperInput || !me.body) return;

    const horizontal = p1.axes.Horizontal.value * 6.5;
    me.moveX(horizontal);

    jumperInput.jumpPressed = p1.buttons.A.pressed;
    jumperInput.jumpHeld = p1.buttons.A.held > 0;
    jumperInput.jumpReleased = p1.buttons.A.released;
    jumperInput.fastFall = p1.axes.Vertical.value > 0.5;
    (me as any).setSprite?.('zylem-man');
  });

  const camera = createCamera({
    position: new Vector3(0, 0, 12),
    target: new Vector3(0, 0, 0),
    zoom: 18,
    perspective: Perspectives.Fixed2D,
  });

  const stage = createStage(
    {
      backgroundColor: new Color('#1a2238'),
    },
    camera,
  );
  stage.add(floor, ...platforms, player);
  stage.setInputConfiguration(
    mergeInputConfigs(useArrowsForAxes('p1'), useWASDForAxes('p1')),
  );

  const game = createGame(
    {
      id: 'jumper-2d',
      debug: true,
    },
    stage,
  );

  return game;
}
