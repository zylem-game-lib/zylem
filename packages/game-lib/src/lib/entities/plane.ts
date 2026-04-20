import { ColliderDesc } from '@dimforge/rapier3d-compat';
import { PlaneGeometry, Vector2, Vector3 } from 'three';
import { TexturePath } from '../graphics/material';
import { BaseNode } from '../core/base-node';
import { GameEntityOptions, GameEntity } from './entity';
import { EntityBuilder } from './builder';
import { EntityCollisionBuilder } from './builder';
import { EntityMeshBuilder } from './builder';
import { XZPlaneGeometry } from '../graphics/geometries/XZPlaneGeometry';
import { createEntity } from './create';
import { Vec2Input, VEC2_ONE, toThreeVector2 } from '../core/vector';
import { deepMergeValues } from '../core/clone-utils';

type ZylemPlaneOptions = GameEntityOptions & {
  tile?: Vec2Input;
  repeat?: Vec2Input;
  texture?: TexturePath;
  /**
   * Number of subdivisions per axis. Used for both X and Z unless
   * `subdivisionsX` / `subdivisionsZ` are set, or a `heightMap` /
   * `heightMap2D` is provided (in which case subdivisions are derived
   * from the height data).
   */
  subdivisions?: number;
  /** Subdivisions along the X axis (overrides `subdivisions`). */
  subdivisionsX?: number;
  /** Subdivisions along the Z axis (overrides `subdivisions`). */
  subdivisionsZ?: number;
  /**
   * If true and no explicit heightmap is provided, each vertex gets a
   * random height in `[0, 4 * heightScale]`.
   */
  randomizeHeight?: boolean;
  /**
   * Absolute heights along the X axis, one value per vertex-column
   * (constant along Z). `length` defines the X vertex count, so
   * `subdivisionsX` becomes `length - 1`. Values are absolute world-space
   * heights above/below the plane (multiplied by `heightScale`, default 1).
   *
   * Example: `heightMap: [10, 1, -1, 10]` produces 4 X-columns with those
   * absolute heights, forming ridges parallel to the Z axis.
   *
   * Takes precedence over `randomizeHeight`.
   */
  heightMap?: number[];
  /**
   * Absolute heights as a 2D grid, indexed `heightMap2D[z][x]`. The outer
   * array's length defines the Z vertex count and each inner array's
   * length defines the X vertex count (all rows must share the same X
   * length). Values are absolute (multiplied by `heightScale`).
   *
   * Takes precedence over `heightMap` and `randomizeHeight`.
   */
  heightMap2D?: number[][];
  /** Multiplier applied to heightmap / random heights (default 1). */
  heightScale?: number;
};

const DEFAULT_SUBDIVISIONS = 4;

import { commonDefaults } from './common';

const planeDefaults: ZylemPlaneOptions = {
  ...commonDefaults,
  tile: new Vector2(10, 10),
  repeat: new Vector2(1, 1),
  collision: {
    static: true,
  },
  subdivisions: DEFAULT_SUBDIVISIONS,
  randomizeHeight: false,
  heightScale: 1,
};

/**
 * Resolve the X/Z subdivisions for a plane, honouring explicit axis
 * options, then any supplied heightmap's shape, then the scalar
 * `subdivisions`, finally falling back to `DEFAULT_SUBDIVISIONS`.
 */
function resolvePlaneSubdivisions(
  options: ZylemPlaneOptions,
): { subdivisionsX: number; subdivisionsZ: number } {
  const fallback = options.subdivisions ?? DEFAULT_SUBDIVISIONS;
  const hm2D = options.heightMap2D;
  const hm1D = options.heightMap;

  let subdivisionsX = options.subdivisionsX ?? fallback;
  let subdivisionsZ = options.subdivisionsZ ?? fallback;

  if (hm2D && hm2D.length > 0 && hm2D[0]?.length > 0) {
    subdivisionsZ = hm2D.length - 1;
    subdivisionsX = hm2D[0].length - 1;
  } else if (hm1D && hm1D.length > 0) {
    subdivisionsX = hm1D.length - 1;
  }

  return { subdivisionsX, subdivisionsZ };
}

export class PlaneCollisionBuilder extends EntityCollisionBuilder {
  collider(options: ZylemPlaneOptions): ColliderDesc {
    const tile = toThreeVector2(options.tile, VEC2_ONE);
    const { subdivisionsX, subdivisionsZ } = resolvePlaneSubdivisions(options);
    const size = new Vector3(tile.x, 1, tile.y);

    const heightData = ((options._builders
      ?.meshBuilder as unknown) as PlaneMeshBuilder)?.heightData;
    const scale = new Vector3(size.x, 1, size.z);
    let colliderDesc = ColliderDesc.heightfield(
      subdivisionsX,
      subdivisionsZ,
      heightData,
      scale,
    );

    return colliderDesc;
  }
}

