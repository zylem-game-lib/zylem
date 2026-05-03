import {
  createBox,
  createCamera,
  createGame,
  createPlane,
  createSphere,
  createStage,
  createText,
  defaultTouchControls,
  fireShader,
  mergeInputConfigs,
  starShader,
  useArrowsForAxes,
  useWASDForAxes,
} from '@zylem/game-lib';
import {
  Color,
  Material,
  Mesh,
  MeshStandardMaterial,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three';

const ARENA_SIZE = 18;
const HALF_ARENA = ARENA_SIZE * 0.5 - 1.4;
const WALL_HEIGHT = 1.4;
const MOVE_SPEED = 8.5;
const BALL_BASE_Y = 1.15;

const COLOR_LOOKS = [
  {
    label: 'Lagoon Pop',
    color: new Color('#4cc9f0'),
    emissive: new Color('#4361ee'),
  },
  {
    label: 'Solar Pop',
    color: new Color('#ffb703'),
    emissive: new Color('#fb8500'),
  },
] as const;

const SHADER_LOOKS = [
  {
    label: 'Star Bloom',
    shader: starShader,
  },
  {
    label: 'Fire Bloom',
    shader: fireShader,
  },
] as const;

type ColorLook = (typeof COLOR_LOOKS)[number];
type ShaderLook = (typeof SHADER_LOOKS)[number];

function createArenaWall(options: {
  size: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
}) {
  return createBox({
    size: options.size,
    position: options.position,
    collision: { static: true },
    material: { color: new Color('#21354d') },
  });
}

function createShaderMaterial(shader: { vertex: string; fragment: string }) {
  return new ShaderMaterial({
    uniforms: {
      iResolution: { value: new Vector3(512, 512, 1) },
      iTime: { value: 0 },
      uvScale: { value: new Vector2(1, 1) },
    },
    vertexShader: shader.vertex,
    fragmentShader: shader.fragment,
    transparent: true,
  });
}

function applyEntityMaterial(entity: any, material: Material): void {
  entity.materials = [material];

  if (entity.mesh) {
    entity.mesh.material = material;
  }

  if (entity.group) {
    entity.group.traverse((child: unknown) => {
      if (child instanceof Mesh) {
        child.material = material;
      }
    });
  }
}

function formatAxis(value: number): string {
  return value.toFixed(2);
}

function getColorLook(index: number): ColorLook {
  return COLOR_LOOKS[index] ?? COLOR_LOOKS[0];
}

function getShaderLook(index: number): ShaderLook {
  return SHADER_LOOKS[index] ?? SHADER_LOOKS[0];
}

export default function createDemo() {
  let elapsed = 0;
  let colorIndex = 0;
  let shaderIndex = 0;
  let currentLookLabel: string = getColorLook(colorIndex).label;
  let standardBallMaterial: MeshStandardMaterial | null = null;

  const shaderBallMaterials = SHADER_LOOKS.map(({ shader }) =>
    createShaderMaterial(shader),
  );
  const fallbackShaderMaterial = shaderBallMaterials[0]!;
  const initialColorLook = getColorLook(0);

  const floor = createPlane({
    tile: { x: ARENA_SIZE, y: ARENA_SIZE },
    subdivisions: 1,
    material: { color: new Color('#0f2236') },
    position: { x: 0, y: 0, z: 0 },
  });

  const walls = [
    createArenaWall({
      size: { x: ARENA_SIZE + 1.2, y: WALL_HEIGHT, z: 0.8 },
      position: { x: 0, y: WALL_HEIGHT * 0.5, z: -(HALF_ARENA + 0.8) },
    }),
    createArenaWall({
      size: { x: ARENA_SIZE + 1.2, y: WALL_HEIGHT, z: 0.8 },
      position: { x: 0, y: WALL_HEIGHT * 0.5, z: HALF_ARENA + 0.8 },
    }),
    createArenaWall({
      size: { x: 0.8, y: WALL_HEIGHT, z: ARENA_SIZE + 1.2 },
      position: { x: -(HALF_ARENA + 0.8), y: WALL_HEIGHT * 0.5, z: 0 },
    }),
    createArenaWall({
      size: { x: 0.8, y: WALL_HEIGHT, z: ARENA_SIZE + 1.2 },
      position: { x: HALF_ARENA + 0.8, y: WALL_HEIGHT * 0.5, z: 0 },
    }),
  ] as const;

  const ball = createSphere({
    name: 'virtual-touch-ball',
    radius: 1.05,
    position: { x: 0, y: BALL_BASE_Y, z: 0 },
    material: { color: initialColorLook.color },
  });

  const titleText = createText({
    name: 'touch-ball-title',
    text: 'Virtual Touch Ball',
    fontSize: 26,
    stickToViewport: true,
    screenPosition: { x: 0.5, y: 0.06 },
  });

  const modeText = createText({
    name: 'touch-ball-mode',
    text: `Current look: ${currentLookLabel}`,
    fontSize: 18,
    stickToViewport: true,
    screenPosition: { x: 0.5, y: 0.11 },
  });

  const inputText = createText({
    name: 'touch-ball-input',
    text: 'Move with the joystick or WASD/arrows. A swaps palettes. B swaps shaders.',
    fontSize: 16,
    stickToViewport: true,
    screenPosition: { x: 0.5, y: 0.16 },
  });

  const applyColorLook = (nextIndex: number) => {
    const look = getColorLook(nextIndex);
    colorIndex = nextIndex;
    currentLookLabel = look.label;

    if (!standardBallMaterial) {
      return;
    }

    standardBallMaterial.color.set(look.color);
    standardBallMaterial.emissive.set(look.emissive);
    standardBallMaterial.emissiveIntensity = 0.38;
    standardBallMaterial.roughness = 0.26;
    standardBallMaterial.metalness = 0.12;
    standardBallMaterial.needsUpdate = true;

    applyEntityMaterial(ball, standardBallMaterial);
    modeText.updateText(`Current look: ${currentLookLabel}`);
  };

  const applyShaderLook = (nextIndex: number) => {
    const look = getShaderLook(nextIndex);
    shaderIndex = nextIndex;
    currentLookLabel = look.label;
    applyEntityMaterial(ball, shaderBallMaterials[nextIndex] ?? fallbackShaderMaterial);
    modeText.updateText(`Current look: ${currentLookLabel}`);
  };

  ball.onSetup(({ me }) => {
    const material = Array.isArray(me.mesh?.material)
      ? me.mesh?.material[0]
      : me.mesh?.material;

    if (material instanceof MeshStandardMaterial) {
      standardBallMaterial = material;
      applyColorLook(colorIndex);
    }
  });

  ball.onUpdate(({ me, inputs, delta }) => {
    elapsed += delta;

    const { Horizontal, Vertical } = inputs.p1.axes;
    const { A, B } = inputs.p1.buttons;

    const position = me.getPosition();
    if (!position) {
      return;
    }

    const nextX = Math.max(
      -HALF_ARENA,
      Math.min(HALF_ARENA, position.x + Horizontal.value * MOVE_SPEED * delta),
    );
    const nextZ = Math.max(
      -HALF_ARENA,
      Math.min(HALF_ARENA, position.z + Vertical.value * MOVE_SPEED * delta),
    );
    const hoverY = BALL_BASE_Y + Math.sin(elapsed * 4.5) * 0.08;

    me.setPosition(nextX, hoverY, nextZ);
    me.rotateX(Vertical.value * delta * 4.5);
    me.rotateZ(-Horizontal.value * delta * 4.5);

    if (A.pressed && standardBallMaterial) {
      applyColorLook((colorIndex + 1) % COLOR_LOOKS.length);
    }

    if (B.pressed) {
      applyShaderLook((shaderIndex + 1) % SHADER_LOOKS.length);
    }

    inputText.updateText(
      `Move ${formatAxis(Horizontal.value)}, ${formatAxis(Vertical.value)} | A held ${A.held.toFixed(2)}s | B held ${B.held.toFixed(2)}s`,
    );
  });

  ball.onDestroy(() => {
    shaderBallMaterials.forEach((material) => material.dispose());
  });

  const camera = createCamera({
    position: { x: 0, y: 13, z: 13 },
    target: { x: 0, y: 0, z: 0 },
    damping: 0.12,
  });

  const stage = createStage(
    {
      gravity: { x: 0, y: 0, z: 0 },
      backgroundColor: new Color('#07111d'),
    },
    camera,
  );

  stage.setInputConfiguration(
    mergeInputConfigs(
      useWASDForAxes('p1'),
      useArrowsForAxes('p1'),
      // The themed virtual touch UI (joystick + A/B) lives in
      // `@zylem/game-lib`'s `input-ui/` module. Pass `enabled: true`
      // to force it on for desktop testing; the default `'auto'`
      // would only render it on touch/mobile devices.
      //
      // Equivalent shortcut: drop this call and add
      //   mobile: { controls: { theme: 'lagoon', joysticks: 'left', buttons: ['A', 'B'] } }
      // to the `createGame(...)` config below — `resolveGameConfig` will
      // auto-merge the same `defaultTouchControls(...)` config on mobile.
      defaultTouchControls('p1', {
        enabled: true,
        theme: 'lagoon',
        joysticks: 'left',
        buttons: ['A', 'B'],
        override: {
          style: {
            filter: 'drop-shadow(0 18px 30px rgba(3, 7, 18, 0.42))',
          },
        },
      }),
    ),
  );

  const game = createGame(
    {
      id: 'virtual-touch-ball',
      bodyBackground: '#07111d',
      aspectRatio: 'OneByOne',
      mobile: {
        aspectRatio: 'OneByOne',
        resolution: 'native',
      },
    },
    stage,
    floor,
    ...walls,
    ball,
    titleText,
    modeText,
    inputText,
  );

  return game;
}
