import { Color, Vector2, Vector3 } from 'three';
import {
  createCamera,
  createGame,
  createSprite,
  createStage,
  createText,
  destroy,
  mergeInputConfigs,
  Perspectives,
  ScreenWrapBehavior,
  Shooter2DBehavior,
  setGlobal,
  TEXT_TYPE,
  ThrusterBehavior,
  useArrowsForAxes,
  useBehavior,
  useWASDForAxes,
} from '@zylem/game-lib';
import playerShipImg from '@zylem/assets/2d/space/player-ship.png';
import playerLaserImg from '@zylem/assets/2d/space/player-laser.png';
import meteorBig1 from '@zylem/assets/2d/space/asteroids/meteor-big-1.png';
import meteorBig2 from '@zylem/assets/2d/space/asteroids/meteor-big-2.png';
import meteorBig3 from '@zylem/assets/2d/space/asteroids/meteor-big-3.png';
import meteorBig4 from '@zylem/assets/2d/space/asteroids/meteor-big-4.png';

export default function createDemo() {
  const PLAYFIELD_WIDTH = 30;
  const PLAYFIELD_HEIGHT = 20;
  const BULLET_SPEED = 18;
  const BULLET_BOUNDS_X = PLAYFIELD_WIDTH * 0.5 + 3;
  const BULLET_BOUNDS_Y = PLAYFIELD_HEIGHT * 0.5 + 3;
  const ASTEROID_SPEED = 1.1;
  const BRAKE_DECELERATION = 8;

  const asteroidImages = [
    meteorBig1,
    meteorBig2,
    meteorBig3,
    meteorBig4,
  ] as const;

  function getRotationAngle2D(rotation: {
    x: number;
    y: number;
    z: number;
    w: number;
  }) {
    return Math.atan2(
      2 * (rotation.w * rotation.z + rotation.x * rotation.y),
      1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z),
    );
  }

  function getForwardDirection(angle: number) {
    return {
      x: Math.sin(-angle),
      y: Math.cos(-angle),
    };
  }

  function createPlayerBullet() {
    const bullet = createSprite({
      name: 'player-bullet',
      images: [{ name: 'player-bullet', file: playerLaserImg }],
      size: new Vector3(0.35, 0.75, 1),
    });

    bullet.onUpdate(({ me }) => {
      const position = me.getPosition();
      if (!position) return;

      if (
        Math.abs(position.x) > BULLET_BOUNDS_X ||
        Math.abs(position.y) > BULLET_BOUNDS_Y
      ) {
        destroy(me);
      }
    });

    bullet.onCollision(({ entity, other, globals }) => {
      if (other.name !== 'asteroid') {
        return;
      }

      destroy(entity);
      destroy(other);
      setGlobal('score', (globals.score as number) + 10);
    });

    return bullet;
  }

  function createAsteroid(index: number) {
    const asteroid = createSprite({
      name: 'asteroid',
      images: [
        {
          name: `asteroid-${index}`,
          file: asteroidImages[index % asteroidImages.length]!,
        },
      ],
      size: new Vector3(1.6, 1.6, 1),
      position: new Vector3(-10 + index * 4.5, index % 2 === 0 ? 5 : -4, 0),
    });

    asteroid.use(ScreenWrapBehavior, {
      width: PLAYFIELD_WIDTH,
      height: PLAYFIELD_HEIGHT,
    });

    const travelAngle = (index / 5) * Math.PI * 2 + Math.PI / 8;
    const velocity = {
      x: Math.cos(travelAngle) * ASTEROID_SPEED,
      y: Math.sin(travelAngle) * ASTEROID_SPEED,
    };

    asteroid.onSetup(({ me }) => {
      me.setRotationZ(travelAngle);
    });

    asteroid.onUpdate(({ me }) => {
      me.moveXY(velocity.x, velocity.y);
    });

    return asteroid;
  }

  const baseShip = createSprite({
    name: 'player-ship',
    images: [{ name: 'player-ship', file: playerShipImg }],
    size: new Vector3(1, 1, 1),
    position: new Vector3(0, 0, 0),
  });

  const playerShip = useBehavior(baseShip, ThrusterBehavior, {
    linearThrust: 3.2,
    angularThrust: 3,
    linearDamping: 0.3,
  });

  playerShip.use(ScreenWrapBehavior, {
    width: PLAYFIELD_WIDTH,
    height: PLAYFIELD_HEIGHT,
  });

  const playerShooter = playerShip.use(Shooter2DBehavior, {
    projectileFactory: createPlayerBullet,
    projectileSpeed: BULLET_SPEED,
    cooldownMs: 140,
    spawnOffset: { x: 0, y: 1.1 },
    rotateProjectile: true,
  });

  const camera = createCamera({
    position: new Vector3(0, 0, 12),
    target: new Vector3(0, 0, 0),
    zoom: 18,
    perspective: Perspectives.Fixed2D,
  });

  const stage = createStage(
    {
      backgroundColor: new Color('#04070f'),
    },
    camera,
  );

  playerShip.onUpdate(({ me, inputs, delta }) => {
    const { Horizontal, Vertical } = inputs.p1.axes;
    const { A } = inputs.p1.buttons;

    if (me.$thruster) {
      me.$thruster.thrustX = 0;
      me.$thruster.thrustY = 0;
      me.$thruster.rotate = Horizontal.value;
      me.$thruster.thrust = Math.max(0, -Vertical.value);
    }

    const brakeInput = Math.max(0, Vertical.value);
    if (brakeInput > 0 && me.body) {
      const velocity = me.body.linvel();
      const brakeScale = Math.max(
        0,
        1 - brakeInput * BRAKE_DECELERATION * delta,
      );
      me.body.setLinvel(
        {
          x: velocity.x * brakeScale,
          y: velocity.y * brakeScale,
          z: velocity.z,
        },
        true,
      );
    }

    if (!A.pressed && A.held <= 0) {
      return;
    }

    const sourcePosition = me.body?.translation();
    const sourceRotation = me.body?.rotation();
    if (!sourcePosition || !sourceRotation) {
      return;
    }

    const facingAngle = getRotationAngle2D(sourceRotation);
    const forward = getForwardDirection(facingAngle);
    void playerShooter.fire({
      source: me,
      stage,
      target: {
        x: sourcePosition.x + forward.x,
        y: sourcePosition.y + forward.y,
      },
    });
  });

  const scoreText = createText({
    name: 'scoreText',
    text: 'Score: 0',
    fontSize: 20,
    stickToViewport: true,
    screenPosition: new Vector2(0.88, 0.05),
  });

  const asteroids = Array.from({ length: 5 }, (_, index) =>
    createAsteroid(index),
  );

  stage.add(playerShip, ...asteroids);
  stage.setInputConfiguration(
    mergeInputConfigs(useArrowsForAxes('p1'), useWASDForAxes('p1')),
  );

  const game = createGame(
    {
      id: 'new-asteroids',
      globals: {
        score: 0,
      },
    },
    stage,
    scoreText,
  ).onGlobalChange<number>('score', (score, currentStage) => {
    currentStage
      ?.getEntityByName('scoreText', TEXT_TYPE)
      ?.updateText(`Score: ${score}`);
  });

  return game;
}
