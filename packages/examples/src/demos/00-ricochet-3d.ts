import { Color, Vector3 } from 'three';
import {
  BoundaryRicochet3DCoordinator,
  createBox,
  createCamera,
  createGame,
  createSphere,
  createStage,
  Ricochet3DBehavior,
  WorldBoundary3DBehavior,
} from '@zylem/game-lib';

export default function createDemo() {
  const cubeHalfSize = 6;
  const wallThickness = 0.35;
  const ballRadius = 0.45;
  const wallColor = new Color('#89a7b1');
  const wallOpacity = 0.35;
  const wallDefinitions = [
    {
      name: 'wall-left',
      position: { x: -cubeHalfSize, y: 0, z: 0 },
      size: { x: wallThickness, y: cubeHalfSize * 2, z: cubeHalfSize * 2 },
    },
    {
      name: 'wall-right',
      position: { x: cubeHalfSize, y: 0, z: 0 },
      size: { x: wallThickness, y: cubeHalfSize * 2, z: cubeHalfSize * 2 },
    },
    {
      name: 'wall-bottom',
      position: { x: 0, y: -cubeHalfSize, z: 0 },
      size: { x: cubeHalfSize * 2, y: wallThickness, z: cubeHalfSize * 2 },
    },
    {
      name: 'wall-top',
      position: { x: 0, y: cubeHalfSize, z: 0 },
      size: { x: cubeHalfSize * 2, y: wallThickness, z: cubeHalfSize * 2 },
    },
    {
      name: 'wall-back',
      position: { x: 0, y: 0, z: -cubeHalfSize },
      size: { x: cubeHalfSize * 2, y: cubeHalfSize * 2, z: wallThickness },
    },
    {
      name: 'wall-front',
      position: { x: 0, y: 0, z: cubeHalfSize },
      size: { x: cubeHalfSize * 2, y: cubeHalfSize * 2, z: wallThickness },
    },
  ] as const;

  const boundaryInset = wallThickness / 2;
  const boxBounds = {
    left: -cubeHalfSize + boundaryInset,
    right: cubeHalfSize - boundaryInset,
    bottom: -cubeHalfSize + boundaryInset,
    top: cubeHalfSize - boundaryInset,
    back: -cubeHalfSize + boundaryInset,
    front: cubeHalfSize - boundaryInset,
  } as const;

  const walls = wallDefinitions.map(wall =>
    createBox({
      name: wall.name,
      position: wall.position,
      size: wall.size,
      collision: { static: true, sensor: true },
      material: {
        color: wallColor.clone().offsetHSL(0, 0, Math.random() * 0.08),
        opacity: wallOpacity,
      },
    }),
  );

  const ball = createSphere({
    name: 'ricochet-ball',
    radius: ballRadius,
    position: { x: 0, y: 0, z: 0 },
    material: { color: new Color('#ff6f61') },
  });

  const ball2 = ball.clone({
    name: 'ricochet-ball-2',
    position: { x: 1.75, y: -1.25, z: 1.2 },
    material: { color: new Color('#ffd166') },
  });

  function attachBoundaryRicochet(
    entity: typeof ball,
    initialVelocity: { x: number; y: number; z: number },
  ) {
    const ricochet = entity.use(Ricochet3DBehavior, {
      minSpeed: 8,
      maxSpeed: 12,
      speedMultiplier: 1,
      reflectionMode: 'simple',
      maxAngleDeg: 25,
    });
    const boundary = entity.use(WorldBoundary3DBehavior, {
      boundaries: boxBounds,
      padding: ballRadius,
    });
    const coordinator = new BoundaryRicochet3DCoordinator(
      entity,
      boundary,
      ricochet,
    );

    entity.onSetup(({ me }) => {
      me.body?.setGravityScale(0, true);
      me.body?.setLinvel(initialVelocity, true);
    });

    entity.onUpdate(() => {
      coordinator.update();
    });
  }

  attachBoundaryRicochet(ball, { x: 8, y: 5.5, z: 6.5 });
  attachBoundaryRicochet(ball2, { x: -9.25, y: 4.25, z: -7.5 });

  const camera = createCamera({
    position: { x: 16, y: 12, z: 16 },
    target: { x: 0, y: 0, z: 0 },
  });

  const stage = createStage(
    {
      backgroundColor: new Color('#0f1720'),
    },
    camera,
  );

  stage.add(ball, ball2, ...walls);

  const game = createGame(
    {
      id: 'ricochet-3d',
      debug: true,
    },
    stage,
  );

  return game;
}
