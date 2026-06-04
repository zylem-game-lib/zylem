import { Vector2 as ThreeVector2, Vector3 as ThreeVector3 } from 'three';
import { Vector3 as RapierVector3 } from '@dimforge/rapier3d-compat';

export type Vec2 = ThreeVector2;
export type Vec3 = ThreeVector3 | RapierVector3;

export type Vec2Components = { x: number; y: number };
export type Vec3Components = { x: number; y: number; z: number };

type Vec2Tuple = readonly [number?, number?] & { x?: number; y?: number };
type Vec3Tuple = readonly [number?, number?, number?] & {
  x?: number;
  y?: number;
  z?: number;
};

export type Vec2Input = Vec2 | { x?: number; y?: number } | Vec2Tuple;
export type Vec3Input =
  | Vec3
  | { x?: number; y?: number; z?: number }
  | Vec3Tuple;

export const VEC2_ZERO: Readonly<Vec2Components> = Object.freeze({
  x: 0,
  y: 0,
});
export const VEC2_ONE: Readonly<Vec2Components> = Object.freeze({ x: 1, y: 1 });
export const VEC3_ZERO: Readonly<Vec3Components> = Object.freeze({
  x: 0,
  y: 0,
  z: 0,
});
export const VEC3_ONE: Readonly<Vec3Components> = Object.freeze({
  x: 1,
  y: 1,
  z: 1,
});

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function hasVec2Shape(value: unknown): value is { x?: unknown; y?: unknown } {
  return (
    value != null && typeof value === 'object' && ('x' in value || 'y' in value)
  );
}

function hasVec3Shape(
  value: unknown,
): value is { x?: unknown; y?: unknown; z?: unknown } {
  return (
    value != null &&
    typeof value === 'object' &&
    ('x' in value || 'y' in value || 'z' in value)
  );
}

function getArrayAxis(
  value: readonly unknown[] | undefined,
  index: number,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }
  const axis = value[index];
  return isFiniteNumber(axis) ? axis : fallback;
}

function getObjectAxis(
  value: { [key: string]: unknown } | undefined,
  key: 'x' | 'y' | 'z',
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }
  const axis = value[key];
  return isFiniteNumber(axis) ? axis : fallback;
}

function getVec2Axis(
  value: Vec2Input | Partial<Vec2Components> | null | undefined,
  key: 'x' | 'y',
  index: 0 | 1,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }
  if (Array.isArray(value)) {
    return getArrayAxis(value, index, fallback);
  }
  return getObjectAxis(value as { [key: string]: unknown }, key, fallback);
}

function getVec3Axis(
  value: Vec3Input | Partial<Vec3Components> | null | undefined,
  key: 'x' | 'y' | 'z',
  index: 0 | 1 | 2,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }
  if (Array.isArray(value)) {
    return getArrayAxis(value, index, fallback);
  }
  return getObjectAxis(value as { [key: string]: unknown }, key, fallback);
}

function normalizeVec2Defaults(
  defaults: Vec2Input | Partial<Vec2Components> | null | undefined,
): Vec2Components {
  return {
    x: getVec2Axis(defaults, 'x', 0, 0),
    y: getVec2Axis(defaults, 'y', 1, 0),
  };
}

function normalizeVec3Defaults(
  defaults: Vec3Input | Partial<Vec3Components> | null | undefined,
): Vec3Components {
  return {
    x: getVec3Axis(defaults, 'x', 0, 0),
    y: getVec3Axis(defaults, 'y', 1, 0),
    z: getVec3Axis(defaults, 'z', 2, 0),
  };
}

export function isVec2Input(value: unknown): value is Vec2Input {
  return Array.isArray(value) || hasVec2Shape(value);
}

export function isVec3Input(value: unknown): value is Vec3Input {
  return Array.isArray(value) || hasVec3Shape(value);
}

export function normalizeVec2(
  input?: Vec2Input | null,
  defaults: Vec2Input | Partial<Vec2Components> = VEC2_ZERO,
): Vec2Components {
  const fallback = normalizeVec2Defaults(defaults);
  return {
    x: getVec2Axis(input, 'x', 0, fallback.x),
    y: getVec2Axis(input, 'y', 1, fallback.y),
  };
}

export function normalizeVec3(
  input?: Vec3Input | null,
  defaults: Vec3Input | Partial<Vec3Components> = VEC3_ZERO,
): Vec3Components {
  const fallback = normalizeVec3Defaults(defaults);
  return {
    x: getVec3Axis(input, 'x', 0, fallback.x),
    y: getVec3Axis(input, 'y', 1, fallback.y),
    z: getVec3Axis(input, 'z', 2, fallback.z),
  };
}

export function toThreeVector2(
  input?: Vec2Input | null,
  defaults: Vec2Input | Partial<Vec2Components> = VEC2_ZERO,
): ThreeVector2 {
  const { x, y } = normalizeVec2(input, defaults);
  return new ThreeVector2(x, y);
}

export function toThreeVector3(
  input?: Vec3Input | null,
  defaults: Vec3Input | Partial<Vec3Components> = VEC3_ZERO,
): ThreeVector3 {
  const { x, y, z } = normalizeVec3(input, defaults);
  return new ThreeVector3(x, y, z);
}

export function toRapierVector3(
  input?: Vec3Input | null,
  defaults: Vec3Input | Partial<Vec3Components> = VEC3_ZERO,
): RapierVector3 {
  const { x, y, z } = normalizeVec3(input, defaults);
  return new RapierVector3(x, y, z);
}
