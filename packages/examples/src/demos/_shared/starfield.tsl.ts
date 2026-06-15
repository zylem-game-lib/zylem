/**
 * Galaxy backdrop shader in TSL (Three.js Shading Language)
 * WebGPU-compatible, performance-first.
 *
 * Renders a starry galaxy: a soft diagonal galactic dust band (cheap 2-octave
 * value noise) plus sparse twinkling star layers. Uses flat screen-space `uv()`
 * (no `atan`/`asin`/`normalize`) so it stays cheap; this is valid for the
 * fixed-camera demos that consume it.
 */
import {
  Fn,
  time,
  positionWorld,
  normalize,
  vec2,
  vec3,
  vec4,
  float,
  floor,
  fract,
  sin,
  abs,
  dot,
  length,
  mix,
  max,
} from 'three/tsl';
import type { ZylemTSLShader } from '@zylem/game-lib/graphics';

// Star colors
const starColorWarm = vec3(1.0, 0.9, 0.7);
const starColorCool = vec3(0.7, 0.85, 1.0);
const starColorWhite = vec3(1.0, 1.0, 1.0);
const backgroundColor = vec3(0.01, 0.01, 0.03);

// Galactic dust colors (cool blue edges -> warm magenta core)
const dustCool = vec3(0.05, 0.09, 0.24);
const dustWarm = vec3(0.26, 0.11, 0.30);
// Bright ridge color along the galactic core
const coreColor = vec3(0.38, 0.28, 0.55);

// Band orientation (precomputed constants so the GPU does no trig for the band)
// Note: the skybox/camera only exposes a small uv region around 0.5, so the
// band must be narrow to read as a defined diagonal stripe (not a flat wash).
const BAND_ANGLE = 0.6;
const BAND_SIN = Math.sin(BAND_ANGLE);
const BAND_COS = Math.cos(BAND_ANGLE);
const BAND_WIDTH = 0.18;

/**
 * Hash function for pseudo-random values
 */
const hash = Fn(([p]: [any]) => {
  const dotResult = dot(p, vec2(127.1, 311.7));
  return fract(sin(dotResult).mul(43758.5453));
});

/**
 * Cheap bilinear value noise (4 hash calls, smoothstep interpolation)
 */
const valueNoise = Fn(([n]: [any]) => {
  const i = floor(n);
  const f: any = fract(n);
  // smoothstep weights without an extra import: f*f*(3-2f)
  const u: any = f.mul(f).mul(f.mul(-2.0).add(3.0));

  const a = hash(i);
  const b = hash(i.add(vec2(1.0, 0.0)));
  const c = hash(i.add(vec2(0.0, 1.0)));
  const d = hash(i.add(vec2(1.0, 1.0)));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
});

/**
 * Cheap star layer (1 star per cell, no neighbor search)
 */
const starLayer = Fn(([uvInput, scale, t]: [any, any, any]) => {
  const grid = uvInput.mul(scale);
  const id = floor(grid);
  const f = fract(grid).sub(0.5);

  const h = hash(id);

  // Sparse stars - only high hash values
  // Using a clamped ramp as mask instead of an early return
  const sparseMask = max(float(0.0), h.sub(0.80).mul(5.0)); // ~= h > 0.80

  // Jittered star position
  const starPosX = hash(id.add(1.3)).sub(0.5);
  const starPosY = hash(id.add(2.1)).sub(0.5);
  const starPos = vec2(starPosX, starPosY);
  const d = f.sub(starPos);

  const dist = length(d);

  // Star size: small points (the wide skybox already enlarges them on screen)
  const size = mix(float(0.02), float(0.05), h);

  // Cheap brightness falloff: bright core + soft glow halo
  const core = max(float(0.0), float(1.0).sub(dist.div(size)));
  const glow = max(float(0.0), float(1.0).sub(dist.div(size.mul(3.0)))).mul(
    0.2,
  );

  // Twinkle (single sine)
  const twinkle = float(0.7).add(
    sin(t.mul(float(0.6).add(h)).add(h.mul(6.28))).mul(0.3),
  );

  return core.add(glow).mul(twinkle).mul(sparseMask);
});

/**
 * Main galaxy color node
 */
const galaxyColorNode = Fn(() => {
  const t = time;
  // Derive a screen-like coordinate from the view direction. `uv()` is constant
  // across this background skybox, so we use `positionWorld` instead. The camera
  // is fixed, so the direction's x/y map monotonically to the screen and we can
  // skip the spherical atan/asin (keeping the shader cheap).
  const dir: any = normalize(positionWorld);
  const uvCoord: any = vec2(dir.x, dir.y).mul(1.3).add(0.5);

  // Background
  let color: any = vec3(backgroundColor);

  // --- Galactic dust band -------------------------------------------------
  // Perpendicular distance to a diagonal line through the screen center.
  const p = uvCoord.sub(0.5);
  const bandDist = p.x.mul(BAND_SIN).add(p.y.mul(BAND_COS));
  // Triangular falloff, squared for a softer glow.
  const bandFalloff = max(float(0.0), float(1.0).sub(abs(bandDist).div(BAND_WIDTH)));
  const band = bandFalloff.mul(bandFalloff);

  // 2-octave value noise to make the dust clumpy (slowly drifting).
  const noiseCoord = uvCoord.mul(4.0);
  const n1 = valueNoise(noiseCoord.add(t.mul(0.01)));
  const n2 = valueNoise(noiseCoord.mul(2.0).sub(t.mul(0.008)));
  const dust = n1.mul(0.6).add(n2.mul(0.4));

  // Mix dust colors by noise, modulate by the band and the dust density.
  const dustDensity = dust.mul(0.7).add(0.3);
  const dustColor = mix(dustCool, dustWarm, dust);
  color = color.add(dustColor.mul(band).mul(dustDensity));

  // Bright galactic core ridge (band^3 concentrates brightness on the spine).
  const coreGlow = band.mul(band).mul(band);
  color = color.add(coreColor.mul(coreGlow).mul(dustDensity));

  // Subtle nebula tint (cheap)
  const nebula = sin(uvCoord.x.mul(2.0).add(t.mul(0.02)))
    .mul(sin(uvCoord.y.mul(1.5).sub(t.mul(0.01))))
    .mul(0.5)
    .add(0.5);
  color = color.add(vec3(0.02, 0.01, 0.04).mul(nebula));

  // --- Stars --------------------------------------------------------------
  const starsA = starLayer(uvCoord, float(60.0), t);
  const starsB = starLayer(uvCoord.add(0.37), float(130.0), t.mul(0.8));
  const allStars = starsA.add(starsB.mul(0.7));

  // Denser-looking stars inside the galactic band (reuses `band`, no extra cost)
  const starBoost = mix(float(1.0), float(1.5), band);

  // Star color
  const colorMix = hash(floor(uvCoord.mul(60.0)));
  const starCol = mix(starColorWarm, starColorCool, colorMix);
  const finalStarCol = mix(starCol, starColorWhite, float(0.5));

  color = color.add(finalStarCol.mul(allStars).mul(starBoost).mul(1.2));

  return vec4(color, float(1.0));
})();

/**
 * TSL galaxy backdrop shader for WebGPU.
 *
 * Exported as `starfieldTSL` for backward compatibility with the demos that
 * already consume it as `backgroundShader`.
 */
export const starfieldTSL: ZylemTSLShader = {
  colorNode: galaxyColorNode,
  transparent: false,
};
