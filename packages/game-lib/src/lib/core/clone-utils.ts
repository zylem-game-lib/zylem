import { Color, Vector2, Vector3 } from 'three';
import { Vector3 as RapierVector3 } from '@dimforge/rapier3d-compat';
import {
  isVec2Input,
  isVec3Input,
  toRapierVector3,
  toThreeVector2,
  toThreeVector3,
} from './vector';

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function deepCloneValue<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'function' || typeof value !== 'object') {
    return value;
  }

  if (
    value instanceof Color ||
    value instanceof Vector2 ||
    value instanceof Vector3
  ) {
    return value.clone() as T;
  }

  if (value instanceof RapierVector3) {
    return new RapierVector3(value.x, value.y, value.z) as T;
  }

  if (value instanceof Float32Array) {
    return new Float32Array(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map(item => deepCloneValue(item)) as T;
  }

  if (isPlainObject(value)) {
    const cloned: PlainObject = {};
    for (const [key, entry] of Object.entries(value)) {
      if (key === '_builders') {
        continue;
      }
      cloned[key] = deepCloneValue(entry);
    }
    return cloned as T;
  }

  return value;
}

export function deepMergeValues<T>(base: T, overrides?: Partial<T>): T {
  const clonedBase = deepCloneValue(base);
  if (!overrides) {
    return clonedBase;
  }

  if (!isPlainObject(clonedBase) || !isPlainObject(overrides)) {
    return deepCloneValue(overrides as T);
  }

  const result = clonedBase as PlainObject;

  for (const [key, overrideValue] of Object.entries(overrides)) {
    if (key === '_builders' || overrideValue === undefined) {
      continue;
    }

    const currentValue = result[key];
    if (key === 'shader') {
      result[key] = deepCloneValue(overrideValue);
      continue;
    }

    if (currentValue instanceof Vector2 && isVec2Input(overrideValue)) {
      result[key] = toThreeVector2(overrideValue, currentValue);
      continue;
    }

    if (currentValue instanceof Vector3 && isVec3Input(overrideValue)) {
      result[key] = toThreeVector3(overrideValue, currentValue);
      continue;
    }

    if (currentValue instanceof RapierVector3 && isVec3Input(overrideValue)) {
      result[key] = toRapierVector3(overrideValue, currentValue);
      continue;
    }

    if (isPlainObject(currentValue) && isPlainObject(overrideValue)) {
      result[key] = deepMergeValues(currentValue, overrideValue);
      continue;
    }

    result[key] = deepCloneValue(overrideValue);
  }

  return result as T;
}
