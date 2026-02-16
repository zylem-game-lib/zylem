import { MeshBasicMaterial } from 'three';
import type { StageEntity } from '../interfaces/entity';
import type { CameraWrapper } from './camera';

/**
 * Options for setCameraFeed.
 */
export interface CameraFeedOptions {
	/** Render target width in pixels. Only used when the camera does not
	 *  already have a render target. @default 512 */
	width?: number;
	/** Render target height in pixels. Only used when the camera does not
	 *  already have a render target. @default 512 */
	height?: number;
}

/**
 * Display a camera's live feed on an entity's mesh surface.
 *
 * This is the primary user-facing function for "jumbotron", security-camera,
 * or broadcast-style effects. It ensures the camera has an offscreen render
 * target and replaces the entity's mesh material with one that shows the
 * camera's rendered output.
 *
 * @param entity  The entity whose mesh will display the camera feed.
 * @param camera  The camera whose view will be rendered to the texture.
 * @param options Optional dimensions for the render target.
 *
 * @example
 * ```ts
 * const feedCam = createCamera({
 *   perspective: Perspectives.ThirdPerson,
 *   position: new Vector3(0, 30, 60),
 *   target: new Vector3(0, 0, 0),
 *   renderToTexture: { width: 1024, height: 576 },
 * });
 *
 * const screen = createBox({ size: { x: 16, y: 9, z: 0.2 } });
 * screen.onSetup(({ me }) => {
 *   setCameraFeed(me, feedCam);
 * });
 * ```
 */
export function setCameraFeed(
	entity: StageEntity,
	camera: CameraWrapper,
	options?: CameraFeedOptions,
): void {
	const cam = camera.cameraRef;

	// Ensure the camera has a render target
	if (!cam.renderTarget) {
		const w = options?.width ?? 512;
		const h = options?.height ?? 512;
		cam.createRenderTarget(w, h);
	}

	const texture = cam.getRenderTexture();
	if (!texture) {
		console.warn('setCameraFeed: Failed to obtain render texture from camera.');
		return;
	}

	if (!entity.mesh) {
		console.warn('setCameraFeed: Entity has no mesh to apply the camera feed to.');
		return;
	}

	// Replace the mesh material with one that displays the camera feed
	const material = new MeshBasicMaterial({ map: texture });
	entity.mesh.material = material;
}
