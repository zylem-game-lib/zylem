import { Color, Vector3, Vector2 } from 'three';
import {
  createGame,
  createBox,
  createSphere,
  createStage,
  createCamera,
  createText,
  ricochetSound,
  pingPongBeep,
  getGlobal,
  setGlobal,
  RuntimeBoundary2DBehavior,
  RuntimeDynamicCircleBody2DBehavior,
  RuntimePlayerInput2DBehavior,
  RuntimeRicochet2DBehavior,
} from '@zylem/game-lib';
import { createBundledZylemRuntimeStageAdapter } from '../runtime/zylem-runtime';

export default function createDemo() {
  const gameBounds = { top: 5, bottom: -5, left: -15, right: 15 };

  const ball = createSphere({
    name: 'ball',
    position: { x: 0, y: 0, z: 0 },
    radius: 0.1,
    color: new Color(Color.NAMES.white),
    runtime: {
      simulation: 'runtime',
      render: 'mesh',
    },
  });

  const ballRuntime = ball.use(RuntimeDynamicCircleBody2DBehavior, {
    initialVelocity: [5, 0],
  });

  const ballRicochet = ball.use(RuntimeRicochet2DBehavior, {
    minSpeed: 5,
    maxSpeed: 10,
    speedMultiplier: 1.05,
    reflectionMode: 'angled',
    maxAngleDeg: 60,
  });

  ball.use(RuntimeBoundary2DBehavior, {
    boundaries: gameBounds,
  });

  ballRicochet.onRicochet((event) => {
    if (event.kind === 'wall') {
      ricochetSound();
    } else {
      pingPongBeep();
    }
  });

  const paddleSize = { x: 0.2, y: 1.5, z: 1 };
  const paddleMaterial = { color: new Color(Color.NAMES.white) };
  const paddleSpeed = 5;

  const paddle1 = createBox({
    name: 'paddle1',
    position: { x: -8, y: 0, z: 0 },
    size: paddleSize,
    material: paddleMaterial,
    runtime: {
      simulation: 'runtime',
      render: 'mesh',
    },
  });

  paddle1.use(RuntimeBoundary2DBehavior, {
    boundaries: gameBounds,
  });
  paddle1.use(RuntimePlayerInput2DBehavior, {
    player: 'p1',
    speed: paddleSpeed,
  });

  const paddle2 = createBox({
    name: 'paddle2',
    position: { x: 8, y: 0, z: 0 },
    size: paddleSize,
    material: paddleMaterial,
    runtime: {
      simulation: 'runtime',
      render: 'mesh',
    },
  });

  paddle2.use(RuntimeBoundary2DBehavior, {
    boundaries: gameBounds,
  });
  paddle2.use(RuntimePlayerInput2DBehavior, {
    player: 'p2',
    speed: paddleSpeed,
  });

  const camera = createCamera({
    position: { x: 0, y: 0, z: 0 },
    perspective: 'fixed-2d',
    zoom: 12,
  });

  const p1Text = createText({
    name: 'p1Text',
    text: '0',
    fontSize: 24,
    screenPosition: { x: 0.45, y: 0.05 },
  });

  const p2Text = createText({
    name: 'p2Text',
    text: '0',
    fontSize: 24,
    screenPosition: { x: 0.55, y: 0.05 },
  });

  const winnerText = createText({
    name: 'winnerText',
    text: '',
    fontSize: 36,
    screenPosition: { x: 0.5, y: 0.5 },
  });

  const stage1 = createStage(
    {
      backgroundColor: new Color(Color.NAMES.black),
      runtimeAdapter: createBundledZylemRuntimeStageAdapter(),
    },
    camera,
  );
  const game = createGame(
    {
      id: 'pong',
      debug: true,
      globals: {
        p1Score: 0,
        p2Score: 0,
        winner: '',
      },
      input: {
        // Keyboard mapping (W/S for P1, Arrows for P2)
        // Note: Keyboard mainly drives directions.Up/Down.
        // Gamepad support is automatic and provided via axes.Vertical.
        p1: { key: { w: ['directions.Up'], s: ['directions.Down'] } },
        p2: {
          key: { ArrowUp: ['directions.Up'], ArrowDown: ['directions.Down'] },
        },
      },
    },
    stage1,
    ball,
    paddle1,
    paddle2,
    p1Text,
    p2Text,
    winnerText,
  );

  const goalScore = 3;
  let justScored = false;

  stage1.onUpdate(() => {
    const position = ballRuntime.getRuntimePosition();
    if (!position) return;

    if (justScored && Math.abs(position.x) < 0.5) {
      justScored = false;
    }
    if (justScored || (getGlobal<string>('winner') ?? '') !== '') {
      return;
    }

    if (position.x >= 12) {
      setGlobal('p1Score', (getGlobal<number>('p1Score') ?? 0) + 1);
      ballRuntime.setRuntimePosition(0, 0, 0);
      ballRuntime.setRuntimeVelocity(-5, 0);
      justScored = true;
    } else if (position.x <= -12) {
      setGlobal('p2Score', (getGlobal<number>('p2Score') ?? 0) + 1);
      ballRuntime.setRuntimePosition(0, 0, 0);
      ballRuntime.setRuntimeVelocity(5, 0);
      justScored = true;
    }
  });

  game.onGlobalChanges<[number, number]>(['p1Score', 'p2Score'], ([p1, p2]) => {
    if (p1 >= goalScore) {
      setGlobal('winner', 'p1');
      ballRuntime.setRuntimePosition(0, 1, 0);
      ballRuntime.setRuntimeVelocity(0, 0);
    }
    if (p2 >= goalScore) {
      setGlobal('winner', 'p2');
      ballRuntime.setRuntimePosition(0, 1, 0);
      ballRuntime.setRuntimeVelocity(0, 0);
    }
  });

  game.onGlobalChange<string>('winner', value => {
    console.log('Winner:', value);
    if (value === 'p1') {
      winnerText.updateText('P1 Wins!');
    } else if (value === 'p2') {
      winnerText.updateText('P2 Wins!');
    } else {
      winnerText.updateText('');
    }
  });

  game.onGlobalChange<number>('p1Score', value => {
    p1Text.updateText(String(value));
  });

  game.onGlobalChange<number>('p2Score', value => {
    p2Text.updateText(String(value));
  });

  return game;
}