export class PlaneMeshBuilder extends EntityMeshBuilder {
  heightData: Float32Array = new Float32Array();
  columnsRows = new Map<number, Map<number, number>>();
  private subdivisionsX: number = DEFAULT_SUBDIVISIONS;
  private subdivisionsZ: number = DEFAULT_SUBDIVISIONS;

  build(options: ZylemPlaneOptions): XZPlaneGeometry {
    const tile = toThreeVector2(options.tile, VEC2_ONE);
    const { subdivisionsX, subdivisionsZ } = resolvePlaneSubdivisions(options);
    this.subdivisionsX = subdivisionsX;
    this.subdivisionsZ = subdivisionsZ;

    const size = new Vector3(tile.x, 1, tile.y);
    const heightScale = options.heightScale ?? 1;

    const geometry = new XZPlaneGeometry(
      size.x,
      size.z,
      subdivisionsX,
      subdivisionsZ,
    );
    const vertexGeometry = new PlaneGeometry(
      size.x,
      size.z,
      subdivisionsX,
      subdivisionsZ,
    );
    const dx = subdivisionsX > 0 ? size.x / subdivisionsX : 1;
    const dz = subdivisionsZ > 0 ? size.z / subdivisionsZ : 1;
    const originalVertices = geometry.attributes.position.array;
    const vertices = vertexGeometry.attributes.position.array;
    const columsRows = new Map<number, Map<number, number>>();

    const hm2D = options.heightMap2D;
    const hm1D = options.heightMap;
    const useRandomHeight = options.randomizeHeight ?? false;

    const clampIndex = (value: number, max: number): number =>
      value < 0 ? 0 : value > max ? max : value;

    for (let i = 0; i < vertices.length; i += 3) {
      const vx = (vertices as any)[i];
      // `PlaneGeometry` lies flat on the XY plane before rotation; its Y
      // axis maps to world-Z here, matching the current sign convention
      // used by the collider generation below.
      const vyAsZ = (vertices as any)[i + 1];
      const xIdx = clampIndex(Math.round((vx + size.x / 2) / dx), subdivisionsX);
      const zIdx = clampIndex(
        Math.round((size.z / 2 - vyAsZ) / dz),
        subdivisionsZ,
      );

      let rawHeight = 0;
      if (hm2D) {
        const row = hm2D[zIdx];
        if (row) rawHeight = row[xIdx] ?? 0;
      } else if (hm1D && hm1D.length > 0) {
        rawHeight = hm1D[xIdx] ?? 0;
      } else if (useRandomHeight) {
        rawHeight = Math.random() * 4;
      }

      const height = rawHeight * heightScale;

      (vertices as any)[i + 2] = height;
      originalVertices[i + 1] = height;
      if (!columsRows.get(zIdx)) {
        columsRows.set(zIdx, new Map());
      }
      columsRows.get(zIdx)!.set(xIdx, height);
    }
    this.columnsRows = columsRows;
    return geometry;
  }

  postBuild(): void {
    const heights: number[] = [];
    // Flatten in X-major order (outer X, inner Z) to match the Rapier
    // heightfield layout used by `PlaneCollisionBuilder`, which passes
    // `(nrows=subdivisionsX, ncols=subdivisionsZ, ...)`.
    for (let x = 0; x <= this.subdivisionsX; ++x) {
      for (let z = 0; z <= this.subdivisionsZ; ++z) {
        const row = this.columnsRows.get(z);
        heights.push(row?.get(x) ?? 0);
      }
    }
    this.heightData = new Float32Array(heights);
  }
}

export class PlaneBuilder extends EntityBuilder<ZylemPlane, ZylemPlaneOptions> {
  protected createEntity(options: Partial<ZylemPlaneOptions>): ZylemPlane {
    return new ZylemPlane(options);
  }
}

export const PLANE_TYPE = Symbol('Plane');

export class ZylemPlane extends GameEntity<ZylemPlaneOptions> {
  static type = PLANE_TYPE;

  constructor(options?: ZylemPlaneOptions) {
    super();
    this.options = deepMergeValues(planeDefaults, options);
  }
}

type PlaneOptions = BaseNode | Partial<ZylemPlaneOptions>;

export function createPlane(...args: Array<PlaneOptions>): ZylemPlane {
  return createEntity<ZylemPlane, ZylemPlaneOptions>({
    args,
    defaultConfig: planeDefaults,
    EntityClass: ZylemPlane,
    BuilderClass: PlaneBuilder,
    MeshBuilderClass: PlaneMeshBuilder,
    CollisionBuilderClass: PlaneCollisionBuilder,
    entityType: ZylemPlane.type,
    cloneFactory: options => createPlane(options ?? {}),
  });
}
