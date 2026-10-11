/**
 * Viewport placement shared by the camera-attached HUD entities.
 *
 * Text, rects, and cooldown icons all pin a canvas-drawn sprite to a point on
 * screen by parenting it to the camera and placing it on a plane `zDistance`
 * in front of the lens. This module holds what they share: the named viewport
 * anchors, the viewport size layouts resolve against, and the camera-local
 * transform for a box of a given pixel size pinned to a point on screen.
 */
import type { OrthographicCamera, PerspectiveCamera } from 'three';
import type { ZylemCamera } from '../camera/zylem-camera';
import type { ViewportSize } from '../device/mobile';

export type { ViewportSize };

/**
 * Reference point on the viewport for positioning UI elements.
 * The offset in `screenPosition` is applied relative to this anchor.
 */
export type ScreenAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/** Fractional viewport coordinates for each anchor point. */
const ANCHOR_FRACTIONS: Record<ScreenAnchor, { x: number; y: number }> = {
  'top-left': { x: 0, y: 0 },
  'top-center': { x: 0.5, y: 0 },
  'top-right': { x: 1, y: 0 },
  'center-left': { x: 0, y: 0.5 },
  center: { x: 0.5, y: 0.5 },
  'center-right': { x: 1, y: 0.5 },
  'bottom-left': { x: 0, y: 1 },
  'bottom-center': { x: 0.5, y: 1 },
  'bottom-right': { x: 1, y: 1 },
};

export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * Where an anchor sits on the viewport, as 0..1 fractions from the top-left.
 * Unknown values fall back to `top-left`, since options can come from
 * untyped scene data.
 */
export function anchorFractions(anchor: ScreenAnchor): ScreenPoint {
  return ANCHOR_FRACTIONS[anchor] ?? ANCHOR_FRACTIONS['top-left'];
}

/**
 * The point `offset` pixels from `anchor`, in pixels from the viewport's
 * top-left. Positive x is right, positive y is down.
 */
export function anchoredPoint(
  anchor: ScreenAnchor,
  offset: ScreenPoint,
  viewport: ViewportSize,
): ScreenPoint {
  const fraction = anchorFractions(anchor);
  return {
    x: fraction.x * viewport.width + offset.x,
    y: fraction.y * viewport.height + offset.y,
  };
}

/**
 * The size HUD layouts resolve against: the camera's render resolution, which
 * its projection is built from. A game with a fixed internal resolution
 * renders at that size and scales the canvas, so the HUD scales with it.
 */
export function viewportSize(
  camera: Pick<ZylemCamera, 'screenResolution'> | null | undefined,
): ViewportSize {
  return {
    width: Math.max(1, camera?.screenResolution?.x ?? 1),
    height: Math.max(1, camera?.screenResolution?.y ?? 1),
  };
}

/**
 * Half the width and height of the visible plane `zDistance` in front of the
 * camera, in camera-local units.
 */
export function viewPlaneHalfExtents(
  camera: PerspectiveCamera | OrthographicCamera,
  zDistance: number,
): { halfWidth: number; halfHeight: number } {
  const zoom = camera.zoom || 1;
  if ((camera as PerspectiveCamera).isPerspectiveCamera) {
    const perspective = camera as PerspectiveCamera;
    const halfHeight =
      (Math.tan((perspective.fov * Math.PI) / 180 / 2) * zDistance) / zoom;
    return { halfWidth: halfHeight * perspective.aspect, halfHeight };
  }
  if ((camera as OrthographicCamera).isOrthographicCamera) {
    const orthographic = camera as OrthographicCamera;
    return {
      halfWidth: (orthographic.right - orthographic.left) / 2 / zoom,
      halfHeight: (orthographic.top - orthographic.bottom) / 2 / zoom,
    };
  }
  return { halfWidth: 1, halfHeight: 1 };
}

export interface ViewportPlacementInput {
  camera: PerspectiveCamera | OrthographicCamera;
  viewport: ViewportSize;
  /** Where the pivot goes, in pixels from the viewport's top-left. */
  point: ScreenPoint;
  /** Point of the element placed on `point`, as 0..1 fractions of its box from the top-left. */
  pivot: ScreenPoint;
  /** Element size in pixels. */
  size: ViewportSize;
  zDistance: number;
}

export interface ViewportPlacement {
  /** Camera-local position of the element's centre. */
  position: { x: number; y: number; z: number };
  /** Scale that draws a unit sprite at the element's pixel size. */
  scale: { x: number; y: number };
}

/**
 * Camera-local transform that draws a box `size` pixels big with its `pivot`
 * on `point`, on the plane `zDistance` in front of the lens.
 */
export function placeOnViewport(input: ViewportPlacementInput): ViewportPlacement {
  const zDistance = Math.max(0.001, input.zDistance);
  const { halfWidth, halfHeight } = viewPlaneHalfExtents(input.camera, zDistance);
  const unitsPerPixel = (halfHeight * 2) / input.viewport.height;
  const scaleX = Math.max(0.0001, input.size.width * unitsPerPixel);
  const scaleY = Math.max(0.0001, input.size.height * unitsPerPixel);
  const ndcX = (input.point.x / input.viewport.width) * 2 - 1;
  const ndcY = 1 - (input.point.y / input.viewport.height) * 2;
  return {
    position: {
      x: ndcX * halfWidth + (0.5 - input.pivot.x) * scaleX,
      y: ndcY * halfHeight + (input.pivot.y - 0.5) * scaleY,
      z: -zDistance,
    },
    scale: { x: scaleX, y: scaleY },
  };
}
