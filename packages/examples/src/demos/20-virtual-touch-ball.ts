import {
  createBox,
  createCamera,
  createGame,
  createPlane,
  createSphere,
  createStage,
  createText,
  fireShader,
  mergeInputConfigs,
  starShader,
  useArrowsForAxes,
  useVirtualControls,
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

const JOYSTICK_BASE_SVG = `
  <svg viewBox="0 0 140 140" width="100%" height="100%" aria-hidden="true">
    <circle cx="70" cy="70" r="62" fill="rgba(8,14,24,0.70)" stroke="rgba(207,250,254,0.85)" stroke-width="4" />
    <circle cx="70" cy="70" r="42" fill="rgba(20,184,166,0.08)" stroke="rgba(45,212,191,0.35)" stroke-width="2" />
    <path d="M70 24 L78 40 L62 40 Z" fill="rgba(207,250,254,0.55)" />
    <path d="M116 70 L100 78 L100 62 Z" fill="rgba(207,250,254,0.55)" />
    <path d="M70 116 L62 100 L78 100 Z" fill="rgba(207,250,254,0.55)" />
    <path d="M24 70 L40 62 L40 78 Z" fill="rgba(207,250,254,0.55)" />
  </svg>
`;

const JOYSTICK_THUMB_SVG = `
  <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
    <circle cx="32" cy="32" r="28" fill="rgba(13,148,136,0.88)" stroke="rgba(240,253,250,0.95)" stroke-width="3.5" />
    <circle cx="32" cy="32" r="15" fill="rgba(240,253,250,0.16)" stroke="rgba(240,253,250,0.35)" stroke-width="1.5" />
  </svg>
`;

function createTouchButtonSvg(label: 'A' | 'B', accent: string): string {
  return `
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
      <circle cx="50" cy="50" r="45" fill="rgba(8,14,24,0.74)" stroke="${accent}" stroke-width="4.5" />
      <circle cx="50" cy="50" r="33" fill="${accent}" opacity="0.18" />
      <text
        x="50"
        y="60"
        text-anchor="middle"
        font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="34"
        font-weight="700"
        fill="${accent}"
      >${label}</text>
    </svg>
  `;
}

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
      useVirtualControls('p1', {
        enabled: true,
        style: {
          filter: 'drop-shadow(0 18px 30px rgba(3, 7, 18, 0.42))',
        },
        joysticks: {
          left: {
            position: { left: 24, bottom: 28 },
            size: 148,
            thumbSize: 62,
            maxDistance: 48,
            svg: {
              base: JOYSTICK_BASE_SVG,
              thumb: JOYSTICK_THUMB_SVG,
            },
          },
          right: false,
        },
        buttons: {
          A: {
            position: { right: 108, bottom: 64 },
            size: 78,
            svg: createTouchButtonSvg('A', '#8b5cf6'),
          },
          B: {
            position: { right: 24, bottom: 122 },
            size: 78,
            svg: createTouchButtonSvg('B', '#fb7185'),
          },
          X: false,
          Y: false,
          Start: false,
          Select: false,
          L: false,
          R: false,
          LTrigger: false,
          RTrigger: false,
          Up: false,
          Down: false,
          Left: false,
          Right: false,
        },
      }),
    ),
  );

  const game = createGame(
    {
      id: 'virtual-touch-ball',
      bodyBackground: '#07111d',
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
